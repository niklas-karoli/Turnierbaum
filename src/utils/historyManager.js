/**
 * History Manager for Tournament State Undo/Redo & Activity Log
 */

export const MAX_HISTORY_STEPS = 25;

export const createInitialHistory = (initialTournament) => ({
  past: [],
  present: initialTournament,
  future: [],
  logs: [
    {
      id: 'log-' + Date.now(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      text: 'Turnier gestartet.',
      type: 'info',
    },
  ],
});

export const recordState = (historyState, newTournamentState, logMessage, logType = 'action') => {
  if (!newTournamentState) return historyState;

  const past = [...historyState.past, historyState.present];
  if (past.length > MAX_HISTORY_STEPS) {
    past.shift();
  }

  const newLog = logMessage
    ? [
        {
          id: 'log-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          text: logMessage,
          type: logType,
        },
        ...historyState.logs,
      ]
    : historyState.logs;

  return {
    past,
    present: newTournamentState,
    future: [],
    logs: newLog,
  };
};

export const undoState = (historyState) => {
  if (historyState.past.length === 0) return historyState;

  const previous = historyState.past[historyState.past.length - 1];
  const newPast = historyState.past.slice(0, historyState.past.length - 1);

  const undoLog = {
    id: 'log-' + Date.now(),
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    text: 'Aktion rückgängig gemacht.',
    type: 'warning',
  };

  return {
    past: newPast,
    present: previous,
    future: [historyState.present, ...historyState.future],
    logs: [undoLog, ...historyState.logs],
  };
};

export const redoState = (historyState) => {
  if (historyState.future.length === 0) return historyState;

  const next = historyState.future[0];
  const newFuture = historyState.future.slice(1);

  const redoLog = {
    id: 'log-' + Date.now(),
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    text: 'Aktion wiederhergestellt.',
    type: 'info',
  };

  return {
    past: [...historyState.past, historyState.present],
    present: next,
    future: newFuture,
    logs: [redoLog, ...historyState.logs],
  };
};
