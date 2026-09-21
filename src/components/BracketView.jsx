import React, { useState, useEffect } from 'react';
import { Trophy, CheckCircle, Play, Pause } from 'lucide-react';
import { MATCH_STATUS } from '../types';
import {
  getMatchRemainingSeconds,
  formatTimerDisplay,
  toggleMatchTimerInTournament,
} from '../utils/timer';

export const BracketView = ({
  rounds,
  matches,
  onSelectMatch,
  bracketTitle = 'Turnierbaum',
  tournament,
  onUpdateTournament,
}) => {
  const isAnyRunning = matches?.some((m) => m.isTimerRunning);
  const [, setNow] = useState(0);

  useEffect(() => {
    if (isAnyRunning) {
      const interval = setInterval(() => {
        setNow(Date.now());
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isAnyRunning]);

  if (!rounds || rounds.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500 text-xs">
        Keine K.-o.-Runden vorhanden.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {bracketTitle && (
        <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <Trophy className="w-4 h-4 text-indigo-400" />
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
                <div className="bg-slate-900 px-4 py-2 rounded-xl border border-slate-800 text-center shadow-sm">
                  <span className="font-semibold text-xs text-indigo-300 uppercase tracking-wider">
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
                      tournament={tournament}
                      onUpdateTournament={onUpdateTournament}
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

const MatchCard = ({ match, onSelectMatch, tournament, onUpdateTournament }) => {
  const isBye = Boolean(match.isBye);
  const isCompleted = match.status === MATCH_STATUS.COMPLETED;
  const isOngoing = match.status === MATCH_STATUS.ONGOING;
  const isReady = match.status === MATCH_STATUS.READY;

  const t1Winner = isCompleted && match.winnerId === match.team1?.id;
  const t2Winner = isCompleted && match.winnerId === match.team2?.id;

  const remainingSeconds = getMatchRemainingSeconds(match);

  const handleQuickToggleTimer = (e) => {
    e.stopPropagation();
    if (tournament && onUpdateTournament) {
      const updated = toggleMatchTimerInTournament(tournament, match.id);
      onUpdateTournament(updated);
    }
  };

  if (isBye) {
    const advancingTeam = match.team1 || match.team2;
    return (
      <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 opacity-75 space-y-2">
        <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold tracking-wider uppercase">
          <span>Freilos (Bye)</span>
          <span className="text-indigo-400/80">Auto-Vorrücken</span>
        </div>
        <div className="flex items-center justify-between p-1.5 bg-slate-900/60 rounded-lg border border-slate-800/50">
          <div className="flex items-center gap-2 overflow-hidden">
            <div
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: advancingTeam?.color || '#475569' }}
            />
            <span className="text-xs text-slate-300 font-medium truncate">
              {advancingTeam ? advancingTeam.name : 'Kein Gegner'}
            </span>
          </div>
          <span className="text-[10px] bg-indigo-950 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-800/50 font-semibold">
            R2
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => (isReady || isOngoing || isCompleted) && onSelectMatch(match)}
      className={`relative group bg-slate-900 border rounded-xl p-3 transition shadow-sm cursor-pointer hover:border-slate-700 ${
        isOngoing
          ? 'border-indigo-500/80 ring-1 ring-indigo-500/20'
          : isCompleted
          ? 'border-slate-800'
          : isReady
          ? 'border-slate-800 hover:bg-slate-800/50'
          : 'border-slate-800/60 opacity-60 cursor-not-allowed'
      }`}
    >
      {/* Match Title Badge if named (e.g. Spiel um Platz 3) */}
      {match.name && (
        <div className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider mb-1">
          {match.name}
        </div>
      )}
      {/* Field Badge */}
      {match.fieldId && (
        <span className="absolute -top-2.5 right-3 text-[10px] font-semibold bg-slate-800 text-indigo-300 border border-slate-700 px-2 py-0.5 rounded-md shadow-sm">
          {match.fieldId.replace('field_', 'Feld ')}
        </span>
      )}

      {/* Team 1 Row */}
      <div
        className={`flex items-center justify-between p-1.5 rounded-lg mb-1 transition ${
          t1Winner ? 'bg-emerald-950/40 font-semibold text-emerald-300' : 'text-slate-200'
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
              : 'bg-slate-950 text-slate-300 border border-slate-800'
          }`}
        >
          {match.score1 ?? '-'}
        </span>
      </div>

      {/* Divider */}
      <div className="h-px bg-slate-800 my-1" />

      {/* Team 2 Row */}
      <div
        className={`flex items-center justify-between p-1.5 rounded-lg transition ${
          t2Winner ? 'bg-emerald-950/40 font-semibold text-emerald-300' : 'text-slate-200'
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
              : 'bg-slate-950 text-slate-300 border border-slate-800'
          }`}
        >
          {match.score2 ?? '-'}
        </span>
      </div>

      {/* Status Bar & Timer Footer */}
      <div className="mt-2 pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
        <span>Match #{match.id.split('_').pop()}</span>

        {(isReady || isOngoing) && tournament && onUpdateTournament && (
          <button
            onClick={handleQuickToggleTimer}
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold transition ${
              match.isTimerRunning
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'
            }`}
            title={match.isTimerRunning ? 'Timer pausieren' : 'Timer starten'}
          >
            {match.isTimerRunning ? (
              <Pause className="w-3 h-3 text-amber-400" />
            ) : (
              <Play className="w-3 h-3 text-emerald-400" />
            )}
            <span className="font-mono">{formatTimerDisplay(remainingSeconds)}</span>
          </button>
        )}

        {isCompleted && (
          <span className="text-emerald-400 flex items-center gap-1 font-medium">
            <CheckCircle className="w-3 h-3" /> Beendet
          </span>
        )}
      </div>
    </div>
  );
};
