const STORAGE_KEY = 'turnier_master_app_data';
const OLD_STORAGE_KEY = 'turnier_master_current_tournament';

/**
 * Saves state container (tournaments, activeTournamentId, playerMappings) to localStorage
 */
export const saveToLocalStorage = (appData) => {
  try {
    if (!appData) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }
    const dataToSave = {
      ...appData,
      lastSaved: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
  } catch (error) {
    console.error('Fehler beim Speichern in localStorage:', error);
  }
};

/**
 * Loads saved app data from localStorage with backward compatibility
 */
export const loadFromLocalStorage = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Ensure array structures
      if (parsed && Array.isArray(parsed.tournaments)) {
        return {
          tournaments: parsed.tournaments,
          activeTournamentId: parsed.activeTournamentId || (parsed.tournaments[0]?.id || null),
          playerMappings: parsed.playerMappings || [],
        };
      }
    }

    // Fallback: Check old single-tournament key
    const oldRaw = localStorage.getItem(OLD_STORAGE_KEY);
    if (oldRaw) {
      const oldParsed = JSON.parse(oldRaw);
      if (oldParsed && oldParsed.id) {
        return {
          tournaments: [oldParsed],
          activeTournamentId: oldParsed.id,
          playerMappings: [],
        };
      }
    }

    return null;
  } catch (error) {
    console.error('Fehler beim Laden aus localStorage:', error);
    return null;
  }
};

/**
 * Clears saved tournament from localStorage
 */
export const clearLocalStorage = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Fehler beim Löschen aus localStorage:', error);
  }
};

/**
 * Exports full app state or single tournament state as downloaded .json file
 */
export const exportToJsonFile = (appData) => {
  if (!appData) return;

  const jsonStr = JSON.stringify(appData, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const nameToUse = appData.tournaments
    ? 'turnier_manager_pro_all'
    : (appData.name || 'turnier');

  const sanitizedName = nameToUse.toLowerCase().replace(/[^a-z0-9_-]/gi, '_');
  const timestamp = new Date().toISOString().slice(0, 10);

  const link = document.createElement('a');
  link.href = url;
  link.download = `${sanitizedName}_backup_${timestamp}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Reads and parses an uploaded JSON file (supports single tournament or full app backup)
 */
export const importFromJsonFile = (file) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('Keine Datei ausgewählt'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result);
        if (!parsed || typeof parsed !== 'object') {
          reject(new Error('Ungültiges Format in der JSON-Datei'));
          return;
        }

        if (Array.isArray(parsed.tournaments)) {
          resolve(parsed);
        } else if (parsed.id && parsed.system) {
          // Single tournament import
          resolve({
            tournaments: [parsed],
            activeTournamentId: parsed.id,
            playerMappings: [],
          });
        } else {
          reject(new Error('Ungültiges Turnier-Format in der JSON-Datei'));
        }
      } catch (err) {
        reject(new Error('Fehler beim Lesen der JSON-Datei: Ungültiges JSON-Format'));
      }
    };
    reader.onerror = () => reject(new Error('Dateilesefehler'));
    reader.readAsText(file);
  });
};
