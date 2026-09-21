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
import { playBuzzerSound, playWhistleSound } from '../utils/sound';
import {
  getMatchRemainingSeconds,
  formatTimerDisplay,
  toggleMatchTimerInTournament,
  resetMatchTimerInTournament,
} from '../utils/timer';

export const ScoreboardModal = ({
  tournament,
  match,
  onSaveResult,
  onUpdateTournament,
  onClose,
}) => {
  // Retrieve latest match state from tournament
  const allMatches = tournament
    ? tournament.system === 'hybrid' && tournament.playoffMatches
      ? [...tournament.matches, ...tournament.playoffMatches]
      : tournament.matches || []
    : [];

  const currentMatch = match ? (allMatches.find((m) => m.id === match.id) || match) : null;

  const [score1, setScore1] = useState(currentMatch?.score1 ?? 0);
  const [score2, setScore2] = useState(currentMatch?.score2 ?? 0);

  const initialDuration = currentMatch?.timerDuration ?? tournament?.defaultTimerDuration ?? 600;
  const [customMin, setCustomMin] = useState(Math.floor(initialDuration / 60));
  const [customSec, setCustomSec] = useState(initialDuration % 60);

  // Tick state to force re-render every second when timer is running
  const [, setNow] = useState(0);

  useEffect(() => {
    if (currentMatch?.isTimerRunning) {
      const interval = setInterval(() => {
        setNow(Date.now());
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [currentMatch?.isTimerRunning]);

  if (!match || !currentMatch) return null;

  const remainingSeconds = getMatchRemainingSeconds(currentMatch);

  const handleToggleTimer = () => {
    if (!currentMatch.isTimerRunning) {
      playWhistleSound();
    }
    const updated = toggleMatchTimerInTournament(tournament, currentMatch.id);
    onUpdateTournament(updated);
  };

  const handleResetTimer = (seconds = 600) => {
    const updated = resetMatchTimerInTournament(tournament, currentMatch.id, seconds);
    onUpdateTournament(updated);
  };

  const handleApplyCustomTimer = () => {
    const totalSec = Math.max(1, (Number(customMin) || 0) * 60 + (Number(customSec) || 0));
    handleResetTimer(totalSec);
  };

  const handleSave = () => {
    onSaveResult(currentMatch.id, score1, score2);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-indigo-400" />
            <span className="font-bold text-slate-100 text-sm tracking-tight">
              Scoreboard & Match Details
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg border border-slate-800 hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scoreboard Display */}
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-5 items-center gap-2 bg-slate-950 p-6 rounded-2xl border border-slate-800 shadow-inner">
            {/* Team 1 Score */}
            <div className="col-span-2 text-center space-y-3">
              <div className="flex items-center justify-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: currentMatch.team1?.color || '#3b82f6' }}
                />
                <span className="font-bold text-sm text-slate-100 truncate max-w-[120px]">
                  {currentMatch.team1 ? currentMatch.team1.name : 'TBD'}
                </span>
              </div>
              <div className="text-4xl font-black font-mono tracking-tight text-indigo-400 my-2">
                {score1}
              </div>
              <div className="flex justify-center gap-2">
                <button
                  onClick={() => setScore1(Math.max(0, score1 - 1))}
                  className="w-8 h-8 bg-slate-800 hover:bg-slate-700/80 text-slate-300 font-bold rounded-lg border border-slate-700 text-base transition"
                >
                  -
                </button>
                <button
                  onClick={() => setScore1(score1 + 1)}
                  className="w-8 h-8 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-base transition"
                >
                  +
                </button>
              </div>
            </div>

            {/* VS Divider */}
            <div className="col-span-1 text-center font-bold text-slate-600 text-sm">
              VS
            </div>

            {/* Team 2 Score */}
            <div className="col-span-2 text-center space-y-3">
              <div className="flex items-center justify-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: currentMatch.team2?.color || '#ef4444' }}
                />
                <span className="font-bold text-sm text-slate-100 truncate max-w-[120px]">
                  {currentMatch.team2 ? currentMatch.team2.name : 'TBD'}
                </span>
              </div>
              <div className="text-4xl font-black font-mono tracking-tight text-indigo-400 my-2">
                {score2}
              </div>
              <div className="flex justify-center gap-2">
                <button
                  onClick={() => setScore2(Math.max(0, score2 - 1))}
                  className="w-8 h-8 bg-slate-800 hover:bg-slate-700/80 text-slate-300 font-bold rounded-lg border border-slate-700 text-base transition"
                >
                  -
                </button>
                <button
                  onClick={() => setScore2(score2 + 1)}
                  className="w-8 h-8 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-base transition"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Match Timer Controls */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="font-mono text-xl font-bold text-amber-400 bg-slate-900 px-3 py-1 rounded-lg border border-slate-800">
                {formatTimerDisplay(remainingSeconds)}
              </div>
              <button
                onClick={handleToggleTimer}
                className={`px-3 py-1.5 rounded-lg text-white font-medium text-xs flex items-center gap-1.5 transition ${
                  currentMatch.isTimerRunning
                    ? 'bg-amber-600 hover:bg-amber-500'
                    : 'bg-emerald-600 hover:bg-emerald-500'
                }`}
              >
                {currentMatch.isTimerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{currentMatch.isTimerRunning ? 'Pause' : 'Start'}</span>
              </button>
              <button
                onClick={() => handleResetTimer(currentMatch.timerDuration ?? 600)}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition"
                title="Timer zurücksetzen"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Presets & Sound */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => { setCustomMin(5); setCustomSec(0); handleResetTimer(300); }}
                className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded-lg border border-slate-700 transition"
              >
                5m
              </button>
              <button
                onClick={() => { setCustomMin(10); setCustomSec(0); handleResetTimer(600); }}
                className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded-lg border border-slate-700 transition"
              >
                10m
              </button>
              <button
                onClick={() => { setCustomMin(15); setCustomSec(0); handleResetTimer(900); }}
                className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded-lg border border-slate-700 transition"
              >
                15m
              </button>
              <button
                onClick={playBuzzerSound}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-red-400 border border-slate-700 rounded-lg transition"
                title="Buzzer"
              >
                <Volume2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Custom Duration Input */}
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between gap-3 text-xs">
            <span className="text-slate-400 font-medium shrink-0">Benutzerdefinierte Spieldauer:</span>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="0"
                  max="120"
                  value={customMin}
                  onChange={(e) => setCustomMin(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-12 bg-slate-900 border border-slate-800 rounded-md px-2 py-1 text-slate-100 text-center font-mono text-xs focus:outline-none focus:border-indigo-500"
                />
                <span className="text-slate-500 font-bold">:</span>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={customSec}
                  onChange={(e) => setCustomSec(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                  className="w-12 bg-slate-900 border border-slate-800 rounded-md px-2 py-1 text-slate-100 text-center font-mono text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>
              <button
                onClick={handleApplyCustomTimer}
                className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg transition text-xs"
              >
                Übernehmen
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-900 px-6 py-4 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl border border-slate-700 transition"
          >
            Abbrechen
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Ergebnis eintragen</span>
          </button>
        </div>
      </div>
    </div>
  );
};
