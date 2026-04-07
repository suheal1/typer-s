import { motion } from 'motion/react';
import { Users, Share2, Play, UserMinus, Monitor, LogOut, Settings, Timer } from 'lucide-react';
import { Socket } from 'socket.io-client';
import { RaceSession } from '../types';
import { cn } from '../lib/utils';
import { useState } from 'react';

interface LobbyProps {
  session: RaceSession;
  socket: Socket;
  isAdmin: boolean;
}

export default function Lobby({ session, socket, isAdmin }: LobbyProps) {
  const [duration, setDuration] = useState(60);
  const [copySuccess, setCopySuccess] = useState(false);

  const participants = Array.isArray(session.participants) ? session.participants : [];

  const copyInviteLink = () => {
    const url = `${window.location.origin}/race/${session.id}`;
    navigator.clipboard.writeText(url);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const startRace = () => {
    socket.emit('race:start', { sessionId: session.id, duration });
  };

  const kickParticipant = (id: string) => {
    socket.emit('participant:kick', { sessionId: session.id, participantId: id });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-8">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-6"
        >
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-3xl font-bold">Race Lobby</h2>
              <p className="text-slate-400">Waiting for participants to join...</p>
            </div>
            <div className="flex items-center gap-3 px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400 font-bold">
              <Users className="w-5 h-5" />
              {participants.length} / 50
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <button
              onClick={copyInviteLink}
              className="px-6 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl flex items-center gap-2 transition-all font-medium"
            >
              <Share2 className="w-4 h-4" />
              {copySuccess ? 'Copied!' : 'Copy Invite Link'}
            </button>
            <button
              onClick={() => window.open(`/host/${session.id}`, '_blank')}
              className="px-6 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl flex items-center gap-2 transition-all font-medium"
            >
              <Monitor className="w-4 h-4" />
              Open Host View
            </button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {participants.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center justify-between p-4 bg-slate-900/50 border border-slate-800/50 rounded-2xl group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold">
                  {p.username[0].toUpperCase()}
                </div>
                <div>
                  <div className="font-bold flex items-center gap-2">
                    {p.username}
                    {p.isAdmin && <span className="text-[10px] px-1.5 py-0.5 bg-indigo-500/20 text-indigo-400 rounded uppercase tracking-wider">Admin</span>}
                  </div>
                  <div className="text-xs text-slate-500">Joined {new Date(p.joinedAt).toLocaleTimeString()}</div>
                </div>
              </div>
              {isAdmin && !p.isAdmin && (
                <button
                  onClick={() => kickParticipant(p.id)}
                  className="p-2 text-slate-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <UserMinus className="w-5 h-5" />
                </button>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      <div className="space-y-8">
        {isAdmin ? (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-indigo-600 rounded-3xl p-8 space-y-6 shadow-xl shadow-indigo-500/20"
          >
            <h3 className="text-2xl font-bold flex items-center gap-2">
              <Settings className="w-6 h-6" />
              Admin Controls
            </h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-indigo-100">Race Duration (Seconds)</label>
                <select 
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full px-4 py-3 bg-indigo-700 border border-indigo-500 rounded-xl focus:outline-none text-white font-bold"
                >
                  <option value={30}>30 Seconds</option>
                  <option value={60}>60 Seconds</option>
                  <option value={120}>2 Minutes</option>
                  <option value={300}>5 Minutes</option>
                </select>
              </div>

              <button
                onClick={startRace}
                disabled={participants.length < 1}
                className="w-full py-4 bg-white text-indigo-600 hover:bg-indigo-50 font-black rounded-xl transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg"
              >
                <Play className="w-6 h-6 fill-current" />
                START RACE
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-4"
          >
            <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto animate-pulse">
              <Timer className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-xl font-bold">Ready to Race?</h3>
            <p className="text-slate-400">Waiting for the admin to start the competition. Get your fingers ready!</p>
          </motion.div>
        )}

        <div className="bg-slate-900/50 border border-slate-800/50 rounded-3xl p-6 space-y-4">
          <h4 className="font-bold text-slate-400 uppercase text-xs tracking-widest">Race Paragraph Preview</h4>
          <p className="text-sm text-slate-500 italic line-clamp-3">
            {session.paragraph}
          </p>
        </div>
      </div>
    </div>
  );
}
