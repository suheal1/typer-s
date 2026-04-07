import { BrowserRouter as Router, Routes, Route, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import React, { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Users, Timer, Settings, Share2, LogOut, Play, RotateCcw, UserMinus, Download, Monitor, Keyboard, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from './lib/utils';
import { Participant, RaceSession } from './types';

// Components
import Lobby from './components/Lobby';
import Race from './components/Race';
import HostView from './components/HostView';

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-indigo-500/30">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/race/:sessionId" element={<RaceContainer />} />
          <Route path="/host/:sessionId" element={<HostViewContainer />} />
        </Routes>
      </div>
    </Router>
  );
}

function Home() {
  const navigate = useNavigate();
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const newSocket = io();
    setSocket(newSocket);
    return () => { newSocket.disconnect(); };
  }, []);

  const createRace = () => {
    if (!socket) return;
    socket.emit('session:create', (sessionId: string) => {
      navigate(`/race/${sessionId}?admin=true`);
    });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full text-center space-y-8"
      >
        <div className="space-y-4">
          <div className="inline-flex items-center justify-center p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 mb-4">
            <Keyboard className="w-12 h-12 text-indigo-400" />
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight bg-gradient-to-br from-white to-slate-400 bg-clip-text text-transparent">
            Key Racing
          </h1>
          <p className="text-xl text-slate-400 max-w-lg mx-auto">
            The ultimate real-time typing competition platform. Compete with up to 50 participants in high-stakes races.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={createRace}
            className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all hover:scale-105 active:scale-95 shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2"
          >
            <Play className="w-5 h-5" />
            Create New Race
          </button>
          <div className="relative group">
            <input
              type="text"
              placeholder="Enter Session ID"
              className="px-8 py-4 bg-slate-900 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 w-full sm:w-64 transition-all"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  navigate(`/race/${e.currentTarget.value}`);
                }
              }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-12">
          {[
            { icon: Users, title: '50 Players', desc: 'Real-time multiplayer' },
            { icon: Timer, title: 'Live Stats', desc: 'WPM & Accuracy' },
            { icon: Monitor, title: 'Host Mode', desc: 'Projector optimized' },
          ].map((feature, i) => (
            <div key={i} className="p-6 bg-slate-900/50 border border-slate-800/50 rounded-2xl text-left space-y-2">
              <feature.icon className="w-6 h-6 text-indigo-400" />
              <h3 className="font-bold text-slate-200">{feature.title}</h3>
              <p className="text-sm text-slate-500">{feature.desc}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

function RaceContainer() {
  const { sessionId } = useParams();
  const [searchParams] = useSearchParams();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [session, setSession] = useState<RaceSession | null>(null);
  const [username, setUsername] = useState('');
  const [isJoined, setIsJoined] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const isAdmin = searchParams.get('admin') === 'true';

  useEffect(() => {
    const newSocket = io();
    setSocket(newSocket);

    newSocket.on('session:updated', (data) => {
      setSession(data);
    });

    newSocket.on('race:countdown', (count) => {
      setCountdown(count);
    });

    newSocket.on('error', (msg) => {
      setError(msg);
      setIsJoined(false);
    });

    return () => { newSocket.disconnect(); };
  }, []);

  const joinSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!socket || !username.trim()) return;
    socket.emit('session:join', { sessionId, username, isAdmin });
    setIsJoined(true);
  };

  if (!isJoined) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl space-y-6"
        >
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold">Join Race</h2>
            <p className="text-slate-400">Session ID: <span className="text-indigo-400 font-mono">{sessionId}</span></p>
          </div>

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={joinSession} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400 ml-1">Your Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username..."
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                maxLength={15}
                required
              />
            </div>
            <button
              type="submit"
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/20"
            >
              Join Lobby
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  if (!session) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;

  return (
    <div className="max-w-[1600px] mx-auto p-4 md:p-8">
      {session.status === 'Lobby' ? (
        <Lobby session={session} socket={socket!} isAdmin={isAdmin} />
      ) : (
        <Race session={session} socket={socket!} isAdmin={isAdmin} countdown={countdown} />
      )}
    </div>
  );
}

function HostViewContainer() {
  const { sessionId } = useParams();
  const [session, setSession] = useState<RaceSession | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);

  useEffect(() => {
    const socket = io();
    socket.emit('session:join', { sessionId, username: 'HOST_VIEW', isAdmin: true });
    
    socket.on('session:updated', (data) => {
      setSession(data);
    });

    socket.on('race:countdown', (count) => {
      setCountdown(count);
    });

    return () => { socket.disconnect(); };
  }, [sessionId]);

  if (!session) return null;

  return <HostView session={session} countdown={countdown} />;
}
