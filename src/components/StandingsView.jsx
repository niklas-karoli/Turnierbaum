import React from 'react';
import { Trophy } from 'lucide-react';
import { calculateStandings } from '../engines/roundRobin';

export const StandingsView = ({ tournament }) => {
  if (tournament.system === 'hybrid' && tournament.groups) {
    return (
      <div className="space-y-6">
        <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <Trophy className="w-4 h-4 text-indigo-400" />
          <span>Gruppenphase Tabellen</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tournament.groups.map((group) => {
            const standings = calculateStandings(group.teams, group.matches, tournament.rules);
            return (
              <GroupTable
                key={group.id}
                title={group.name}
                standings={standings}
                advancingCount={tournament.advancingPerGroup}
              />
            );
          })}
        </div>
      </div>
    );
  }

  // Round Robin or Swiss Standings
  const standings = calculateStandings(tournament.teams, tournament.matches, tournament.rules);

  return (
    <div className="space-y-4">
      <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
        <Trophy className="w-4 h-4 text-indigo-400" />
        <span>Gesamttabelle</span>
      </h3>
      <GroupTable standings={standings} />
    </div>
  );
};

const GroupTable = ({ title, standings, advancingCount }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
      {title && (
        <div className="bg-slate-900 px-5 py-3 border-b border-slate-800 flex items-center justify-between">
          <span className="font-semibold text-xs text-indigo-300 uppercase tracking-wider">{title}</span>
          {advancingCount && (
            <span className="text-[10px] text-slate-400 bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800">
              Top {advancingCount} erreichen K.-o.-Runde
            </span>
          )}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[11px] font-medium">
              <th className="py-2.5 px-3 text-center w-10">Platz</th>
              <th className="py-2.5 px-4">Team</th>
              <th className="py-2.5 px-2 text-center">Sp.</th>
              <th className="py-2.5 px-2 text-center">S</th>
              <th className="py-2.5 px-2 text-center">U</th>
              <th className="py-2.5 px-2 text-center">N</th>
              <th className="py-2.5 px-3 text-center">Tore</th>
              <th className="py-2.5 px-2 text-center">Diff</th>
              <th className="py-2.5 px-4 text-center font-bold text-indigo-400">Pkt.</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-medium">
            {standings.map((row, idx) => {
              const isQualified = advancingCount && idx < advancingCount;

              return (
                <tr
                  key={row.team.id}
                  className={`transition hover:bg-slate-800/40 ${
                    isQualified ? 'bg-indigo-950/20' : ''
                  }`}
                >
                  <td className="py-2.5 px-3 text-center">
                    <span
                      className={`inline-flex items-center justify-center w-5 h-5 rounded-md font-bold text-[10px] ${
                        idx === 0
                          ? 'bg-amber-500 text-slate-950 font-black'
                          : idx === 1
                          ? 'bg-slate-300 text-slate-950 font-bold'
                          : idx === 2
                          ? 'bg-amber-700 text-white font-bold'
                          : 'text-slate-500'
                      }`}
                    >
                      {row.rank}
                    </span>
                  </td>
                  <td className="py-2.5 px-4">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: row.team.color || '#3b82f6' }}
                      />
                      <span className="font-semibold text-slate-200">{row.team.name}</span>
                      {isQualified && (
                        <span className="ml-1 text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1 py-0.5 rounded font-bold">
                          Q
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-2.5 px-2 text-center text-slate-400">{row.played}</td>
                  <td className="py-2.5 px-2 text-center text-slate-400">{row.won}</td>
                  <td className="py-2.5 px-2 text-center text-slate-400">{row.drawn}</td>
                  <td className="py-2.5 px-2 text-center text-slate-400">{row.lost}</td>
                  <td className="py-2.5 px-3 text-center text-slate-400 font-mono">
                    {row.goalsFor}:{row.goalsAgainst}
                  </td>
                  <td className={`py-2.5 px-2 text-center font-mono font-bold ${
                    row.goalDiff > 0 ? 'text-emerald-400' : row.goalDiff < 0 ? 'text-red-400' : 'text-slate-400'
                  }`}>
                    {row.goalDiff > 0 ? `+${row.goalDiff}` : row.goalDiff}
                  </td>
                  <td className="py-2.5 px-4 text-center font-mono font-bold text-indigo-400 text-sm">
                    {row.points}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
