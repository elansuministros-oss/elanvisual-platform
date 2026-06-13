const STORAGE_KEY = 'elanvisual_v2';

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) return null;

    return JSON.parse(raw);
  } catch (error) {
    console.error('Error leyendo storage', error);
    return null;
  }
}

export function saveState(data) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(data)
    );
  } catch (error) {
    console.error('Error guardando storage', error);
  }
}

export function clearState() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error(error);
  }
}