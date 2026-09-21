import React from 'react';
import { LayoutGrid, Play, Trophy, Clock, CheckCircle2 } from 'lucide-react';
import { MATCH_STATUS } from '../types';

export const FieldsView = ({ tournament, onSelectMatch }) => {
  const fields = tournament.fields || [];

  const allMatches = tournament.system === 'hybrid' && tournament.playoffMatches
    ? [...tournament.matches, ...tournament.playoffMatches]
    : tournament.matches || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <LayoutGrid className="w-4 h-4 text-amber-400" />
          <span>Spielfelder & Stationen ({fields.length})</span>
        </h3>
        <span className="text-xs text-slate-400">
          Beendete Spiele geben Felder automatisch für das nächste bereite Match frei.
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {fields.map((field) => {
          const activeMatch = allMatches.find((m) => m.id === field.currentMatchId);

          return (
            <div
              key={field.id}
              className={`p-5 rounded-2xl border transition shadow-lg ${
                field.status === 'busy' && activeMatch
                  ? 'bg-slate-800/90 border-amber-500/60 ring-1 ring-amber-500/20'
                  : 'bg-slate-800/50 border-slate-700/60'
              }`}
            >
              {/* Field Header */}
              <div className="flex items-center justify-between border-b border-slate-700/60 pb-3 mb-4">
                <span className="font-bold text-slate-100 text-sm">{field.name}</span>
                <span
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                    field.status === 'busy'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                      : 'bg-slate-700 text-slate-400'
                  }`}
                >
                  {field.status === 'busy' ? (
                    <>
                      <Clock className="w-3 h-3" /> Spiel läuft
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
                    <div className="flex items-center justify-between bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: activeMatch.team1?.color || '#3b82f6' }}
                        />
                        <span className="font-semibold text-xs text-slate-200">
                          {activeMatch.team1?.name}
                        </span>
                      </div>
                      <span className="font-mono font-bold text-amber-400 text-sm">
                        {activeMatch.score1 ?? '-'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: activeMatch.team2?.color || '#ef4444' }}
                        />
                        <span className="font-semibold text-xs text-slate-200">
                          {activeMatch.team2?.name}
                        </span>
                      </div>
                      <span className="font-mono font-bold text-amber-400 text-sm">
                        {activeMatch.score2 ?? '-'}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => onSelectMatch(activeMatch)}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition shadow-md"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Scoreboard öffnen</span>
                  </button>
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
