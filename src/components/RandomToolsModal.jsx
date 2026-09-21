import React, { useState } from 'react';
import { X, Dices, RotateCcw, Sparkles } from 'lucide-react';

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
    }, 1000);
  };

  const drawRandomTeam = () => {
    if (isDrawing || teams.length === 0) return;
    setIsDrawing(true);
    setSelectedTeam(null);

    setTimeout(() => {
      const randomIdx = Math.floor(Math.random() * teams.length);
      setSelectedTeam(teams[randomIdx]);
      setIsDrawing(false);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-slate-800 px-6 py-4 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Dices className="w-5 h-5 text-purple-400" />
            <span className="font-bold text-slate-100 text-sm">Zufalls-Tools & Entscheidungen</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-800 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('coin')}
            className={`flex-1 py-3 text-center transition ${
              activeTab === 'coin'
                ? 'bg-purple-600/20 text-purple-300 border-b-2 border-purple-500'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Münzwurf (Kopf/Zahl)
          </button>
          <button
            onClick={() => setActiveTab('team_draw')}
            className={`flex-1 py-3 text-center transition ${
              activeTab === 'team_draw'
                ? 'bg-purple-600/20 text-purple-300 border-b-2 border-purple-500'
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
              <div className="h-32 flex items-center justify-center">
                <div
                  className={`w-28 h-28 rounded-full border-4 border-amber-400 bg-gradient-to-tr from-amber-600 to-amber-300 flex items-center justify-center font-black text-2xl text-slate-950 shadow-xl transition-all duration-700 ${
                    isFlipping ? 'animate-spin scale-110' : ''
                  }`}
                >
                  {isFlipping ? '?' : coinResult || 'Münze'}
                </div>
              </div>

              <button
                onClick={flipCoin}
                disabled={isFlipping}
                className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-purple-600/20 transition flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Münze werfen</span>
              </button>
            </div>
          )}

          {activeTab === 'team_draw' && (
            <div className="space-y-6">
              <div className="min-h-[120px] flex items-center justify-center bg-slate-950 p-4 rounded-2xl border border-slate-800">
                {isDrawing ? (
                  <span className="font-bold text-amber-400 animate-pulse text-lg">
                    Auslosung läuft...
                  </span>
                ) : selectedTeam ? (
                  <div className="space-y-2">
                    <span className="text-xs text-slate-400 uppercase font-semibold">Ausgelost:</span>
                    <div className="flex items-center justify-center gap-2 text-xl font-extrabold text-emerald-400">
                      <div
                        className="w-4 h-4 rounded-full"
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
                className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-purple-600/20 transition flex items-center justify-center gap-2"
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
