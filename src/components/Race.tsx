import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Timer, Keyboard, CheckCircle2, AlertCircle, RotateCcw, Download, LogOut, Settings, Play } from 'lucide-react';
import { Socket } from 'socket.io-client';
import { RaceSession, Participant } from '../types';
import { cn } from '../lib/utils';

interface RaceProps {
  session: RaceSession;
  socket: Socket;
  isAdmin: boolean;
  countdown: number | null;
}

export default function Race({ session, socket, isAdmin, countdown }: RaceProps) {
  const [input, setInput] = useState('');
  const [startTime, setStartTime] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(session.duration);
  const [isFinished, setIsFinished] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const participants = Array.isArray(session.participants) ? session.participants : [];
  const myStats = participants.find(p => p.id === socket.id);

  useEffect(() => {
    if (session.status === 'InProgress' && session.startTime) {
      setStartTime(session.startTime);
      const interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - session.startTime!) / 1000);
        const remaining = Math.max(0, session.duration - elapsed);
        setTimeLeft(remaining);
        if (remaining === 0) clearInterval(interval);
      }, 100);
      return () => clearInterval(interval);
    }
  }, [session.status, session.startTime, session.duration]);

  useEffect(() => {
    if (session.status === 'InProgress' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [session.status]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (session.status !== 'InProgress' || isFinished) return;

    const value = e.target.value;
    setInput(value);

    // Calculate stats
    const correctChars = value.split('').filter((char, i) => char === session.paragraph[i]).length;
    const incorrectChars = value.length - correctChars;
    const totalTyped = value.length;
    const accuracy = totalTyped > 0 ? (correctChars / totalTyped) * 100 : 100;
    
    const timeElapsed = (Date.now() - (session.startTime || Date.now())) / 60000; // in minutes
    const wpm = timeElapsed > 0 ? (correctChars / 5) / timeElapsed : 0;

    const isCompleted = value === session.paragraph;
    if (isCompleted) {
      setIsFinished(true);
    }

    socket.emit('participant:update', {
      sessionId: session.id,
      stats: {
        wpm: Math.round(wpm),
        accuracy: Math.round(accuracy),
        totalTyped,
        correctChars,
        incorrectChars,
        timeTaken: Math.floor((Date.now() - (session.startTime || Date.now())) / 1000),
        status: isCompleted ? 'Completed' : 'In Progress'
      }
    });
  };

  const resetRace = () => {
    socket.emit('race:reset', session.id);
  };

  const endRace = () => {
    socket.emit('race:end', session.id);
  };

  const exportCSV = () => {
    const headers = ['Rank', 'Username', 'WPM', 'Accuracy', 'Correct', 'Incorrect', 'Time', 'Status'];
    const rows = participants
      .sort((a, b) => b.wpm - a.wpm || b.accuracy - a.accuracy || a.timeTaken - b.timeTaken)
      .map((p, i) => [
        i + 1,
        p.username,
        p.wpm,
        `${p.accuracy}%`,
        p.correctChars,
        p.incorrectChars,
        `${p.timeTaken}s`,
        p.status
      ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `race_results_${session.id}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderParagraph = () => {
    return session.paragraph.split('').map((char, i) => {
      let color = 'text-slate-500';
      if (i < input.length) {
        color = input[i] === char ? 'text-emerald-400' : 'text-red-400 bg-red-400/20';
      }
      return (
        <span key={i} className={cn("transition-colors duration-100", color)}>
          {char}
        </span>
      );
    });
  };

  return (
    <div className="space-y-8">
      {/* Header Stats */}
      <div className="flex flex-wrap items-center justify-between gap-6 bg-slate-900/50 border border-slate-800/50 p-6 rounded-3xl">
        <div className="flex items-center gap-8">
          <div className="space-y-1">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">Time Remaining</div>
            <div className={cn("text-4xl font-black tabular-nums", timeLeft < 10 ? "text-red-400 animate-pulse" : "text-indigo-400")}>
              {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
            </div>
          </div>
          <div className="w-px h-12 bg-slate-800" />
          <div className="space-y-1">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">Your WPM</div>
            <div className="text-4xl font-black text-white tabular-nums">
              {myStats?.wpm || 0}
            </div>
          </div>
          <div className="w-px h-12 bg-slate-800" />
          <div className="space-y-1">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">Accuracy</div>
            <div className="text-4xl font-black text-white tabular-nums">
              {myStats?.accuracy || 0}%
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {isAdmin && session.status === 'InProgress' && (
            <button
              onClick={endRace}
              className="px-6 py-3 bg-red-600 hover:bg-red-500 rounded-xl flex items-center gap-2 font-bold transition-all"
            >
              <LogOut className="w-5 h-5" />
              End Race
            </button>
          )}
          {isAdmin && (
            <button
              onClick={resetRace}
              className="p-3 bg-slate-800 hover:bg-slate-700 rounded-xl transition-all text-slate-300"
              title="Reset Race"
            >
              <RotateCcw className="w-6 h-6" />
            </button>
          )}
          {session.status === 'Finished' && (
            <button
              onClick={exportCSV}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl flex items-center gap-2 font-bold transition-all"
            >
              <Download className="w-5 h-5" />
              Export Results
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Typing Area */}
        <div className="lg:col-span-2 space-y-6">
          <div className="relative bg-slate-900 border border-slate-800 rounded-3xl p-8 min-h-[300px] flex flex-col justify-between overflow-hidden">
            <AnimatePresence>
              {countdown !== null && countdown > 0 && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 2 }}
                  className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm"
                >
                  <div className="text-9xl font-black text-indigo-500 drop-shadow-[0_0_30px_rgba(99,102,241,0.5)]">
                    {countdown}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="text-2xl leading-relaxed font-medium select-none">
              {renderParagraph()}
            </div>

            <div className="mt-8 space-y-4">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={handleInputChange}
                disabled={session.status !== 'InProgress' || isFinished}
                placeholder={session.status === 'InProgress' ? "Start typing..." : "Wait for countdown..."}
                className="w-full px-6 py-4 bg-slate-950 border border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-xl font-medium transition-all disabled:opacity-50"
                onPaste={(e) => e.preventDefault()}
              />
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-widest">
                <div className="flex items-center gap-2">
                  <Keyboard className="w-4 h-4" />
                  No Copy-Paste Allowed
                </div>
                <div>
                  {input.length} / {session.paragraph.length} Characters
                </div>
              </div>
            </div>
          </div>

          {/* Winner Announcement */}
          {session.status === 'Finished' && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl p-8 text-center space-y-4 shadow-2xl shadow-indigo-500/20"
            >
              <Trophy className="w-16 h-16 text-yellow-400 mx-auto drop-shadow-lg" />
              <div className="space-y-1">
                <h2 className="text-4xl font-black">Race Finished!</h2>
                <p className="text-indigo-100 text-lg">Congratulations to the winners!</p>
              </div>
              <div className="flex justify-center gap-8 pt-4">
                {participants
                  .sort((a, b) => b.wpm - a.wpm || b.accuracy - a.accuracy)
                  .slice(0, 3)
                  .map((p, i) => (
                    <div key={p.id} className="space-y-2">
                      <div className="text-3xl">{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</div>
                      <div className="font-bold">{p.username}</div>
                      <div className="text-sm bg-white/20 px-3 py-1 rounded-full">{p.wpm} WPM</div>
                    </div>
                  ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* Leaderboard */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                Leaderboard
              </h3>
              <span className="text-xs font-bold text-slate-500 bg-slate-800 px-2 py-1 rounded uppercase">Live</span>
            </div>

            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {participants
                .sort((a, b) => {
                  if (a.status === 'Completed' && b.status !== 'Completed') return -1;
                  if (a.status !== 'Completed' && b.status === 'Completed') return 1;
                  return b.wpm - a.wpm || b.accuracy - a.accuracy || a.timeTaken - b.timeTaken;
                })
                .map((p, i) => (
                  <div 
                    key={p.id}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-2xl border transition-all",
                      p.id === socket.id ? "bg-indigo-500/10 border-indigo-500/30" : "bg-slate-950/50 border-slate-800/50"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm",
                        i === 0 ? "bg-yellow-500/20 text-yellow-500" : 
                        i === 1 ? "bg-slate-300/20 text-slate-300" :
                        i === 2 ? "bg-amber-700/20 text-amber-700" : "bg-slate-800 text-slate-500"
                      )}>
                        {i + 1}
                      </div>
                      <div>
                        <div className="font-bold text-sm truncate max-w-[100px]">{p.username}</div>
                        <div className="text-[10px] text-slate-500 uppercase font-bold">{p.status}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-black text-lg text-white leading-none">{p.wpm}</div>
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">WPM</div>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {isAdmin && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
              <h4 className="font-bold text-slate-400 uppercase text-xs tracking-widest">Admin Advanced View</h4>
              <div className="space-y-3">
                {participants.map(p => (
                  <div key={p.id} className="flex items-center justify-between text-xs">
                    <span className="text-slate-300">{p.username}</span>
                    <span className={cn(
                      "px-2 py-0.5 rounded-full font-bold",
                      Date.now() - p.lastActivity < 5000 ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                    )}>
                      {Date.now() - p.lastActivity < 5000 ? 'Active' : 'Idle'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
