const STORAGE_KEY = 'turnier_master_current_tournament';

/**
 * Saves current tournament state to localStorage
 */
export const saveToLocalStorage = (tournament) => {
  try {
    if (!tournament) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }
    const dataToSave = {
      ...tournament,
      lastSaved: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
  } catch (error) {
    console.error('Fehler beim Speichern in localStorage:', error);
  }
};

/**
 * Loads saved tournament state from localStorage
 */
export const loadFromLocalStorage = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
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
 * Exports tournament state as a downloaded .json file
 */
export const exportToJsonFile = (tournament) => {
  if (!tournament) return;

  const jsonStr = JSON.stringify(tournament, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const sanitizedName = (tournament.name || 'turnier')
    .toLowerCase()
    .replace(/[^a-z0-9_-]/gi, '_');
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
 * Reads and parses an uploaded JSON file
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
        if (!parsed || typeof parsed !== 'object' || !parsed.id || !parsed.system) {
          reject(new Error('Ungültiges Turnier-Format in der JSON-Datei'));
          return;
        }
        resolve(parsed);
      } catch (err) {
        reject(new Error('Fehler beim Lesen der JSON-Datei: Ungültiges JSON-Format'));
      }
    };
    reader.onerror = () => reject(new Error('Dateilesefehler'));
    reader.readAsText(file);
  });
};
