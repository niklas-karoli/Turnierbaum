import React, { useState } from 'react';
import {
  Trophy,
  Users,
  User,
  LayoutGrid,
  Settings,
  Plus,
  Trash2,
  Shuffle,
  Sparkles,
  Check,
  ChevronRight,
} from 'lucide-react';
import {
  TOURNAMENT_SYSTEMS,
  TOURNAMENT_SYSTEM_NAMES,
  TEAM_COLORS,
  DEFAULT_RULES,
} from '../types';
import { generateSingleElimination } from '../engines/singleElimination';
import { generateDoubleElimination } from '../engines/doubleElimination';
import { generateRoundRobin } from '../engines/roundRobin';
import { generateHybrid } from '../engines/hybrid';
import { generateSwissInitial, getRecommendedSwissRounds } from '../engines/swiss';
import { initializeFields } from '../engines/fieldScheduler';

export const TournamentSetup = ({ onCreateTournament, onClose }) => {
  const [step, setStep] = useState(1);

  // Form State
  const [name, setName] = useState('Sommer-Cup 2025');
  const [mode, setMode] = useState('team'); // 'solo' | 'team'
  const [teamSize, setTeamSize] = useState('2v2'); // '1v1', '2v2', 'custom'
  const [system, setSystem] = useState(TOURNAMENT_SYSTEMS.SINGLE_ELIMINATION);
  const [fieldCount, setFieldCount] = useState(2);
  const [seeded, setSeeded] = useState(false);

  // Advanced Rules
  const [pointsWin, setPointsWin] = useState(3);
  const [pointsDraw, setPointsDraw] = useState(1);
  const [pointsLoss, setPointsLoss] = useState(0);
  const [groupCount, setGroupCount] = useState(2);
  const [advancingPerGroup, setAdvancingPerGroup] = useState(2);
  const [swissRounds, setSwissRounds] = useState(4);

  // Teams state
  const [teams, setTeams] = useState([
    { id: 'team_1', name: 'FC Rakete', color: TEAM_COLORS[0], seed: 1 },
    { id: 'team_2', name: 'Blitz Kicker', color: TEAM_COLORS[1], seed: 2 },
    { id: 'team_3', name: 'Dynamo Chaos', color: TEAM_COLORS[2], seed: 3 },
    { id: 'team_4', name: 'Smaragd United', color: TEAM_COLORS[3], seed: 4 },
  ]);

  const [newTeamName, setNewTeamName] = useState('');

  // Auto Quick-Generate Placeholder Teams
  const generatePlaceholders = (count) => {
    const generated = [];
    for (let i = 1; i <= count; i++) {
      generated.push({
        id: `team_${Date.now()}_${i}`,
        name: mode === 'solo' ? `Spieler ${i}` : `Team ${i}`,
        color: TEAM_COLORS[(i - 1) % TEAM_COLORS.length],
        seed: i,
      });
    }
    setTeams(generated);
    if (system === TOURNAMENT_SYSTEMS.SWISS) {
      setSwissRounds(getRecommendedSwissRounds(count));
    }
  };

  const handleAddTeam = () => {
    if (!newTeamName.trim()) return;
    const newTeam = {
      id: `team_${Date.now()}`,
      name: newTeamName.trim(),
      color: TEAM_COLORS[teams.length % TEAM_COLORS.length],
      seed: teams.length + 1,
    };
    setTeams([...teams, newTeam]);
    setNewTeamName('');
    if (system === TOURNAMENT_SYSTEMS.SWISS) {
      setSwissRounds(getRecommendedSwissRounds(teams.length + 1));
    }
  };

  const handleRemoveTeam = (id) => {
    setTeams(teams.filter((t) => t.id !== id));
  };

  const handleShuffleTeams = () => {
    const shuffled = [...teams].sort(() => Math.random() - 0.5);
    setTeams(
      shuffled.map((t, idx) => ({ ...t, seed: idx + 1 }))
    );
  };

  const handleCreate = () => {
    if (teams.length < 2) {
      alert('Bitte füge mindestens 2 Teilnehmer/Teams hinzu.');
      return;
    }

    const rules = {
      pointsWin: Number(pointsWin),
      pointsDraw: Number(pointsDraw),
      pointsLoss: Number(pointsLoss),
    };

    const initialFields = initializeFields(Number(fieldCount));

    let tournamentData = {
      id: `tourney_${Date.now()}`,
      name: name.trim() || 'Unbenanntes Turnier',
      mode,
      teamSize,
      system,
      seeded,
      rules,
      teams,
      fields: initialFields,
      createdAt: new Date().toISOString(),
    };

    // Generate bracket or fixtures based on system
    if (system === TOURNAMENT_SYSTEMS.SINGLE_ELIMINATION) {
      const generated = generateSingleElimination(teams, seeded);
      tournamentData.matches = generated.matches;
      tournamentData.rounds = generated.rounds;
    } else if (system === TOURNAMENT_SYSTEMS.DOUBLE_ELIMINATION) {
      const generated = generateDoubleElimination(teams, seeded);
      tournamentData.matches = generated.matches;
      tournamentData.rounds = generated.rounds;
    } else if (system === TOURNAMENT_SYSTEMS.ROUND_ROBIN) {
      const generated = generateRoundRobin(teams);
      tournamentData.matches = generated.matches;
      tournamentData.rounds = generated.rounds;
    } else if (system === TOURNAMENT_SYSTEMS.HYBRID) {
      const generated = generateHybrid(teams, Number(groupCount), Number(advancingPerGroup));
      tournamentData.groups = generated.groups;
      tournamentData.matches = generated.matches;
      tournamentData.advancingPerGroup = generated.advancingPerGroup;
      tournamentData.stage = generated.stage;
    } else if (system === TOURNAMENT_SYSTEMS.SWISS) {
      const generated = generateSwissInitial(teams, Number(swissRounds));
      tournamentData.matches = generated.matches;
      tournamentData.rounds = generated.rounds;
      tournamentData.currentRound = generated.currentRound;
      tournamentData.totalRounds = generated.totalRounds;
    }

    onCreateTournament(tournamentData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden my-8">
        {/* Wizard Header */}
        <div className="bg-slate-800/80 border-b border-slate-700/60 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Neues Turnier erstellen</h2>
              <p className="text-xs text-slate-400">Schritt {step} von 3</p>
            </div>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white text-sm px-3 py-1 rounded-lg hover:bg-slate-800"
            >
              Abbrechen
            </button>
          )}
        </div>

        {/* Step Progress Bar */}
        <div className="grid grid-cols-3 border-b border-slate-800 text-xs font-semibold">
          <div
            className={`p-3 text-center transition ${
              step === 1
                ? 'bg-indigo-600/20 text-indigo-400 border-b-2 border-indigo-500'
                : step > 1
                ? 'text-emerald-400'
                : 'text-slate-500'
            }`}
          >
            1. Modus & System
          </div>
          <div
            className={`p-3 text-center transition ${
              step === 2
                ? 'bg-indigo-600/20 text-indigo-400 border-b-2 border-indigo-500'
                : step > 2
                ? 'text-emerald-400'
                : 'text-slate-500'
            }`}
          >
            2. Reglement & Felder
          </div>
          <div
            className={`p-3 text-center transition ${
              step === 3
                ? 'bg-indigo-600/20 text-indigo-400 border-b-2 border-indigo-500'
                : 'text-slate-500'
            }`}
          >
            3. Teilnehmer
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-6">
          {/* STEP 1: Basic Info & System */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Turnier-Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="z. B. Mario Kart / Tischfußball / FIFA Cup"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Teilnehmer-Typ
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setMode('solo')}
                      className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border font-semibold text-sm transition ${
                        mode === 'solo'
                          ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                      }`}
                    >
                      <User className="w-4 h-4" />
                      <span>Einzel (Solo)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setMode('team')}
                      className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border font-semibold text-sm transition ${
                        mode === 'team'
                          ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                      }`}
                    >
                      <Users className="w-4 h-4" />
                      <span>Teams</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Teamgröße / Format
                  </label>
                  <select
                    value={teamSize}
                    onChange={(e) => setTeamSize(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="1v1">1 vs 1 (Singles)</option>
                    <option value="2v2">2 vs 2 (Doubles / Doppel)</option>
                    <option value="3v3">3 vs 3</option>
                    <option value="5v5">5 vs 5</option>
                    <option value="custom">Benutzerdefiniert</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Turnier-System
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Object.entries(TOURNAMENT_SYSTEM_NAMES).map(([sysKey, sysName]) => (
                    <div
                      key={sysKey}
                      onClick={() => setSystem(sysKey)}
                      className={`p-4 rounded-xl border cursor-pointer transition flex items-start gap-3 ${
                        system === sysKey
                          ? 'bg-indigo-600/20 border-indigo-500 text-indigo-200'
                          : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div className={`mt-0.5 rounded-full p-1 ${system === sysKey ? 'bg-indigo-500 text-white' : 'bg-slate-700'}`}>
                        <Check className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="font-semibold text-sm">{sysName}</div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          {sysKey === TOURNAMENT_SYSTEMS.SINGLE_ELIMINATION && 'Klassischer K.-o.-Baum, Verlierer scheiden aus.'}
                          {sysKey === TOURNAMENT_SYSTEMS.DOUBLE_ELIMINATION && 'Mit Winner- und Loser-Bracket (2 Chancen).'}
                          {sysKey === TOURNAMENT_SYSTEMS.ROUND_ROBIN && 'Jedes Team spielt gegen jedes andere Team (Liga).'}
                          {sysKey === TOURNAMENT_SYSTEMS.HYBRID && 'Gruppenphase gefolgt von K.-o.-Playoffs.'}
                          {sysKey === TOURNAMENT_SYSTEMS.SWISS && 'Mehrere Runden ohne Ausscheiden gegen punktgleiche Gegner.'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Rules & Fields */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Anzahl Spielfelder / Stationen
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="1"
                    max="16"
                    value={fieldCount}
                    onChange={(e) => setFieldCount(e.target.value)}
                    className="w-full accent-indigo-500 h-2 bg-slate-700 rounded-lg cursor-pointer"
                  />
                  <span className="font-bold text-lg text-indigo-400 w-12 text-center bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
                    {fieldCount}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Der Planer weist bereitstehenden Spielen automatisch freie Felder zu.
                </p>
              </div>

              {/* System specific parameters */}
              {system === TOURNAMENT_SYSTEMS.HYBRID && (
                <div className="grid grid-cols-2 gap-4 bg-slate-800/50 p-4 rounded-xl border border-slate-700/60">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Anzahl Gruppen</label>
                    <input
                      type="number"
                      min="2"
                      max="8"
                      value={groupCount}
                      onChange={(e) => setGroupCount(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Weiterkommer pro Gruppe</label>
                    <input
                      type="number"
                      min="1"
                      max="4"
                      value={advancingPerGroup}
                      onChange={(e) => setAdvancingPerGroup(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100"
                    />
                  </div>
                </div>
              )}

              {system === TOURNAMENT_SYSTEMS.SWISS && (
                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/60">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Anzahl Schweizer Runden</label>
                  <input
                    type="number"
                    min="2"
                    max="10"
                    value={swissRounds}
                    onChange={(e) => setSwissRounds(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100"
                  />
                  <p className="text-xs text-slate-400 mt-1">Empfohlen für {teams.length} Teams: {getRecommendedSwissRounds(teams.length)} Runden</p>
                </div>
              )}

              {/* Point allocation config */}
              <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/60 space-y-3">
                <span className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Punkteverteilung (Liga / Schweizer System)
                </span>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Punkte für Sieg</label>
                    <input
                      type="number"
                      value={pointsWin}
                      onChange={(e) => setPointsWin(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Unentschieden</label>
                    <input
                      type="number"
                      value={pointsDraw}
                      onChange={(e) => setPointsDraw(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Niederlage</label>
                    <input
                      type="number"
                      value={pointsLoss}
                      onChange={(e) => setPointsLoss(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100"
                    />
                  </div>
                </div>
              </div>

              {/* Seeding option */}
              <div className="flex items-center justify-between bg-slate-800/50 p-4 rounded-xl border border-slate-700/60">
                <div>
                  <span className="font-semibold text-sm text-slate-200">Setzliste berücksichtigen (Seeding)</span>
                  <p className="text-xs text-slate-400">Setzt die stärksten Teams voneinander entfernt ins Bracket</p>
                </div>
                <input
                  type="checkbox"
                  checked={seeded}
                  onChange={(e) => setSeeded(e.target.checked)}
                  className="w-5 h-5 accent-indigo-500 rounded cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* STEP 3: Participants / Teams */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Teilnehmerliste ({teams.length} {mode === 'solo' ? 'Spieler' : 'Teams'})
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => generatePlaceholders(4)}
                    className="text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 px-2.5 py-1.5 rounded-lg transition"
                  >
                    4 Platzhalter
                  </button>
                  <button
                    type="button"
                    onClick={() => generatePlaceholders(8)}
                    className="text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 px-2.5 py-1.5 rounded-lg transition"
                  >
                    8 Platzhalter
                  </button>
                  <button
                    type="button"
                    onClick={() => generatePlaceholders(16)}
                    className="text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 px-2.5 py-1.5 rounded-lg transition"
                  >
                    16 Platzhalter
                  </button>
                  <button
                    type="button"
                    onClick={handleShuffleTeams}
                    className="text-xs bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 px-2.5 py-1.5 rounded-lg transition flex items-center gap-1"
                  >
                    <Shuffle className="w-3 h-3" /> Mischen
                  </button>
                </div>
              </div>

              {/* Add Team Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddTeam()}
                  placeholder={mode === 'solo' ? 'Spielername eingeben...' : 'Teamname eingeben...'}
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={handleAddTeam}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm px-4 py-2 rounded-xl flex items-center gap-1.5 transition"
                >
                  <Plus className="w-4 h-4" /> Hinzufügen
                </button>
              </div>

              {/* Teams List */}
              <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                {teams.map((t, idx) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between p-3 bg-slate-800/80 border border-slate-700/60 rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-slate-500 w-6">#{idx + 1}</span>
                      <div
                        className="w-4 h-4 rounded-full border border-white/20"
                        style={{ backgroundColor: t.color }}
                      />
                      <input
                        type="text"
                        value={t.name}
                        onChange={(e) => {
                          const updated = [...teams];
                          updated[idx].name = e.target.value;
                          setTeams(updated);
                        }}
                        className="bg-transparent text-sm font-medium text-slate-200 focus:outline-none border-b border-transparent focus:border-indigo-500"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveTeam(t.id)}
                      className="text-slate-500 hover:text-red-400 p-1 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Wizard Footer Controls */}
        <div className="bg-slate-800/80 border-t border-slate-700/60 p-6 flex items-center justify-between">
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm rounded-xl border border-slate-700 transition"
            >
              Zurück
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition"
            >
              <span>Weiter</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleCreate}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition"
            >
              <Sparkles className="w-4 h-4" />
              <span>Turnier jetzt starten</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
