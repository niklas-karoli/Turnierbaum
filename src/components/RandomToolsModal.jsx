import React, { useState } from 'react';
import { X, Dices, Sparkles } from 'lucide-react';

export const RandomToolsModal = ({ teams = [], onClose }) => {
  const [activeTab, setActiveTab] = useState('coin'); // 'coin' | 'team_draw'
  const [coinResult, setCoinResult] = useState(null);
  const [isFlipping, setIsFlipping] = useState(false);

  const [selectedTeam, setSelectedTeam] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const flipCoin = () => {
    if (isFlipping) return;
    setIsFlipping(true);
    setCoinResult(null);

    setTimeout(() => {
      const outcome = Math.random() < 0.5 ? 'Kopf' : 'Zahl';
      setCoinResult(outcome);
      setIsFlipping(false);
    }, 800);
  };

  const drawRandomTeam = () => {
    if (isDrawing || teams.length === 0) return;
    setIsDrawing(true);
    setSelectedTeam(null);

    setTimeout(() => {
      const randomIdx = Math.floor(Math.random() * teams.length);
      setSelectedTeam(teams[randomIdx]);
      setIsDrawing(false);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Dices className="w-4 h-4 text-indigo-400" />
            <span className="font-bold text-slate-100 text-sm">Zufalls-Tools & Entscheidungen</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg border border-slate-800 hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-800 text-xs font-medium">
          <button
            onClick={() => setActiveTab('coin')}
            className={`flex-1 py-3 text-center transition ${
              activeTab === 'coin'
                ? 'bg-slate-800 text-indigo-300 border-b-2 border-indigo-500 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Münzwurf (Kopf / Zahl)
          </button>
          <button
            onClick={() => setActiveTab('team_draw')}
            className={`flex-1 py-3 text-center transition ${
              activeTab === 'team_draw'
                ? 'bg-slate-800 text-indigo-300 border-b-2 border-indigo-500 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Team-Auslosung
          </button>
        </div>

        {/* Content */}
        <div className="p-6 text-center space-y-6">
          {activeTab === 'coin' && (
            <div className="space-y-6">
              <div className="h-28 flex items-center justify-center">
                <div
                  className={`w-24 h-24 rounded-full border border-amber-500/50 bg-slate-950 flex items-center justify-center font-extrabold text-xl text-amber-400 shadow-sm transition-all duration-500 ${
                    isFlipping ? 'animate-spin scale-105' : ''
                  }`}
                >
                  {isFlipping ? '?' : coinResult || 'Münze'}
                </div>
              </div>

              <button
                onClick={flipCoin}
                disabled={isFlipping}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs rounded-xl transition flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Münze werfen</span>
              </button>
            </div>
          )}

          {activeTab === 'team_draw' && (
            <div className="space-y-6">
              <div className="min-h-[100px] flex items-center justify-center bg-slate-950 p-4 rounded-xl border border-slate-800">
                {isDrawing ? (
                  <span className="font-semibold text-indigo-400 animate-pulse text-sm">
                    Auslosung läuft...
                  </span>
                ) : selectedTeam ? (
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Ausgelost:</span>
                    <div className="flex items-center justify-center gap-2 text-base font-bold text-emerald-400">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: selectedTeam.color }}
                      />
                      <span>{selectedTeam.name}</span>
                    </div>
                  </div>
                ) : (
                  <span className="text-xs text-slate-500">
                    Klicke unten, um ein zufälliges Team zu ziehen
                  </span>
                )}
              </div>

              <button
                onClick={drawRandomTeam}
                disabled={isDrawing || teams.length === 0}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs rounded-xl transition flex items-center justify-center gap-2"
              >
                <Dices className="w-4 h-4" />
                <span>Zufälliges Team auslosen</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
