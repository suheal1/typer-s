import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { getRandomParagraph } from "./src/paragraphs.js";

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// ✅ FIXED PORT (IMPORTANT)
const PORT = process.env.PORT || 3000;

// In-memory storage
const sessions = new Map();

const getSessionData = (sessionId) => {
  const session = sessions.get(sessionId);
  if (!session) return null;

  return {
    ...session,
    participants: Array.from(session.participants.values()),
  };
};

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("session:create", (callback) => {
    const sessionId = uuidv4().slice(0, 8);

    const session = {
      id: sessionId,
      status: "Lobby",
      participants: new Map(),
      duration: 60,
      paragraph: getRandomParagraph(),
    };

    sessions.set(sessionId, session);
    callback(sessionId);
  });

  socket.on("session:join", ({ sessionId, username, isAdmin }) => {
    const session = sessions.get(sessionId);
    if (!session) {
      socket.emit("error", "Session not found");
      return;
    }

    if (session.status !== "Lobby" && !isAdmin) {
      socket.emit("error", "Race already started");
      return;
    }

    if (session.participants.size >= 50 && !isAdmin) {
      socket.emit("error", "Session full");
      return;
    }

    const exists = Array.from(session.participants.values()).find(
      (p) => p.username === username
    );

    if (exists && exists.socketId !== socket.id) {
      socket.emit("error", "Username already taken");
      return;
    }

    const participant = {
      id: socket.id,
      socketId: socket.id,
      username,
      isAdmin,
      wpm: 0,
      accuracy: 100,
      totalTyped: 0,
      correctChars: 0,
      incorrectChars: 0,
      timeTaken: 0,
      status: "Waiting",
      joinedAt: Date.now(),
      lastActivity: Date.now(),
    };

    session.participants.set(socket.id, participant);
    socket.join(sessionId);

    io.to(sessionId).emit("session:updated", getSessionData(sessionId));
  });

  socket.on("race:start", ({ sessionId, duration }) => {
    const session = sessions.get(sessionId);
    if (!session) return;

    session.status = "Starting";
    session.duration = duration;
    session.paragraph = getRandomParagraph();

    session.participants.forEach((p) => {
      p.wpm = 0;
      p.accuracy = 100;
      p.totalTyped = 0;
      p.correctChars = 0;
      p.incorrectChars = 0;
      p.timeTaken = 0;
      p.status = "In Progress";
    });

    io.to(sessionId).emit("session:updated", getSessionData(sessionId));

    let countdown = 3;

    const interval = setInterval(() => {
      io.to(sessionId).emit("race:countdown", countdown);

      if (countdown === 0) {
        clearInterval(interval);

        session.status = "InProgress";
        session.startTime = Date.now();

        io.to(sessionId).emit("race:started", session.startTime);
        io.to(sessionId).emit("session:updated", getSessionData(sessionId));

        setTimeout(() => {
          const current = sessions.get(sessionId);
          if (current && current.status === "InProgress") {
            endRace(sessionId);
          }
        }, duration * 1000);
      }

      countdown--;
    }, 1000);
  });

  socket.on("participant:update", ({ sessionId, stats }) => {
    const session = sessions.get(sessionId);
    if (!session) return;

    const participant = session.participants.get(socket.id);
    if (!participant) return;

    Object.assign(participant, stats);
    participant.lastActivity = Date.now();

    const allFinished = Array.from(session.participants.values())
      .filter((p) => !p.isAdmin)
      .every((p) => p.status === "Completed" || p.status === "DNF");

    if (allFinished && session.status === "InProgress") {
      endRace(sessionId);
    } else {
      io.to(sessionId).emit("session:updated", getSessionData(sessionId));
    }
  });

  socket.on("race:end", (sessionId) => {
    endRace(sessionId);
  });

  socket.on("race:reset", (sessionId) => {
    const session = sessions.get(sessionId);
    if (!session) return;

    session.status = "Lobby";

    session.participants.forEach((p) => {
      p.status = "Waiting";
      p.wpm = 0;
      p.accuracy = 100;
      p.totalTyped = 0;
      p.correctChars = 0;
      p.incorrectChars = 0;
      p.timeTaken = 0;
    });

    io.to(sessionId).emit("session:updated", getSessionData(sessionId));
  });

  socket.on("disconnect", () => {
    sessions.forEach((session, sessionId) => {
      if (session.participants.has(socket.id)) {
        session.participants.delete(socket.id);
        io.to(sessionId).emit("session:updated", getSessionData(sessionId));
      }
    });
  });
});

function endRace(sessionId) {
  const session = sessions.get(sessionId);
  if (!session) return;

  session.status = "Finished";
  session.endTime = Date.now();

  session.participants.forEach((p) => {
    if (p.status === "In Progress") {
      p.status = "DNF";
    }
  });

  io.to(sessionId).emit(
    "race:ended",
    Array.from(session.participants.values())
  );
  io.to(sessionId).emit("session:updated", getSessionData(sessionId));
}

// ✅ SERVE FRONTEND (IMPORTANT)
const distPath = path.join(process.cwd(), "dist");
app.use(express.static(distPath));

app.get("*", (req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

// ✅ START SERVER
httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});