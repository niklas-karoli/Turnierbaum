import React from 'react';
import { Trophy, Clock, CheckCircle, ChevronRight } from 'lucide-react';
import { MATCH_STATUS } from '../types';

export const BracketView = ({
  rounds,
  matches,
  onSelectMatch,
  bracketTitle = 'Turnierbaum',
}) => {
  if (!rounds || rounds.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500">
        Keine K.-o.-Runden vorhanden.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {bracketTitle && (
        <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-400" />
          <span>{bracketTitle}</span>
        </h3>
      )}

      {/* Horizontally scrollable tournament bracket container */}
      <div className="overflow-x-auto pb-6 pt-2 scrollbar-thin">
        <div className="flex gap-8 min-w-max px-2">
          {rounds.map((round) => {
            const roundMatches = matches.filter((m) => round.matchIds?.includes(m.id));

            return (
              <div key={round.roundNumber} className="w-64 flex flex-col gap-4">
                {/* Round Header */}
                <div className="bg-slate-800/80 px-4 py-2 rounded-xl border border-slate-700/80 text-center shadow-sm">
                  <span className="font-bold text-xs text-indigo-300 uppercase tracking-wider">
                    {round.name}
                  </span>
                </div>

                {/* Match Cards Column */}
                <div className="flex flex-col justify-around flex-1 gap-4">
                  {roundMatches.map((match) => (
                    <MatchCard
                      key={match.id}
                      match={match}
                      onSelectMatch={onSelectMatch}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const MatchCard = ({ match, onSelectMatch }) => {
  const isCompleted = match.status === MATCH_STATUS.COMPLETED;
  const isOngoing = match.status === MATCH_STATUS.ONGOING;
  const isReady = match.status === MATCH_STATUS.READY;

  const t1Winner = isCompleted && match.winnerId === match.team1?.id;
  const t2Winner = isCompleted && match.winnerId === match.team2?.id;

  return (
    <div
      onClick={() => (isReady || isOngoing || isCompleted) && onSelectMatch(match)}
      className={`relative group bg-slate-800/90 border rounded-xl p-3 transition shadow-md cursor-pointer hover:border-indigo-500/80 ${
        isOngoing
          ? 'border-amber-500/80 ring-2 ring-amber-500/20'
          : isCompleted
          ? 'border-slate-700/80'
          : isReady
          ? 'border-slate-700 hover:bg-slate-800'
          : 'border-slate-800/60 opacity-60 cursor-not-allowed'
      }`}
    >
      {/* Field Badge */}
      {match.fieldId && (
        <span className="absolute -top-2.5 right-3 text-[10px] font-extrabold bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full shadow-sm">
          {match.fieldId.replace('field_', 'Feld ')}
        </span>
      )}

      {/* Team 1 Row */}
      <div
        className={`flex items-center justify-between p-1.5 rounded-lg mb-1 transition ${
          t1Winner ? 'bg-emerald-950/40 font-bold text-emerald-300' : 'text-slate-200'
        }`}
      >
        <div className="flex items-center gap-2 overflow-hidden mr-2">
          <div
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: match.team1?.color || '#475569' }}
          />
          <span className="text-xs truncate">
            {match.team1 ? match.team1.name : 'TBD'}
          </span>
        </div>
        <span
          className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
            t1Winner
              ? 'bg-emerald-500/20 text-emerald-400'
              : 'bg-slate-900/60 text-slate-300'
          }`}
        >
          {match.score1 ?? '-'}
        </span>
      </div>

      {/* Divider */}
      <div className="h-px bg-slate-700/50 my-1" />

      {/* Team 2 Row */}
      <div
        className={`flex items-center justify-between p-1.5 rounded-lg transition ${
          t2Winner ? 'bg-emerald-950/40 font-bold text-emerald-300' : 'text-slate-200'
        }`}
      >
        <div className="flex items-center gap-2 overflow-hidden mr-2">
          <div
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: match.team2?.color || '#475569' }}
          />
          <span className="text-xs truncate">
            {match.team2 ? match.team2.name : 'TBD'}
          </span>
        </div>
        <span
          className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
            t2Winner
              ? 'bg-emerald-500/20 text-emerald-400'
              : 'bg-slate-900/60 text-slate-300'
          }`}
        >
          {match.score2 ?? '-'}
        </span>
      </div>

      {/* Status Bar Footer */}
      <div className="mt-2 pt-1 flex items-center justify-between text-[10px] text-slate-400">
        <span>Match #{match.id.split('_').pop()}</span>
        <span className="flex items-center gap-1 font-semibold">
          {isCompleted && (
            <span className="text-emerald-400 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" /> Beendet
            </span>
          )}
          {isOngoing && (
            <span className="text-amber-400 flex items-center gap-1 animate-pulse">
              <Clock className="w-3 h-3" /> Läuft
            </span>
          )}
          {isReady && <span className="text-indigo-300">Bereit</span>}
        </span>
      </div>
    </div>
  );
};
