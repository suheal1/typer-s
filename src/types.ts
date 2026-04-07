export type ParticipantStatus = 'Waiting' | 'In Progress' | 'Completed' | 'DNF';

export interface Participant {
  id: string;
  socketId: string;
  username: string;
  isAdmin: boolean;
  wpm: number;
  accuracy: number;
  totalTyped: number;
  correctChars: number;
  incorrectChars: number;
  timeTaken: number;
  status: ParticipantStatus;
  joinedAt: number;
  lastActivity: number;
}

export interface RaceSession {
  id: string;
  adminId: string;
  status: 'Lobby' | 'Starting' | 'InProgress' | 'Finished';
  participants: Map<string, Participant>;
  duration: number; // in seconds
  startTime?: number;
  endTime?: number;
  paragraph: string;
}

export interface ServerToClientEvents {
  'session:updated': (session: any) => void;
  'race:countdown': (count: number) => void;
  'race:started': (startTime: number) => void;
  'race:ended': (results: any[]) => void;
  'error': (message: string) => void;
}

export interface ClientToServerEvents {
  'session:join': (sessionId: string, username: string, isAdmin: boolean) => void;
  'race:start': (sessionId: string, duration: number) => void;
  'race:reset': (sessionId: string) => void;
  'race:end': (sessionId: string) => void;
  'participant:update': (sessionId: string, stats: Partial<Participant>) => void;
  'participant:kick': (sessionId: string, participantId: string) => void;
}
