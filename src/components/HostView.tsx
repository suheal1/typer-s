import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Timer, Users, Keyboard, CheckCircle2, AlertCircle } from 'lucide-react';
import { RaceSession, Participant } from '../types';
import { cn } from '../lib/utils';
import { useEffect, useState } from 'react';

interface HostViewProps {
  session: RaceSession;
  countdown: number | null;
}

export default function HostView({ session, countdown }: HostViewProps) {
  const [timeLeft, setTimeLeft] = useState(session.duration);

  const participants = Array.isArray(session.participants) ? session.participants : [];

  useEffect(() => {
    if (session.status === 'InProgress' && session.startTime) {
      const interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - session.startTime!) / 1000);
        const remaining = Math.max(0, session.duration - elapsed);
        setTimeLeft(remaining);
        if (remaining === 0) clearInterval(interval);
      }, 100);
      return () => clearInterval(interval);
    }
  }, [session.status, session.startTime, session.duration]);

  const sortedParticipants = [...participants].sort((a, b) => {
    if (a.status === 'Completed' && b.status !== 'Completed') return -1;
    if (a.status !== 'Completed' && b.status === 'Completed') return 1;
    return b.wpm - a.wpm || b.accuracy - a.accuracy || a.timeTaken - b.timeTaken;
  });

  const top3 = sortedParticipants.slice(0, 3);

  return (
    <div className="min-h-screen bg-slate-950 p-12 flex flex-col gap-12 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="p-4 bg-indigo-600 rounded-3xl shadow-xl shadow-indigo-500/20">
            <Keyboard className="w-12 h-12 text-white" />
          </div>
          <div className="space-y-1">
            <h1 className="text-5xl font-black tracking-tight text-white">Key Racing</h1>
            <p className="text-xl text-slate-400 font-medium">Session ID: <span className="text-indigo-400 font-mono">{session.id}</span></p>
          </div>
        </div>

        <div className="flex items-center gap-12">
          <div className="text-center space-y-1">
            <div className="text-sm font-bold text-slate-500 uppercase tracking-widest">Time Remaining</div>
            <div className={cn("text-7xl font-black tabular-nums", timeLeft < 10 ? "text-red-400 animate-pulse" : "text-white")}>
              {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
            </div>
          </div>
          <div className="text-center space-y-1">
            <div className="text-sm font-bold text-slate-500 uppercase tracking-widest">Participants</div>
            <div className="text-7xl font-black text-white tabular-nums">
              {participants.length}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-12 min-h-0">
        {/* Top 3 Podium */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          <div className="grid grid-cols-3 items-end gap-6 h-[400px]">
            {/* 2nd Place */}
            {top3[1] && (
              <motion.div 
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center gap-4"
              >
                <div className="text-4xl font-black text-slate-300">🥈 {top3[1].username}</div>
                <div className="w-full bg-slate-800 rounded-t-3xl p-8 text-center space-y-2 h-[250px] flex flex-col justify-center border-x border-t border-slate-700 shadow-2xl">
                  <div className="text-6xl font-black text-white">{top3[1].wpm}</div>
                  <div className="text-xl font-bold text-slate-400 uppercase tracking-widest">WPM</div>
                  <div className="text-sm font-medium text-slate-500">{top3[1].accuracy}% Accuracy</div>
                </div>
              </motion.div>
            )}

            {/* 1st Place */}
            {top3[0] && (
              <motion.div 
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="flex flex-col items-center gap-4"
              >
                <div className="text-5xl font-black text-yellow-500 flex flex-col items-center gap-2">
                  <Trophy className="w-12 h-12 text-yellow-500 animate-bounce" />
                  🥇 {top3[0].username}
                </div>
                <div className="w-full bg-indigo-600 rounded-t-3xl p-8 text-center space-y-2 h-[350px] flex flex-col justify-center shadow-2xl shadow-indigo-500/30">
                  <div className="text-8xl font-black text-white">{top3[0].wpm}</div>
                  <div className="text-2xl font-bold text-indigo-100 uppercase tracking-widest">WPM</div>
                  <div className="text-lg font-medium text-indigo-200">{top3[0].accuracy}% Accuracy</div>
                </div>
              </motion.div>
            )}

            {/* 3rd Place */}
            {top3[2] && (
              <motion.div 
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex flex-col items-center gap-4"
              >
                <div className="text-3xl font-black text-amber-700">🥉 {top3[2].username}</div>
                <div className="w-full bg-slate-900 rounded-t-3xl p-8 text-center space-y-2 h-[180px] flex flex-col justify-center border-x border-t border-slate-800 shadow-2xl">
                  <div className="text-5xl font-black text-white">{top3[2].wpm}</div>
                  <div className="text-lg font-bold text-slate-400 uppercase tracking-widest">WPM</div>
                  <div className="text-xs font-medium text-slate-500">{top3[2].accuracy}% Accuracy</div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Large Leaderboard Table */}
          <div className="flex-1 bg-slate-900/50 border border-slate-800/50 rounded-3xl p-8 overflow-hidden flex flex-col">
            <div className="grid grid-cols-6 gap-4 pb-4 border-b border-slate-800 text-xs font-bold text-slate-500 uppercase tracking-widest">
              <div className="col-span-1">Rank</div>
              <div className="col-span-2">Participant</div>
              <div className="col-span-1 text-right">WPM</div>
              <div className="col-span-1 text-right">Accuracy</div>
              <div className="col-span-1 text-right">Status</div>
            </div>
            <div className="flex-1 overflow-y-auto pt-4 space-y-2 custom-scrollbar">
              {sortedParticipants.map((p, i) => (
                <motion.div 
                  key={p.id}
                  layout
                  className={cn(
                    "grid grid-cols-6 gap-4 p-4 rounded-2xl items-center",
                    i < 3 ? "bg-indigo-500/10 border border-indigo-500/20" : "bg-slate-950/50"
                  )}
                >
                  <div className="col-span-1 font-black text-xl text-slate-500">#{i + 1}</div>
                  <div className="col-span-2 font-bold text-xl text-white truncate">{p.username}</div>
                  <div className="col-span-1 text-right font-black text-2xl text-indigo-400">{p.wpm}</div>
                  <div className="col-span-1 text-right font-bold text-xl text-slate-300">{p.accuracy}%</div>
                  <div className="col-span-1 text-right">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest",
                      p.status === 'Completed' ? "bg-emerald-500/20 text-emerald-400" :
                      p.status === 'In Progress' ? "bg-indigo-500/20 text-indigo-400 animate-pulse" :
                      "bg-slate-800 text-slate-500"
                    )}>
                      {p.status}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Status & Info */}
        <div className="space-y-8">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-6">
            <h3 className="text-2xl font-bold flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-indigo-400" />
              Race Status
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-950 rounded-2xl">
                <span className="text-slate-400 font-medium">Status</span>
                <span className="font-black text-indigo-400 uppercase tracking-widest">{session.status}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-950 rounded-2xl">
                <span className="text-slate-400 font-medium">Avg. WPM</span>
                <span className="font-black text-white">
                  {participants.length > 0 ? Math.round(participants.reduce((acc, p) => acc + p.wpm, 0) / participants.length) : 0}
                </span>
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-950 rounded-2xl">
                <span className="text-slate-400 font-medium">Completed</span>
                <span className="font-black text-white">
                  {participants.filter(p => p.status === 'Completed').length} / {participants.length}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-indigo-600/10 border border-indigo-500/20 rounded-3xl p-8 space-y-4">
            <h4 className="text-sm font-bold text-indigo-400 uppercase tracking-widest">Current Paragraph</h4>
            <p className="text-xl text-slate-300 font-medium leading-relaxed italic">
              "{session.paragraph}"
            </p>
          </div>
        </div>
      </div>

      {/* Fullscreen Countdown Overlay */}
      <AnimatePresence>
        {countdown !== null && countdown > 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-xl"
          >
            <motion.div 
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 2, opacity: 0 }}
              className="text-[20rem] font-black text-indigo-500 drop-shadow-[0_0_100px_rgba(99,102,241,0.5)]"
            >
              {countdown}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
