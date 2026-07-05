export function createRegistry({ name, key = 'name', logger } = {}) {
  if (!name) throw new Error('Registry requires a name.');

  const entries = new Map();

  function getEntryKey(entry) {
    const entryKey = entry?.[key];
    if (!entryKey) throw new Error(`${name} registry entry requires "${key}".`);
    return entryKey;
  }

  function register(entry) {
    const entryKey = getEntryKey(entry);
    if (entries.has(entryKey)) {
      logger?.warn?.(`${name} registry overriding entry`, entryKey);
    }

    entries.set(entryKey, Object.freeze({ ...entry }));
    return entries.get(entryKey);
  }

  function unregister(entryKey) {
    return entries.delete(entryKey);
  }

  function get(entryKey) {
    return entries.get(entryKey) || null;
  }

  function has(entryKey) {
    return entries.has(entryKey);
  }

  function list() {
    return [...entries.values()];
  }

  function clear() {
    entries.clear();
  }

  return Object.freeze({
    name,
    register,
    unregister,
    get,
    has,
    list,
    clear,
  });
}
