import React, { useState } from 'react';
import {
  Trophy,
  Users,
  User,
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
  const [name, setName] = useState('Turnier 2025');
  const [formatOption, setFormatOption] = useState('2v2'); // '1v1', '2v2', '3v3', '5v5', 'custom'
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

  // Derived mode & teamSize
  const mode = formatOption === '1v1' ? 'solo' : 'team';
  const teamSize = formatOption;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden my-8">
        {/* Wizard Header */}
        <div className="bg-slate-900 border-b border-slate-800 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-slate-800 text-indigo-400 rounded-xl border border-slate-700/60">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Neues Turnier erstellen</h2>
              <p className="text-xs text-slate-400">Schritt {step} von 3</p>
            </div>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white text-xs px-3 py-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 transition"
            >
              Abbrechen
            </button>
          )}
        </div>

        {/* Step Progress Bar */}
        <div className="grid grid-cols-3 border-b border-slate-800 text-xs font-medium">
          <div
            className={`p-3 text-center transition ${
              step === 1
                ? 'bg-slate-800/60 text-indigo-400 border-b-2 border-indigo-500 font-semibold'
                : step > 1
                ? 'text-emerald-400'
                : 'text-slate-500'
            }`}
          >
            1. Format & System
          </div>
          <div
            className={`p-3 text-center transition ${
              step === 2
                ? 'bg-slate-800/60 text-indigo-400 border-b-2 border-indigo-500 font-semibold'
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
                ? 'bg-slate-800/60 text-indigo-400 border-b-2 border-indigo-500 font-semibold'
                : 'text-slate-500'
            }`}
          >
            3. Teilnehmer
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-6">
          {/* STEP 1: Basic Info & Integrated Format Selection */}
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
                  placeholder="z. B. Mario Kart Cup / Kicker Master"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Spiel-Format / Teamgröße
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {[
                    { id: '1v1', label: '1 vs 1', sub: 'Einzel (Solo)', icon: User },
                    { id: '2v2', label: '2 vs 2', sub: 'Doppel (Team)', icon: Users },
                    { id: '3v3', label: '3 vs 3', sub: 'Team', icon: Users },
                    { id: '5v5', label: '5 vs 5', sub: 'Team', icon: Users },
                    { id: 'custom', label: 'Custom', sub: 'Variabel', icon: Users },
                  ].map((fmt) => {
                    const Icon = fmt.icon;
                    const isSelected = formatOption === fmt.id;
                    return (
                      <button
                        key={fmt.id}
                        type="button"
                        onClick={() => setFormatOption(fmt.id)}
                        className={`p-3 rounded-xl border text-left transition flex flex-col justify-between gap-2 ${
                          isSelected
                            ? 'bg-slate-800 border-indigo-500 text-white shadow-sm'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${isSelected ? 'text-indigo-400' : 'text-slate-500'}`} />
                        <div>
                          <div className="font-bold text-xs text-slate-100">{fmt.label}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{fmt.sub}</div>
                        </div>
                      </button>
                    );
                  })}
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
                      className={`p-3.5 rounded-xl border cursor-pointer transition flex items-start gap-3 ${
                        system === sysKey
                          ? 'bg-slate-800 border-indigo-500 text-slate-200'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className={`mt-0.5 rounded-full p-1 ${system === sysKey ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-500'}`}>
                        <Check className="w-3 h-3" />
                      </div>
                      <div>
                        <div className="font-semibold text-xs text-slate-200">{sysName}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                          {sysKey === TOURNAMENT_SYSTEMS.SINGLE_ELIMINATION && 'Klassischer K.-o.-Baum, Verlierer scheiden aus.'}
                          {sysKey === TOURNAMENT_SYSTEMS.DOUBLE_ELIMINATION && 'Winner- & Loser-Bracket (2 Chancen).'}
                          {sysKey === TOURNAMENT_SYSTEMS.ROUND_ROBIN && 'Jeder gegen Jeden (Liga).'}
                          {sysKey === TOURNAMENT_SYSTEMS.HYBRID && 'Gruppenphase + K.-o.-Playoffs.'}
                          {sysKey === TOURNAMENT_SYSTEMS.SWISS && 'Runden ohne Ausscheiden gegen Gleichstarke.'}
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
                    className="w-full accent-indigo-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
                  />
                  <span className="font-bold text-sm text-indigo-400 w-12 text-center bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
                    {fieldCount}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Der Planer weist bereitstehenden Spielen automatisch freie Felder zu.
                </p>
              </div>

              {/* System specific parameters */}
              {system === TOURNAMENT_SYSTEMS.HYBRID && (
                <div className="grid grid-cols-2 gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Anzahl Gruppen</label>
                    <input
                      type="number"
                      min="2"
                      max="8"
                      value={groupCount}
                      onChange={(e) => setGroupCount(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Weiterkommer pro Gruppe</label>
                    <input
                      type="number"
                      min="1"
                      max="4"
                      value={advancingPerGroup}
                      onChange={(e) => setAdvancingPerGroup(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 text-sm"
                    />
                  </div>
                </div>
              )}

              {system === TOURNAMENT_SYSTEMS.SWISS && (
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <label className="block text-xs font-medium text-slate-300 mb-1">Anzahl Schweizer Runden</label>
                  <input
                    type="number"
                    min="2"
                    max="10"
                    value={swissRounds}
                    onChange={(e) => setSwissRounds(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 text-sm"
                  />
                  <p className="text-xs text-slate-400 mt-1">Empfohlen für {teams.length} Teams: {getRecommendedSwissRounds(teams.length)} Runden</p>
                </div>
              )}

              {/* Point allocation config */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <span className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Punkteverteilung (Liga / Schweizer System)
                </span>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Sieg</label>
                    <input
                      type="number"
                      value={pointsWin}
                      onChange={(e) => setPointsWin(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-100 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Unentschieden</label>
                    <input
                      type="number"
                      value={pointsDraw}
                      onChange={(e) => setPointsDraw(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-100 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Niederlage</label>
                    <input
                      type="number"
                      value={pointsLoss}
                      onChange={(e) => setPointsLoss(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-100 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Seeding option */}
              <div className="flex items-center justify-between bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div>
                  <span className="font-medium text-xs text-slate-200">Setzliste berücksichtigen (Seeding)</span>
                  <p className="text-[11px] text-slate-400">Setzt die stärksten Teams voneinander entfernt ins Bracket</p>
                </div>
                <input
                  type="checkbox"
                  checked={seeded}
                  onChange={(e) => setSeeded(e.target.checked)}
                  className="w-4 h-4 accent-indigo-500 rounded cursor-pointer"
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
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => generatePlaceholders(4)}
                    className="text-xs bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-300 px-2.5 py-1 rounded-lg transition"
                  >
                    4
                  </button>
                  <button
                    type="button"
                    onClick={() => generatePlaceholders(8)}
                    className="text-xs bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-300 px-2.5 py-1 rounded-lg transition"
                  >
                    8
                  </button>
                  <button
                    type="button"
                    onClick={() => generatePlaceholders(16)}
                    className="text-xs bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-300 px-2.5 py-1 rounded-lg transition"
                  >
                    16 Platzhalter
                  </button>
                  <button
                    type="button"
                    onClick={handleShuffleTeams}
                    className="text-xs bg-slate-800 hover:bg-slate-700/80 text-slate-300 border border-slate-700 px-2.5 py-1 rounded-lg transition flex items-center gap-1"
                  >
                    <Shuffle className="w-3 h-3 text-indigo-400" /> Mischen
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
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-slate-100 text-xs focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={handleAddTeam}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs px-4 py-2 rounded-xl flex items-center gap-1 transition"
                >
                  <Plus className="w-4 h-4" /> Hinzufügen
                </button>
              </div>

              {/* Teams List */}
              <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                {teams.map((t, idx) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between p-2.5 bg-slate-950 border border-slate-800 rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono text-slate-500 w-5">#{idx + 1}</span>
                      <div
                        className="w-3.5 h-3.5 rounded-full border border-white/20"
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
                        className="bg-transparent text-xs font-medium text-slate-200 focus:outline-none border-b border-transparent focus:border-indigo-500"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveTeam(t.id)}
                      className="text-slate-500 hover:text-red-400 p-1 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Wizard Footer Controls */}
        <div className="bg-slate-900 border-t border-slate-800 p-6 flex items-center justify-between">
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700/80 text-slate-300 font-medium text-xs rounded-xl border border-slate-700 transition"
            >
              Zurück
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs rounded-xl flex items-center gap-2 transition"
            >
              <span>Weiter</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleCreate}
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs rounded-xl flex items-center gap-2 transition"
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
