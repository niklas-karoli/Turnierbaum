import React, { useState, useEffect } from 'react';
import { ListFilter, Play, Pause, CheckCircle, Clock } from 'lucide-react';
import { MATCH_STATUS } from '../types';
import {
  getMatchRemainingSeconds,
  formatTimerDisplay,
  toggleMatchTimerInTournament,
} from '../utils/timer';

export const MatchListView = ({ tournament, onSelectMatch, onUpdateTournament }) => {
  const [filter, setFilter] = useState('all'); // 'all' | 'ready' | 'ongoing' | 'completed'
  const [now, setNow] = useState(Date.now());

  const matches = tournament.system === 'hybrid' && tournament.playoffMatches
    ? [...tournament.matches, ...tournament.playoffMatches]
    : tournament.matches || [];

  const isAnyRunning = matches.some((m) => m.isTimerRunning);

  useEffect(() => {
    if (isAnyRunning) {
      const interval = setInterval(() => {
        setNow(Date.now());
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isAnyRunning]);

  const filteredMatches = matches.filter((m) => {
    if (filter === 'ready') return m.status === MATCH_STATUS.READY;
    if (filter === 'ongoing') return m.status === MATCH_STATUS.ONGOING;
    if (filter === 'completed') return m.status === MATCH_STATUS.COMPLETED;
    return true;
  });

  const handleQuickToggleTimer = (e, matchId) => {
    e.stopPropagation(); // Don't trigger modal click
    if (onUpdateTournament) {
      const updated = toggleMatchTimerInTournament(tournament, matchId);
      onUpdateTournament(updated);
    }
  };

  return (
    <div className="space-y-4">
      {/* Filter Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <ListFilter className="w-4 h-4 text-indigo-400" />
          <span>Spielplan ({matches.length} Spiele)</span>
        </h3>

        <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-medium">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-lg transition ${
              filter === 'all' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Alle ({matches.length})
          </button>
          <button
            onClick={() => setFilter('ready')}
            className={`px-3 py-1 rounded-lg transition ${
              filter === 'ready' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Bereit ({matches.filter((m) => m.status === MATCH_STATUS.READY).length})
          </button>
          <button
            onClick={() => setFilter('ongoing')}
            className={`px-3 py-1 rounded-lg transition ${
              filter === 'ongoing' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Läuft ({matches.filter((m) => m.status === MATCH_STATUS.ONGOING).length})
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-3 py-1 rounded-lg transition ${
              filter === 'completed' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Beendet ({matches.filter((m) => m.status === MATCH_STATUS.COMPLETED).length})
          </button>
        </div>
      </div>

      {/* Matches Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredMatches.map((match) => {
          const remaining = getMatchRemainingSeconds(match);
          const canInteract =
            match.status === MATCH_STATUS.READY ||
            match.status === MATCH_STATUS.ONGOING ||
            match.status === MATCH_STATUS.COMPLETED;

          return (
            <div
              key={match.id}
              onClick={() => canInteract && onSelectMatch(match)}
              className="p-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-sm hover:border-slate-700 transition cursor-pointer flex flex-col justify-between gap-3 group"
            >
              {/* Header Badge Row */}
              <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
                <span>Match #{match.id.split('_').pop()}</span>
                <div className="flex items-center gap-2">
                  {match.fieldId && (
                    <span className="bg-slate-800 text-indigo-300 border border-slate-700 px-2 py-0.5 rounded-md text-[10px] font-semibold">
                      {match.fieldId.replace('field_', 'Feld ')}
                    </span>
                  )}
                  {canInteract && match.status !== MATCH_STATUS.COMPLETED && (
                    <button
                      onClick={(e) => handleQuickToggleTimer(e, match.id)}
                      className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold transition ${
                        match.isTimerRunning
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                          : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'
                      }`}
                      title={match.isTimerRunning ? 'Timer pausieren' : 'Timer starten'}
                    >
                      {match.isTimerRunning ? (
                        <Pause className="w-3 h-3 text-amber-400" />
                      ) : (
                        <Play className="w-3 h-3 text-emerald-400" />
                      )}
                      <span className="font-mono">{formatTimerDisplay(remaining)}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Teams & Scores */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: match.team1?.color || '#3b82f6' }}
                    />
                    <span className="font-semibold text-xs text-slate-200">
                      {match.team1 ? match.team1.name : 'TBD'}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-slate-100 text-sm">
                    {match.score1 ?? '-'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: match.team2?.color || '#ef4444' }}
                    />
                    <span className="font-semibold text-xs text-slate-200">
                      {match.team2 ? match.team2.name : 'TBD'}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-slate-100 text-sm">
                    {match.score2 ?? '-'}
                  </span>
                </div>
              </div>

              {/* Status Footer */}
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                <span className="text-slate-400">
                  {match.status === MATCH_STATUS.COMPLETED && (
                    <span className="text-emerald-400 flex items-center gap-1 font-medium">
                      <CheckCircle className="w-3.5 h-3.5" /> Beendet
                    </span>
                  )}
                  {match.status === MATCH_STATUS.ONGOING && (
                    <span className="text-amber-400 flex items-center gap-1 font-medium">
                      <Clock className="w-3.5 h-3.5" /> Laufend
                    </span>
                  )}
                  {match.status === MATCH_STATUS.READY && (
                    <span className="text-slate-300 font-medium">Anstehend / Bereit</span>
                  )}
                  {match.status === MATCH_STATUS.PENDING && (
                    <span className="text-slate-500">Wartet auf Gegner</span>
                  )}
                </span>

                {canInteract && (
                  <span className="text-indigo-400 font-medium group-hover:underline flex items-center gap-1">
                    Details / Punkt
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
