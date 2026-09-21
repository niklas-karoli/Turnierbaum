import React from 'react';
import {
  Trophy,
  Download,
  Upload,
  RotateCcw,
  PlusCircle,
  Dices,
} from 'lucide-react';

export const Header = ({
  tournament,
  onNewTournament,
  onExportJson,
  onImportJson,
  onUndo,
  canUndo,
  onOpenRandomTools,
}) => {
  return (
    <header className="bg-slate-900/80 border-b border-slate-800 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-6 py-3">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Brand logo & tournament title */}
        <div className="flex items-center gap-3">
          <div className="bg-slate-800 p-2 rounded-xl border border-slate-700/60 shadow-sm">
            <Trophy className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h1 className="font-semibold text-base text-slate-100 flex items-center gap-2 tracking-tight">
              {tournament ? tournament.name : 'TurnierManager Pro'}
              {tournament && (
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                  {tournament.mode === 'team' ? 'Teams' : 'Einzel'} • {tournament.fields?.length || 0} Felder
                </span>
              )}
            </h1>
            <p className="text-xs text-slate-400">Turnierverwaltung</p>
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
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  canUndo
                    ? 'bg-slate-800 hover:bg-slate-700/80 text-slate-200 border border-slate-700'
                    : 'bg-slate-900 text-slate-600 cursor-not-allowed border border-slate-800'
                }`}
                title="Aktion rückgängig machen"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Rückgängig</span>
              </button>

              {/* Random Tools Button */}
              <button
                onClick={onOpenRandomTools}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700/80 text-slate-200 border border-slate-700 transition"
                title="Münzwurf / Auslosung"
              >
                <Dices className="w-3.5 h-3.5 text-indigo-400" />
                <span>Auslosung</span>
              </button>

              {/* Export JSON Backup */}
              <button
                onClick={onExportJson}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700/80 text-slate-200 border border-slate-700 transition"
                title="Turnier als JSON Backup-Datei herunterladen"
              >
                <Download className="w-3.5 h-3.5 text-slate-400" />
                <span>Exportieren</span>
              </button>
            </>
          )}

          {/* Import JSON */}
          <label
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700/80 text-slate-200 border border-slate-700 cursor-pointer transition"
            title="Turnier aus JSON-Datei laden"
          >
            <Upload className="w-3.5 h-3.5 text-slate-400" />
            <span>Importieren</span>
            <input type="file" accept=".json" onChange={onImportJson} className="hidden" />
          </label>

          {/* New Tournament */}
          <button
            onClick={onNewTournament}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-sm"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Neues Turnier</span>
          </button>
        </div>
      </div>
    </header>
  );
};
