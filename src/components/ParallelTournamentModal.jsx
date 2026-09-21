import React, { useState } from 'react';
import {
  Users,
  Link2,
  Unlink,
  AlertCircle,
  X,
  UserCheck,
} from 'lucide-react';
import { getTeamPlayerNames } from '../utils/playerMapping';

export const ParallelTournamentModal = ({
  tournaments = [],
  activeTournamentId,
  playerMappings = [],
  onUpdatePlayerMappings,
  onClose,
}) => {
  const activeTournament = tournaments.find((t) => t.id === activeTournamentId) || tournaments[0];
  const otherTournaments = tournaments.filter((t) => t.id !== activeTournament?.id);

  const [selectedOtherTourneyId, setSelectedOtherTourneyId] = useState(
    otherTournaments[0]?.id || ''
  );
  const selectedOtherTourney = tournaments.find((t) => t.id === selectedOtherTourneyId);

  // Form selections for mapping
  const [selectedPlayer1, setSelectedPlayer1] = useState('');
  const [selectedPlayer2, setSelectedPlayer2] = useState('');

  // Extract all distinct player names for active tournament
  const getPlayersListForTournament = (tourney) => {
    if (!tourney || !tourney.teams) return [];
    const namesSet = new Set();
    tourney.teams.forEach((t) => {
      const names = getTeamPlayerNames(t);
      names.forEach((n) => namesSet.add(n));
    });
    return Array.from(namesSet).sort((a, b) => a.localeCompare(b));
  };

  const playersActive = getPlayersListForTournament(activeTournament);
  const playersOther = getPlayersListForTournament(selectedOtherTourney);

  const handleAddMapping = () => {
    if (!selectedPlayer1 || !selectedPlayer2 || !activeTournament || !selectedOtherTourney) {
      alert('Bitte wähle beide Spieler aus, die verknüpft werden sollen.');
      return;
    }

    const newLink1 = {
      tournamentId: activeTournament.id,
      playerIdentifier: selectedPlayer1,
    };
    const newLink2 = {
      tournamentId: selectedOtherTourney.id,
      playerIdentifier: selectedPlayer2,
    };

    // Check if mapping already exists or if we can extend an existing group
    const updatedMappings = [...playerMappings];
    let foundGroupIdx = -1;

    updatedMappings.forEach((group, idx) => {
      const has1 = group.links.some(
        (l) => l.tournamentId === newLink1.tournamentId && l.playerIdentifier === newLink1.playerIdentifier
      );
      const has2 = group.links.some(
        (l) => l.tournamentId === newLink2.tournamentId && l.playerIdentifier === newLink2.playerIdentifier
      );
      if (has1 || has2) {
        foundGroupIdx = idx;
      }
    });

    if (foundGroupIdx !== -1) {
      const existingGroup = { ...updatedMappings[foundGroupIdx] };
      const linksMap = new Map(
        existingGroup.links.map((l) => [`${l.tournamentId}:${l.playerIdentifier}`, l])
      );
      linksMap.set(`${newLink1.tournamentId}:${newLink1.playerIdentifier}`, newLink1);
      linksMap.set(`${newLink2.tournamentId}:${newLink2.playerIdentifier}`, newLink2);
      existingGroup.links = Array.from(linksMap.values());
      updatedMappings[foundGroupIdx] = existingGroup;
    } else {
      updatedMappings.push({
        id: `map_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        links: [newLink1, newLink2],
      });
    }

    onUpdatePlayerMappings(updatedMappings);
    setSelectedPlayer1('');
    setSelectedPlayer2('');
  };

  const handleRemoveMapping = (mappingId) => {
    const updated = playerMappings.filter((m) => m.id !== mappingId);
    onUpdatePlayerMappings(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden my-8">
        {/* Modal Header */}
        <div className="bg-slate-900 border-b border-slate-800 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-slate-800 text-indigo-400 rounded-xl border border-slate-700/60">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Parallel-Turnier & Personen-Zuordnung
              </h2>
              <p className="text-xs text-slate-400">
                Verknüpfe Spieler aus zwei Turnieren, um Zeitplan-Überschneidungen automatisch zu vermeiden.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {tournaments.length < 2 ? (
            <div className="p-6 bg-slate-950 border border-slate-800 rounded-xl text-center space-y-3">
              <AlertCircle className="w-8 h-8 text-amber-400 mx-auto" />
              <p className="text-sm font-medium text-slate-300">
                Es ist derzeit nur ein Turnier vorhanden. Erstelle ein weiteres Turnier, um Personen-Zuordnungen für parallele Spiele festzulegen.
              </p>
            </div>
          ) : (
            <>
              {/* Target tournament selector */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Verknüpfung wählen
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold mb-1">
                      Turnier A (Aktuell)
                    </div>
                    <div className="text-xs font-bold text-indigo-400">
                      {activeTournament?.name}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] text-slate-400 uppercase font-semibold">
                      Turnier B
                    </label>
                    <select
                      value={selectedOtherTourneyId}
                      onChange={(e) => setSelectedOtherTourneyId(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 text-xs focus:outline-none focus:border-indigo-500"
                    >
                      {otherTournaments.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Add Mapping Row */}
              {selectedOtherTourney && (
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                  <span className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Neue Personen-Verknüpfung erstellen
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">
                        Spieler in {activeTournament?.name}
                      </label>
                      <select
                        value={selectedPlayer1}
                        onChange={(e) => setSelectedPlayer1(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                      >
                        <option value="">-- Spieler wählen --</option>
                        {playersActive.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">
                        Spieler in {selectedOtherTourney?.name}
                      </label>
                      <select
                        value={selectedPlayer2}
                        onChange={(e) => setSelectedPlayer2(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                      >
                        <option value="">-- Spieler wählen --</option>
                        {playersOther.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:self-end">
                      <button
                        onClick={handleAddMapping}
                        disabled={!selectedPlayer1 || !selectedPlayer2}
                        className={`w-full py-2 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition ${
                          selectedPlayer1 && selectedPlayer2
                            ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                        }`}
                      >
                        <Link2 className="w-3.5 h-3.5" />
                        <span>Verknüpfen</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Active Mappings List */}
              <div className="space-y-3">
                <span className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Bestehende Personen-Verknüpfungen ({playerMappings.length})
                </span>

                {playerMappings.length === 0 ? (
                  <div className="py-6 text-center text-slate-500 text-xs bg-slate-950 rounded-xl border border-slate-800">
                    Noch keine Personen verknüpft.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                    {playerMappings.map((mapping) => {
                      return (
                        <div
                          key={mapping.id}
                          className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs"
                        >
                          <div className="flex items-center gap-2 flex-wrap flex-1">
                            {mapping.links.map((link, lIdx) => {
                              const tourney = tournaments.find((t) => t.id === link.tournamentId);
                              return (
                                <React.Fragment key={lIdx}>
                                  {lIdx > 0 && <span className="text-indigo-400 font-bold">=</span>}
                                  <div className="bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                                    <UserCheck className="w-3 h-3 text-emerald-400" />
                                    <span className="font-semibold text-slate-200">
                                      {link.playerIdentifier}
                                    </span>
                                    <span className="text-[10px] text-slate-400">
                                      ({tourney ? tourney.name : 'Turnier'})
                                    </span>
                                  </div>
                                </React.Fragment>
                              );
                            })}
                          </div>

                          <button
                            onClick={() => handleRemoveMapping(mapping.id)}
                            className="p-1.5 text-slate-500 hover:text-red-400 transition ml-2"
                            title="Verknüpfung aufheben"
                          >
                            <Unlink className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-900 border-t border-slate-800 p-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl border border-slate-700 transition"
          >
            Fertig / Schließen
          </button>
        </div>
      </div>
    </div>
  );
};
