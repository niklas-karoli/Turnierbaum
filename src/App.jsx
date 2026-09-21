import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Trophy,
  LayoutGrid,
  ListFilter,
  History,
  Sparkles,
  Play,
} from 'lucide-react';

import { Header } from './components/Header';
import { TournamentSetup } from './components/TournamentSetup';
import { ScoreboardModal } from './components/ScoreboardModal';
import { BracketView } from './components/BracketView';
import { StandingsView } from './components/StandingsView';
import { FieldsView } from './components/FieldsView';
import { MatchListView } from './components/MatchListView';
import { RandomToolsModal } from './components/RandomToolsModal';
import { ActivityLogView } from './components/ActivityLogView';
import { ParallelTournamentModal } from './components/ParallelTournamentModal';

import { saveToLocalStorage, loadFromLocalStorage, exportToJsonFile, importFromJsonFile } from './utils/storage';
import { createInitialHistory, recordState, undoState } from './utils/historyManager';
import { updateMatchResult } from './engines/matchUpdater';
import { autoAssignFieldsAllTournaments } from './engines/fieldScheduler';
import { generateNextSwissRound } from './engines/swiss';
import { TOURNAMENT_SYSTEMS } from './types';
import { optimizeAndReshuffleSchedules } from './utils/scheduleOptimizer';

