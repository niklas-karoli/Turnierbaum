import React, { useState } from 'react';
import { ListFilter, Play, CheckCircle, Clock } from 'lucide-react';
import { MATCH_STATUS } from '../types';

export const MatchListView = ({ tournament, onSelectMatch }) => {
  const [filter, setFilter] = useState('all'); // 'all' | 'ready' | 'ongoing' | 'completed'

  const matches = tournament.system === 'hybrid' && tournament.playoffMatches
    ? [...tournament.matches, ...tournament.playoffMatches]
    : tournament.matches || [];

  const filteredMatches = matches.filter((m) => {
    if (filter === 'ready') return m.status === MATCH_STATUS.READY;
    if (filter === 'ongoing') return m.status === MATCH_STATUS.ONGOING;
    if (filter === 'completed') return m.status === MATCH_STATUS.COMPLETED;
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Filter Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <ListFilter className="w-4 h-4 text-amber-400" />
          <span>Spielplan ({matches.length} Spiele)</span>
        </h3>

        <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700/80 text-xs font-semibold">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition ${
              filter === 'all' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Alle ({matches.length})
          </button>
          <button
            onClick={() => setFilter('ready')}
            className={`px-3 py-1.5 rounded-lg transition ${
              filter === 'ready' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Bereit ({matches.filter((m) => m.status === MATCH_STATUS.READY).length})
          </button>
          <button
            onClick={() => setFilter('ongoing')}
            className={`px-3 py-1.5 rounded-lg transition ${
              filter === 'ongoing' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Läuft ({matches.filter((m) => m.status === MATCH_STATUS.ONGOING).length})
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-3 py-1.5 rounded-lg transition ${
              filter === 'completed' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Beendet ({matches.filter((m) => m.status === MATCH_STATUS.COMPLETED).length})
          </button>
        </div>
      </div>

      {/* Matches Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredMatches.map((match) => (
          <div
            key={match.id}
            onClick={() =>
              (match.status === MATCH_STATUS.READY ||
                match.status === MATCH_STATUS.ONGOING ||
                match.status === MATCH_STATUS.COMPLETED) &&
              onSelectMatch(match)
            }
            className="p-4 bg-slate-800/80 border border-slate-700/80 rounded-2xl shadow-md hover:border-indigo-500/80 transition cursor-pointer flex flex-col justify-between gap-3"
          >
            <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
              <span>Match #{match.id.split('_').pop()}</span>
              {match.fieldId && (
                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold text-[10px]">
                  {match.fieldId.replace('field_', 'Feld ')}
                </span>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
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
                    className="w-3 h-3 rounded-full shrink-0"
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

            <div className="pt-2 border-t border-slate-700/50 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">
                {match.status === MATCH_STATUS.COMPLETED && (
                  <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                    <CheckCircle className="w-3.5 h-3.5" /> Beendet
                  </span>
                )}
                {match.status === MATCH_STATUS.ONGOING && (
                  <span className="text-amber-400 flex items-center gap-1 font-semibold animate-pulse">
                    <Clock className="w-3.5 h-3.5" /> Läuft
                  </span>
                )}
                {match.status === MATCH_STATUS.READY && (
                  <span className="text-indigo-300 font-semibold">Bereit zum Spielen</span>
                )}
                {match.status === MATCH_STATUS.PENDING && (
                  <span className="text-slate-500">Wartet auf Gegner</span>
                )}
              </span>

              {(match.status === MATCH_STATUS.READY ||
                match.status === MATCH_STATUS.ONGOING ||
                match.status === MATCH_STATUS.COMPLETED) && (
                <span className="text-indigo-400 font-bold hover:underline flex items-center gap-1">
                  Eintragen &rarr;
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
