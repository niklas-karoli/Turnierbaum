import React from 'react';
import { Tv, Clock, Trophy, X, LayoutGrid } from 'lucide-react';
import { MATCH_STATUS } from '../types';
import { calculateStandings } from '../engines/roundRobin';

export const BeamerView = ({ tournament, onClose }) => {
  const fields = tournament.fields || [];
  const matches = tournament.system === 'hybrid' && tournament.playoffMatches
    ? [...tournament.matches, ...tournament.playoffMatches]
    : tournament.matches || [];

  const ongoingMatches = matches.filter((m) => m.status === MATCH_STATUS.ONGOING);
  const readyMatches = matches.filter((m) => m.status === MATCH_STATUS.READY).slice(0, 4);

  const standings = (tournament.system === 'round_robin' || tournament.system === 'swiss')
    ? calculateStandings(tournament.teams, matches, tournament.rules).slice(0, 8)
    : null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 text-white p-8 flex flex-col justify-between overflow-y-auto">
      {/* Top Banner */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-amber-500 text-slate-950 rounded-2xl font-black">
            <Tv className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-amber-400 tracking-tight">
              {tournament.name}
            </h1>
            <p className="text-sm font-semibold text-slate-400 uppercase tracking-widest mt-0.5">
              Live Dashboard • Beamer / TV Mode
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="bg-slate-800 hover:bg-slate-700 text-slate-300 p-2.5 rounded-xl border border-slate-700 transition"
          title="Beamer Mode beenden"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 my-8 flex-1">
        {/* Active Fields Section (Col 1 & 2) */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-lg font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <LayoutGrid className="w-5 h-5 text-amber-400" />
            <span>Aktuelle Spiele auf den Feldern</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {fields.map((field) => {
              const match = matches.find((m) => m.id === field.currentMatchId);

              return (
                <div
                  key={field.id}
                  className={`p-6 rounded-3xl border shadow-2xl flex flex-col justify-between min-h-[220px] ${
                    field.status === 'busy' && match
                      ? 'bg-slate-900 border-amber-500 ring-2 ring-amber-500/20'
                      : 'bg-slate-900/60 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <span className="font-extrabold text-lg text-slate-200">{field.name}</span>
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                        field.status === 'busy'
                          ? 'bg-amber-500 text-slate-950 animate-pulse'
                          : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      {field.status === 'busy' ? 'LIVE' : 'FREI'}
                    </span>
                  </div>

                  {match ? (
                    <div className="space-y-4 my-2">
                      <div className="flex items-center justify-between text-xl font-bold">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: match.team1?.color || '#3b82f6' }}
                          />
                          <span>{match.team1?.name}</span>
                        </div>
                        <span className="text-3xl font-black text-amber-400 font-mono">
                          {match.score1 ?? 0}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xl font-bold">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: match.team2?.color || '#ef4444' }}
                          />
                          <span>{match.team2?.name}</span>
                        </div>
                        <span className="text-3xl font-black text-amber-400 font-mono">
                          {match.score2 ?? 0}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-600 font-semibold">
                      Feld ist bereit für die nächste Begegnung
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Next Matches & Standings Column (Col 3) */}
        <div className="space-y-6">
          {/* Upcoming Matches */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-400" />
              <span>Nächste Spiele (Bereit)</span>
            </h3>

            {readyMatches.length > 0 ? (
              <div className="space-y-3">
                {readyMatches.map((m) => (
                  <div
                    key={m.id}
                    className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 text-sm flex items-center justify-between font-semibold"
                  >
                    <div className="truncate max-w-[120px] text-slate-200">{m.team1?.name}</div>
                    <span className="text-slate-600 font-bold">VS</span>
                    <div className="truncate max-w-[120px] text-slate-200 text-right">{m.team2?.name}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-500 text-center py-4">
                Keine ausstehenden bereitstehenden Spiele.
              </div>
            )}
          </div>

          {/* Standings if available */}
          {standings && (
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4 shadow-xl">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>Top Tabellenplätze</span>
              </h3>

              <div className="space-y-2">
                {standings.map((s, idx) => (
                  <div
                    key={s.team.id}
                    className="flex items-center justify-between text-xs font-semibold p-2 bg-slate-950 rounded-xl"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-5 text-center text-amber-400 font-bold">#{idx + 1}</span>
                      <span className="text-slate-200">{s.team.name}</span>
                    </div>
                    <span className="font-mono text-amber-400 font-bold">{s.points} Pkt.</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
