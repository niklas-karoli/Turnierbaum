import React from 'react';
import {
  Trophy,
  Download,
  Upload,
  RotateCcw,
  PlusCircle,
  Tv,
  Sun,
  Moon,
  Dices,
  QrCode,
  Volume2,
} from 'lucide-react';

export const Header = ({
  tournament,
  onNewTournament,
  onExportJson,
  onImportJson,
  onUndo,
  canUndo,
  onOpenBeamerMode,
  onOpenRandomTools,
  onOpenQrModal,
  theme,
  onToggleTheme,
}) => {
  return (
    <header className="bg-slate-800/90 border-b border-slate-700/80 backdrop-blur sticky top-0 z-30 px-4 py-3 shadow-md">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Brand logo & tournament title */}
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-tr from-amber-500 to-indigo-600 p-2.5 rounded-xl shadow-lg shadow-amber-500/10">
            <Trophy className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-slate-100 flex items-center gap-2">
              {tournament ? tournament.name : 'TurnierManager Pro'}
              {tournament && (
                <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {tournament.mode === 'team' ? 'Team' : 'Solo'} • {tournament.fields?.length || 0} Felder
                </span>
              )}
            </h1>
            <p className="text-xs text-slate-400">Universelle Interaktive Turnierverwaltung</p>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center flex-wrap gap-2">
          {tournament && (
            <>
              {/* Undo Button */}
              <button
                onClick={onUndo}
                disabled={!canUndo}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  canUndo
                    ? 'bg-slate-700 hover:bg-slate-600 text-slate-200 border border-slate-600'
                    : 'bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-800'
                }`}
                title="Aktion rückgängig machen"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Rückgängig</span>
              </button>

              {/* Beamer Mode Button */}
              <button
                onClick={onOpenBeamerMode}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white shadow-sm transition"
                title="Präsentationsansicht für Beamer / TV öffnen"
              >
                <Tv className="w-3.5 h-3.5" />
                <span>Beamer-Modus</span>
              </button>

              {/* Random Tools Button */}
              <button
                onClick={onOpenRandomTools}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white transition"
                title="Münzwurf / Zufallsgenerator"
              >
                <Dices className="w-3.5 h-3.5" />
                <span>Zufall / Auslosung</span>
              </button>

              {/* QR Code Share Button */}
              <button
                onClick={onOpenQrModal}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-700 hover:bg-slate-600 text-slate-200 border border-slate-600 transition"
                title="QR Code & Teilen"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>Teilen</span>
              </button>

              {/* Export JSON Backup */}
              <button
                onClick={onExportJson}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-700 hover:bg-emerald-600 text-white shadow-sm transition"
                title="Turnier als JSON Backup-Datei herunterladen"
              >
                <Download className="w-3.5 h-3.5" />
                <span>JSON-Backup</span>
              </button>
            </>
          )}

          {/* Import JSON */}
          <label
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-700 hover:bg-slate-600 text-slate-200 border border-slate-600 cursor-pointer transition"
            title="Turnier aus JSON-Datei laden"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>JSON Laden</span>
            <input type="file" accept=".json" onChange={onImportJson} className="hidden" />
          </label>

          {/* New Tournament */}
          <button
            onClick={onNewTournament}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md transition"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Neues Turnier</span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={onToggleTheme}
            className="p-1.5 rounded-lg bg-slate-700 text-slate-300 hover:text-white hover:bg-slate-600 border border-slate-600 transition"
            title="Theme umschalten"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
          </button>
        </div>
      </div>
    </header>
  );
};
