import React from 'react';
import { History } from 'lucide-react';

export const ActivityLogView = ({ logs = [] }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-sm">
      <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
        <History className="w-4 h-4 text-indigo-400" />
        <span>Turnier-Historie ({logs.length})</span>
      </h3>

      <div className="max-h-60 overflow-y-auto space-y-2 pr-1 text-xs">
        {logs.length === 0 ? (
          <p className="text-slate-500 py-4 text-center">Bisher keine Ereignisse protokolliert.</p>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              className={`p-2.5 rounded-xl flex items-start gap-2 border font-mono ${
                log.type === 'action'
                  ? 'bg-slate-950 border-slate-800 text-slate-300'
                  : log.type === 'warning'
                  ? 'bg-amber-950/20 border-amber-500/30 text-amber-300'
                  : 'bg-indigo-950/20 border-indigo-500/30 text-indigo-300'
              }`}
            >
              <span className="text-[10px] text-slate-500 shrink-0 font-sans mt-0.5">
                [{log.timestamp}]
              </span>
              <span className="flex-1 font-sans">{log.text}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