export default function App() {
  const [history, setHistory] = useState(() => {
    const saved = loadFromLocalStorage();
    if (saved && Array.isArray(saved.tournaments) && saved.tournaments.length > 0) {
      return createInitialHistory(saved);
    }
    return null;
  });

  const appState = history?.present || null;
  const tournaments = appState?.tournaments || [];
  const activeTournamentId = appState?.activeTournamentId || tournaments[0]?.id || null;
  const playerMappings = appState?.playerMappings || [];

  const tournament = tournaments.find((t) => t.id === activeTournamentId) || tournaments[0] || null;

  // Active View Tab: 'bracket' | 'standings' | 'fields' | 'matches' | 'log'
  const [activeTab, setActiveTab] = useState('bracket');

  // Modals state
  const [showWizard, setShowWizard] = useState(tournaments.length === 0);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [showRandomTools, setShowRandomTools] = useState(false);
  const [showParallelModal, setShowParallelModal] = useState(false);

  // Auto-save to localStorage whenever app state updates
  useEffect(() => {
    if (appState) {
      saveToLocalStorage(appState);
    }
  }, [appState]);

  // Handle Switch Active Tournament
  const handleSelectTournament = (tourneyId) => {
    if (!appState) return;
    const updatedState = {
      ...appState,
      activeTournamentId: tourneyId,
    };
    setHistory((prev) => ({
      ...prev,
      present: updatedState,
    }));
  };

  // Handle New Tournament Creation
  const handleCreateTournament = (newTournament) => {
    const existingTournaments = appState?.tournaments || [];
    const updatedTournamentsList = [...existingTournaments, newTournament];

    // Run auto assignment across all tournaments
    const scheduledTournaments = autoAssignFieldsAllTournaments(
      updatedTournamentsList,
      playerMappings
    );

    const nextAppState = {
      tournaments: scheduledTournaments,
      activeTournamentId: newTournament.id,
      playerMappings: playerMappings,
    };

    const newHistory = createInitialHistory(nextAppState);
    setHistory(newHistory);
    setShowWizard(false);

    if (newTournament.system === TOURNAMENT_SYSTEMS.ROUND_ROBIN) {
      setActiveTab('standings');
    } else {
      setActiveTab('bracket');
    }
  };

  // Handle Player Mappings Update
  const handleUpdatePlayerMappings = (newMappings) => {
    if (!appState) return;

    // Re-run auto assignment with new mappings
    const reassignedTournaments = autoAssignFieldsAllTournaments(
      appState.tournaments,
      newMappings
    );

    const updatedAppState = {
      ...appState,
      tournaments: reassignedTournaments,
      playerMappings: newMappings,
    };

    const newHistory = recordState(
      history,
      updatedAppState,
      'Personen-Verknüpfungen aktualisiert.'
    );
    setHistory(newHistory);
  };

  // Handle Reshuffle Schedules when collisions detected
  const handleReshuffleSchedules = () => {
    if (!appState || tournaments.length < 2) return;

    const result = optimizeAndReshuffleSchedules(tournaments, playerMappings);

    const nextAppState = {
      ...appState,
      tournaments: result.tournaments,
    };

    const newHistory = recordState(
      history,
      nextAppState,
      `Spielplan neu gemischt: ${result.message}`
    );
    setHistory(newHistory);
    alert(result.message);
  };

  // Handle Match Score Save
  const handleSaveMatchResult = (matchId, score1, score2) => {
    if (!tournament || !appState) return;

    // 1. Update target match result in active tournament
    let updatedActiveTourney = updateMatchResult(tournament, matchId, score1, score2);

    // Replace in tournaments list
    let updatedTournamentsList = appState.tournaments.map((t) =>
      t.id === updatedActiveTourney.id ? updatedActiveTourney : t
    );

    // 2. Re-assign fields across all tournaments (frees up fields and unblocks locked player matches)
    updatedTournamentsList = autoAssignFieldsAllTournaments(
      updatedTournamentsList,
      playerMappings
    );

    const matchObj = (tournament.system === 'hybrid' && tournament.playoffMatches
      ? [...tournament.matches, ...tournament.playoffMatches]
      : tournament.matches
    ).find((m) => m.id === matchId);

    const logText = matchObj
      ? `[${tournament.name}] Ergebnis eingetragen: ${matchObj.team1?.name} ${score1} : ${score2} ${matchObj.team2?.name}`
      : `Match ${matchId} beendet.`;

    const nextAppState = {
      ...appState,
      tournaments: updatedTournamentsList,
    };

    const newHistory = recordState(history, nextAppState, logText);
    setHistory(newHistory);

    // Trigger celebration confetti if final completed!
    if (matchObj && (matchObj.round === tournament.rounds?.length || matchObj.id === 'grand_final')) {
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
    }
  };

  // Handle Swiss System Next Round Trigger
  const handleGenerateNextSwissRound = () => {
    if (!tournament || tournament.system !== TOURNAMENT_SYSTEMS.SWISS || !appState) return;

    let updatedTourney = generateNextSwissRound(tournament);
    if (updatedTourney) {
      let updatedTournamentsList = appState.tournaments.map((t) =>
        t.id === updatedTourney.id ? updatedTourney : t
      );

      updatedTournamentsList = autoAssignFieldsAllTournaments(
        updatedTournamentsList,
        playerMappings
      );

      const nextAppState = {
        ...appState,
        tournaments: updatedTournamentsList,
      };

      const newHistory = recordState(
        history,
        nextAppState,
        `[${tournament.name}] Swiss Runde ${updatedTourney.currentRound} wurde generiert.`
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
    if (appState) {
      exportToJsonFile(appState);
    }
  };

  // Generic direct state update without adding to undo stack for smooth timer ticks
  const handleUpdateTournamentDirect = (updatedTournament) => {
    if (!appState) return;
    const updatedTournaments = appState.tournaments.map((t) =>
      t.id === updatedTournament.id ? updatedTournament : t
    );

    setHistory((prev) => ({
      ...prev,
      present: {
        ...prev.present,
        tournaments: updatedTournaments,
      },
    }));
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white font-sans">
      {/* Header Bar */}
      <Header
        tournament={tournament}
        tournaments={tournaments}
        activeTournamentId={activeTournamentId}
        onSelectTournament={handleSelectTournament}
        onNewTournament={() => setShowWizard(true)}
        onExportJson={handleExportJson}
        onImportJson={handleImportJson}
        onUndo={handleUndo}
        canUndo={!!(history && history.past.length > 0)}
        onOpenRandomTools={() => setShowRandomTools(true)}
        onOpenParallelModal={() => setShowParallelModal(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {!tournament ? (
          /* Empty State Landing */
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 max-w-lg mx-auto">
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl">
              <Trophy className="w-12 h-12 text-indigo-400" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight text-white">Willkommen beim TurnierManager Pro</h2>
              <p className="text-sm text-slate-400 leading-relaxed">
                Moderne, universelle Turnierverwaltung für Sport, Esports, Brettspiele und Firmenevents.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <button
                onClick={() => setShowWizard(true)}
                className="flex-1 py-3 px-6 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl shadow-sm transition flex items-center justify-center gap-2 text-sm"
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
              <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-medium">
                {(tournament.system === TOURNAMENT_SYSTEMS.SINGLE_ELIMINATION ||
                  tournament.system === TOURNAMENT_SYSTEMS.DOUBLE_ELIMINATION ||
                  tournament.system === TOURNAMENT_SYSTEMS.HYBRID) && (
                  <button
                    onClick={() => setActiveTab('bracket')}
                    className={`px-3.5 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                      activeTab === 'bracket'
                        ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Trophy className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Turnierbaum</span>
                  </button>
                )}

                {(tournament.system === TOURNAMENT_SYSTEMS.ROUND_ROBIN ||
                  tournament.system === TOURNAMENT_SYSTEMS.HYBRID ||
                  tournament.system === TOURNAMENT_SYSTEMS.SWISS) && (
                  <button
                    onClick={() => setActiveTab('standings')}
                    className={`px-3.5 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                      activeTab === 'standings'
                        ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Trophy className="w-3.5 h-3.5 text-amber-400" />
                    <span>Tabelle</span>
                  </button>
                )}

                <button
                  onClick={() => setActiveTab('fields')}
                  className={`px-3.5 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                    activeTab === 'fields'
                      ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5 text-slate-300" />
                  <span>Spielfelder ({tournament.fields?.length || 0})</span>
                </button>

                <button
                  onClick={() => setActiveTab('matches')}
                  className={`px-3.5 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                    activeTab === 'matches'
                      ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <ListFilter className="w-3.5 h-3.5 text-slate-300" />
                  <span>Spielplan</span>
                </button>

                <button
                  onClick={() => setActiveTab('log')}
                  className={`px-3.5 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                    activeTab === 'log'
                      ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <History className="w-3.5 h-3.5 text-slate-300" />
                  <span>Historie</span>
                </button>
              </div>

              {/* Swiss System Manual Next Round Button */}
              {tournament.system === TOURNAMENT_SYSTEMS.SWISS &&
                tournament.currentRound < tournament.totalRounds && (
                  <button
                    onClick={handleGenerateNextSwissRound}
                    className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-medium text-xs rounded-lg flex items-center gap-1.5 transition shadow-sm"
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
                      tournament={tournament}
                      tournaments={tournaments}
                      playerMappings={playerMappings}
                      onUpdateTournament={handleUpdateTournamentDirect}
                    />
                    <BracketView
                      rounds={tournament.rounds.filter((r) => r.bracketType === 'loser')}
                      matches={tournament.matches}
                      onSelectMatch={(m) => setSelectedMatch(m)}
                      bracketTitle="Loser-Bracket (Verlierer)"
                      tournament={tournament}
                      tournaments={tournaments}
                      playerMappings={playerMappings}
                      onUpdateTournament={handleUpdateTournamentDirect}
                    />
                    <BracketView
                      rounds={tournament.rounds.filter((r) => r.bracketType === 'grand_final')}
                      matches={tournament.matches}
                      onSelectMatch={(m) => setSelectedMatch(m)}
                      bracketTitle="Grand Final (Finale)"
                      tournament={tournament}
                      tournaments={tournaments}
                      playerMappings={playerMappings}
                      onUpdateTournament={handleUpdateTournamentDirect}
                    />
                  </div>
                ) : tournament.system === TOURNAMENT_SYSTEMS.HYBRID ? (
                  tournament.stage === 'playoff_stage' && tournament.playoffRounds ? (
                    <BracketView
                      rounds={tournament.playoffRounds}
                      matches={tournament.playoffMatches}
                      onSelectMatch={(m) => setSelectedMatch(m)}
                      bracketTitle="Playoff K.-o.-Baum"
                      tournament={tournament}
                      tournaments={tournaments}
                      playerMappings={playerMappings}
                      onUpdateTournament={handleUpdateTournamentDirect}
                    />
                  ) : (
                    <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl text-center space-y-3">
                      <p className="text-sm font-medium text-slate-300">
                        Gruppenphase läuft aktuell. Sobald alle Gruppenspiele beendet sind, wird
                        der K.-o.-Turnierbaum automatisch generiert!
                      </p>
                      <button
                        onClick={() => setActiveTab('standings')}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-xl transition"
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
                    tournament={tournament}
                    tournaments={tournaments}
                    playerMappings={playerMappings}
                    onUpdateTournament={handleUpdateTournamentDirect}
                  />
                )}
              </div>
            )}

            {activeTab === 'standings' && <StandingsView tournament={tournament} />}

            {activeTab === 'fields' && (
              <FieldsView
                tournament={tournament}
                tournaments={tournaments}
                playerMappings={playerMappings}
                onSelectMatch={(m) => setSelectedMatch(m)}
                onUpdateTournament={handleUpdateTournamentDirect}
              />
            )}

            {activeTab === 'matches' && (
              <MatchListView
                tournament={tournament}
                tournaments={tournaments}
                playerMappings={playerMappings}
                onSelectMatch={(m) => setSelectedMatch(m)}
                onUpdateTournament={handleUpdateTournamentDirect}
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
          onClose={tournaments.length > 0 ? () => setShowWizard(false) : null}
        />
      )}

      {selectedMatch && (
        <ScoreboardModal
          tournament={tournament}
          match={selectedMatch}
          onSaveResult={handleSaveMatchResult}
          onUpdateTournament={handleUpdateTournamentDirect}
          onClose={() => setSelectedMatch(null)}
        />
      )}

      {showRandomTools && tournament && (
        <RandomToolsModal
          teams={tournament.teams}
          onClose={() => setShowRandomTools(false)}
        />
      )}

      {showParallelModal && (
        <ParallelTournamentModal
          tournaments={tournaments}
          activeTournamentId={activeTournamentId}
          playerMappings={playerMappings}
          onUpdatePlayerMappings={handleUpdatePlayerMappings}
          onReshuffleSchedules={handleReshuffleSchedules}
          onClose={() => setShowParallelModal(false)}
        />
      )}
    </div>
  );
}
