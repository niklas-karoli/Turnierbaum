import React, { useState, useEffect } from 'react';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  CheckCircle2,
  Trophy,
} from 'lucide-react';
import { playBuzzerSound, playWhistleSound, playBeepSound } from '../utils/sound';

export const ScoreboardModal = ({ match, onSaveResult, onClose }) => {
  if (!match) return null;

  const [score1, setScore1] = useState(match.score1 ?? 0);
  const [score2, setScore2] = useState(match.score2 ?? 0);

  // Match Timer state
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes default
  const [timerRunning, setTimerRunning] = useState(false);

  useEffect(() => {
    let interval = null;
    if (timerRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setTimerRunning(false);
            playBuzzerSound();
            return 0;
          }
          if (prev <= 4) {
            playBeepSound(1000);
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timeLeft === 0) {
      setTimerRunning(false);
    }
    return () => clearInterval(interval);
  }, [timerRunning, timeLeft]);

  const toggleTimer = () => {
    if (!timerRunning) {
      playWhistleSound();
    }
    setTimerRunning(!timerRunning);
  };

  const resetTimer = (seconds = 600) => {
    setTimerRunning(false);
    setTimeLeft(seconds);
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSave = () => {
    onSaveResult(match.id, score1, score2);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-150">
        {/* Header */}
        <div className="bg-slate-800/80 px-6 py-4 border-b border-slate-700/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <span className="font-bold text-slate-200 text-sm">
              Match Details & Digitales Scoreboard
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scoreboard Display */}
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-5 items-center gap-2 bg-slate-950 p-6 rounded-2xl border border-slate-800 shadow-inner">
            {/* Team 1 Score */}
            <div className="col-span-2 text-center space-y-3">
              <div className="flex items-center justify-center gap-2">
                <div
                  className="w-3.5 h-3.5 rounded-full"
                  style={{ backgroundColor: match.team1?.color || '#3b82f6' }}
                />
                <span className="font-bold text-lg text-slate-100 truncate max-w-[120px]">
                  {match.team1 ? match.team1.name : 'TBD'}
                </span>
              </div>
              <div className="text-5xl font-black tracking-tight text-indigo-400 my-2">
                {score1}
              </div>
              <div className="flex justify-center gap-2">
                <button
                  onClick={() => setScore1(Math.max(0, score1 - 1))}
                  className="w-10 h-10 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl border border-slate-700 text-lg transition"
                >
                  -
                </button>
                <button
                  onClick={() => setScore1(score1 + 1)}
                  className="w-10 h-10 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-lg shadow-md transition"
                >
                  +
                </button>
              </div>
            </div>

            {/* VS Divider */}
            <div className="col-span-1 text-center font-black text-slate-600 text-xl">
              VS
            </div>

            {/* Team 2 Score */}
            <div className="col-span-2 text-center space-y-3">
              <div className="flex items-center justify-center gap-2">
                <div
                  className="w-3.5 h-3.5 rounded-full"
                  style={{ backgroundColor: match.team2?.color || '#ef4444' }}
                />
                <span className="font-bold text-lg text-slate-100 truncate max-w-[120px]">
                  {match.team2 ? match.team2.name : 'TBD'}
                </span>
              </div>
              <div className="text-5xl font-black tracking-tight text-indigo-400 my-2">
                {score2}
              </div>
              <div className="flex justify-center gap-2">
                <button
                  onClick={() => setScore2(Math.max(0, score2 - 1))}
                  className="w-10 h-10 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl border border-slate-700 text-lg transition"
                >
                  -
                </button>
                <button
                  onClick={() => setScore2(score2 + 1)}
                  className="w-10 h-10 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-lg shadow-md transition"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Match Timer */}
          <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="font-mono text-2xl font-bold text-amber-400 bg-slate-900 px-3 py-1 rounded-lg border border-slate-800">
                {formatTime(timeLeft)}
              </div>
              <button
                onClick={toggleTimer}
                className={`p-2.5 rounded-xl text-white font-semibold flex items-center gap-1.5 transition ${
                  timerRunning ? 'bg-amber-600 hover:bg-amber-500' : 'bg-emerald-600 hover:bg-emerald-500'
                }`}
              >
                {timerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span className="text-xs">{timerRunning ? 'Pause' : 'Start'}</span>
              </button>
              <button
                onClick={() => resetTimer(timeLeft)}
                className="p-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl transition"
                title="Timer zurücksetzen"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {/* Presets & Buzzer */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => resetTimer(300)}
                className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 px-2 py-1 rounded-lg transition"
              >
                5m
              </button>
              <button
                onClick={() => resetTimer(600)}
                className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 px-2 py-1 rounded-lg transition"
              >
                10m
              </button>
              <button
                onClick={() => resetTimer(900)}
                className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 px-2 py-1 rounded-lg transition"
              >
                15m
              </button>
              <button
                onClick={playBuzzerSound}
                className="p-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 rounded-lg transition"
                title="Buzzer-Ton abspielen"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-800/80 px-6 py-4 border-t border-slate-700/60 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 transition"
          >
            Abbrechen
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-lg shadow-emerald-600/20 transition"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Ergebnis eintragen</span>
          </button>
        </div>
      </div>
    </div>
  );
};
