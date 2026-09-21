import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Trophy,
  LayoutGrid,
  ListFilter,
  History,
  Sparkles,
  ChevronRight,
  Play,
  RotateCcw,
} from 'lucide-react';

import { Header } from './components/Header';
import { TournamentSetup } from './components/TournamentSetup';
import { ScoreboardModal } from './components/ScoreboardModal';
import { BracketView } from './components/BracketView';
import { StandingsView } from './components/StandingsView';
import { FieldsView } from './components/FieldsView';
import { MatchListView } from './components/MatchListView';
import { BeamerView } from './components/BeamerView';
import { RandomToolsModal } from './components/RandomToolsModal';
import { QrShareModal } from './components/QrShareModal';
import { ActivityLogView } from './components/ActivityLogView';

import { saveToLocalStorage, loadFromLocalStorage, exportToJsonFile, importFromJsonFile } from './utils/storage';
import { createInitialHistory, recordState, undoState } from './utils/historyManager';
import { updateMatchResult } from './engines/matchUpdater';
import { autoAssignFields } from './engines/fieldScheduler';
import { generateNextSwissRound } from './engines/swiss';
import { MATCH_STATUS, TOURNAMENT_SYSTEMS } from './types';

export default function App() {
  const [history, setHistory] = useState(() => {
    const saved = loadFromLocalStorage();
    if (saved) {
      return createInitialHistory(saved);
    }
    return null;
  });

  const tournament = history?.present || null;

  // Active View Tab: 'bracket' | 'standings' | 'fields' | 'matches' | 'log'
  const [activeTab, setActiveTab] = useState('bracket');

  // Theme
  const [theme, setTheme] = useState('dark');

  // Modals state
  const [showWizard, setShowWizard] = useState(!tournament);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [showBeamer, setShowBeamer] = useState(false);
  const [showRandomTools, setShowRandomTools] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  // Auto-save to localStorage whenever tournament state updates
  useEffect(() => {
    if (tournament) {
      saveToLocalStorage(tournament);
    }
  }, [tournament]);

  // Handle New Tournament Creation
  const handleCreateTournament = (newTournament) => {
    const initialized = autoAssignFields(newTournament);
    const newHistory = createInitialHistory(initialized);
    setHistory(newHistory);
    setShowWizard(false);

    if (newTournament.system === TOURNAMENT_SYSTEMS.ROUND_ROBIN) {
      setActiveTab('standings');
    } else {
      setActiveTab('bracket');
    }
  };

  // Handle Match Score Save
  const handleSaveMatchResult = (matchId, score1, score2) => {
    if (!tournament) return;

    // Record match score and compute progression
    let updated = updateMatchResult(tournament, matchId, score1, score2);

    // Auto assign fields
    updated = autoAssignFields(updated);

    const matchObj = (tournament.system === 'hybrid' && tournament.playoffMatches
      ? [...tournament.matches, ...tournament.playoffMatches]
      : tournament.matches
    ).find((m) => m.id === matchId);

    const logText = matchObj
      ? `Ergebnis eingetragen: ${matchObj.team1?.name} ${score1} : ${score2} ${matchObj.team2?.name}`
      : `Match ${matchId} beendet.`;

    const newHistory = recordState(history, updated, logText);
    setHistory(newHistory);

    // Trigger celebration confetti if final completed!
    if (matchObj && (matchObj.round === tournament.rounds?.length || matchObj.id === 'grand_final')) {
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
    }
  };

  // Handle Swiss System Next Round Trigger
  const handleGenerateNextSwissRound = () => {
    if (!tournament || tournament.system !== TOURNAMENT_SYSTEMS.SWISS) return;

    let updated = generateNextSwissRound(tournament);
    if (updated) {
      updated = autoAssignFields(updated);
      const newHistory = recordState(
        history,
        updated,
        `Swiss Runde ${updated.currentRound} wurde generiert.`
      );
      setHistory(newHistory);
    }
  };

  // Handle Undo
  const handleUndo = () => {
    if (history && history.past.length > 0) {
      const newHistory = undoState(history);
      setHistory(newHistory);
    }
  };

  // Handle Import JSON
  const handleImportJson = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const importedData = await importFromJsonFile(file);
      const newHistory = createInitialHistory(importedData);
      setHistory(newHistory);
      setShowWizard(false);
      alert('Turnier erfolgreich aus JSON importiert!');
    } catch (err) {
      alert(err.message || 'Fehler beim Importieren');
    }
  };

  // Handle Export JSON Backup
  const handleExportJson = () => {
    if (tournament) {
      exportToJsonFile(tournament);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-900 text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* Header Bar */}
      <Header
        tournament={tournament}
        onNewTournament={() => setShowWizard(true)}
        onExportJson={handleExportJson}
        onImportJson={handleImportJson}
        onUndo={handleUndo}
        canUndo={!!(history && history.past.length > 0)}
        onOpenBeamerMode={() => setShowBeamer(true)}
        onOpenRandomTools={() => setShowRandomTools(true)}
        onOpenQrModal={() => setShowQrModal(true)}
        theme={theme}
        onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {!tournament ? (
          /* Empty State Landing */
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 max-w-lg mx-auto">
            <div className="p-5 bg-indigo-600/20 text-indigo-400 rounded-3xl border border-indigo-500/30 shadow-2xl">
              <Trophy className="w-16 h-16" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-white">Willkommen beim TurnierManager Pro</h2>
              <p className="text-sm text-slate-400">
                Die universelle, interaktive Turnierverwaltungs-Software für Sport, Gaming,
                Brettspiele und Partyspiele.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <button
                onClick={() => setShowWizard(true)}
                className="flex-1 py-3 px-6 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl shadow-xl shadow-indigo-600/20 transition flex items-center justify-center gap-2 text-sm"
              >
                <Sparkles className="w-4 h-4" />
                <span>Neues Turnier erstellen</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* View Tab Selector Bar */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
              <div className="flex bg-slate-800/80 p-1 rounded-2xl border border-slate-700/80 text-xs font-semibold">
                {(tournament.system === TOURNAMENT_SYSTEMS.SINGLE_ELIMINATION ||
                  tournament.system === TOURNAMENT_SYSTEMS.DOUBLE_ELIMINATION ||
                  tournament.system === TOURNAMENT_SYSTEMS.HYBRID) && (
                  <button
                    onClick={() => setActiveTab('bracket')}
                    className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
                      activeTab === 'bracket'
                        ? 'bg-indigo-600 text-white shadow'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Trophy className="w-3.5 h-3.5" />
                    <span>Turnierbaum</span>
                  </button>
                )}

                {(tournament.system === TOURNAMENT_SYSTEMS.ROUND_ROBIN ||
                  tournament.system === TOURNAMENT_SYSTEMS.HYBRID ||
                  tournament.system === TOURNAMENT_SYSTEMS.SWISS) && (
                  <button
                    onClick={() => setActiveTab('standings')}
                    className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
                      activeTab === 'standings'
                        ? 'bg-indigo-600 text-white shadow'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Trophy className="w-3.5 h-3.5 text-amber-400" />
                    <span>Tabelle / Standings</span>
                  </button>
                )}

                <button
                  onClick={() => setActiveTab('fields')}
                  className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
                    activeTab === 'fields'
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Spielfelder ({tournament.fields?.length || 0})</span>
                </button>

                <button
                  onClick={() => setActiveTab('matches')}
                  className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
                    activeTab === 'matches'
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <ListFilter className="w-3.5 h-3.5" />
                  <span>Spielplan</span>
                </button>

                <button
                  onClick={() => setActiveTab('log')}
                  className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
                    activeTab === 'log'
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <History className="w-3.5 h-3.5" />
                  <span>Historie</span>
                </button>
              </div>

              {/* Swiss System Manual Next Round Button */}
              {tournament.system === TOURNAMENT_SYSTEMS.SWISS &&
                tournament.currentRound < tournament.totalRounds && (
                  <button
                    onClick={handleGenerateNextSwissRound}
                    className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition shadow"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Nächste Swiss Runde generieren</span>
                  </button>
                )}
            </div>

            {/* Dynamic View Panels */}
            {activeTab === 'bracket' && (
              <div className="space-y-6">
                {tournament.system === TOURNAMENT_SYSTEMS.DOUBLE_ELIMINATION ? (
                  <div className="space-y-8">
                    <BracketView
                      rounds={tournament.rounds.filter((r) => r.bracketType === 'winner')}
                      matches={tournament.matches}
                      onSelectMatch={(m) => setSelectedMatch(m)}
                      bracketTitle="Winner-Bracket (Gewinner)"
                    />
                    <BracketView
                      rounds={tournament.rounds.filter((r) => r.bracketType === 'loser')}
                      matches={tournament.matches}
                      onSelectMatch={(m) => setSelectedMatch(m)}
                      bracketTitle="Loser-Bracket (Verlierer)"
                    />
                    <BracketView
                      rounds={tournament.rounds.filter((r) => r.bracketType === 'grand_final')}
                      matches={tournament.matches}
                      onSelectMatch={(m) => setSelectedMatch(m)}
                      bracketTitle="Grand Final (Finale)"
                    />
                  </div>
                ) : tournament.system === TOURNAMENT_SYSTEMS.HYBRID ? (
                  tournament.stage === 'playoff_stage' && tournament.playoffRounds ? (
                    <BracketView
                      rounds={tournament.playoffRounds}
                      matches={tournament.playoffMatches}
                      onSelectMatch={(m) => setSelectedMatch(m)}
                      bracketTitle="Playoff K.-o.-Baum"
                    />
                  ) : (
                    <div className="p-6 bg-slate-800/80 border border-slate-700/80 rounded-2xl text-center space-y-3">
                      <p className="text-sm font-semibold text-slate-300">
                        Gruppenphase läuft aktuell. Sobald alle Gruppenspiele beendet sind, wird
                        der K.-o.-Turnierbaum automatisch generiert!
                      </p>
                      <button
                        onClick={() => setActiveTab('standings')}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition"
                      >
                        Zu den Gruppentabellen
                      </button>
                    </div>
                  )
                ) : (
                  <BracketView
                    rounds={tournament.rounds}
                    matches={tournament.matches}
                    onSelectMatch={(m) => setSelectedMatch(m)}
                  />
                )}
              </div>
            )}

            {activeTab === 'standings' && <StandingsView tournament={tournament} />}

            {activeTab === 'fields' && (
              <FieldsView
                tournament={tournament}
                onSelectMatch={(m) => setSelectedMatch(m)}
              />
            )}

            {activeTab === 'matches' && (
              <MatchListView
                tournament={tournament}
                onSelectMatch={(m) => setSelectedMatch(m)}
              />
            )}

            {activeTab === 'log' && <ActivityLogView logs={history?.logs || []} />}
          </>
        )}
      </main>

      {/* Modals */}
      {showWizard && (
        <TournamentSetup
          onCreateTournament={handleCreateTournament}
          onClose={tournament ? () => setShowWizard(false) : null}
        />
      )}

      {selectedMatch && (
        <ScoreboardModal
          match={selectedMatch}
          onSaveResult={handleSaveMatchResult}
          onClose={() => setSelectedMatch(null)}
        />
      )}

      {showBeamer && tournament && (
        <BeamerView tournament={tournament} onClose={() => setShowBeamer(false)} />
      )}

      {showRandomTools && tournament && (
        <RandomToolsModal
          teams={tournament.teams}
          onClose={() => setShowRandomTools(false)}
        />
      )}

      {showQrModal && tournament && (
        <QrShareModal tournament={tournament} onClose={() => setShowQrModal(false)} />
      )}
    </div>
  );
}
