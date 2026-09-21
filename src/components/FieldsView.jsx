import React, { useState, useEffect } from 'react';
import { LayoutGrid, Play, Pause, Clock, Lock } from 'lucide-react';
import {
  getMatchRemainingSeconds,
  formatTimerDisplay,
  toggleMatchTimerInTournament,
} from '../utils/timer';
import { getMatchLockStatus } from '../utils/playerMapping';
import { TeamNameDisplay } from './TeamNameDisplay';

export const FieldsView = ({
  tournament,
  tournaments = [tournament],
  playerMappings = [],
  onSelectMatch,
  onUpdateTournament,
}) => {
  const fields = tournament.fields || [];

  const allMatches = tournament.system === 'hybrid' && tournament.playoffMatches
    ? [...tournament.matches, ...tournament.playoffMatches]
    : tournament.matches || [];

  const isAnyRunning = allMatches.some((m) => m.isTimerRunning);

  const [, setNow] = useState(0);

  useEffect(() => {
    if (isAnyRunning) {
      const interval = setInterval(() => {
        setNow(Date.now());
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isAnyRunning]);

  const handleQuickToggleTimer = (e, matchId) => {
    e.stopPropagation();
    if (onUpdateTournament) {
      const updated = toggleMatchTimerInTournament(tournament, matchId);
      onUpdateTournament(updated);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <LayoutGrid className="w-4 h-4 text-indigo-400" />
          <span>Spielfelder & Stationen ({fields.length})</span>
        </h3>
        <span className="text-xs text-slate-400">
          Beendete Spiele geben Spielfelder für das nächste Match frei.
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {fields.map((field) => {
          const activeMatch = allMatches.find((m) => m.id === field.currentMatchId);
          const remainingSeconds = activeMatch ? getMatchRemainingSeconds(activeMatch) : 600;

          const lockStatus = activeMatch && tournament
            ? getMatchLockStatus(activeMatch, tournament.id, tournaments, playerMappings)
            : { isLocked: false, reason: null };

          return (
            <div
              key={field.id}
              className={`p-5 rounded-2xl border transition shadow-sm ${
                field.status === 'busy' && activeMatch
                  ? lockStatus.isLocked
                    ? 'bg-slate-900 border-amber-500/80 ring-1 ring-amber-500/20'
                    : 'bg-slate-900 border-indigo-500/80 ring-1 ring-indigo-500/20'
                  : 'bg-slate-900 border-slate-800'
              }`}
            >
              {/* Lock Warning if applicable */}
              {lockStatus.isLocked && (
                <div className="mb-3 p-2 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center gap-1.5 text-xs text-amber-300 font-medium">
                  <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>{lockStatus.reason}</span>
                </div>
              )}

              {/* Field Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                <span className="font-semibold text-slate-100 text-sm">{field.name}</span>
                <span
                  className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-md flex items-center gap-1 ${
                    field.status === 'busy'
                      ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  {field.status === 'busy' ? (
                    <>
                      <Clock className="w-3 h-3 text-indigo-400" /> Spiel läuft
                    </>
                  ) : (
                    'Frei'
                  )}
                </span>
              </div>

              {/* Match Content */}
              {activeMatch ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: activeMatch.team1?.color || '#3b82f6' }}
                        />
                        <TeamNameDisplay team={activeMatch.team1} />
                      </div>
                      <span className="font-mono font-bold text-indigo-400 text-sm">
                        {activeMatch.score1 ?? '-'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: activeMatch.team2?.color || '#ef4444' }}
                        />
                        <TeamNameDisplay team={activeMatch.team2} />
                      </div>
                      <span className="font-mono font-bold text-indigo-400 text-sm">
                        {activeMatch.score2 ?? '-'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => handleQuickToggleTimer(e, activeMatch.id)}
                      className={`px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition ${
                        activeMatch.isTimerRunning
                          ? 'bg-amber-600 hover:bg-amber-500 text-white'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                      }`}
                    >
                      {activeMatch.isTimerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                      <span className="font-mono">{formatTimerDisplay(remainingSeconds)}</span>
                    </button>

                    <button
                      onClick={() => onSelectMatch(activeMatch)}
                      className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs rounded-xl flex items-center justify-center gap-1.5 transition"
                    >
                      <span>Scoreboard</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-6 text-center text-slate-500 text-xs">
                  Spielfeld ist aktuell frei.
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
