import { createRegistry } from './createRegistry';

export function createConfigurationRegistry({ logger } = {}) {
  const registry = createRegistry({ name: 'configuration', key: 'key', logger });

  return Object.freeze({
    ...registry,
    value(key, fallback = undefined) {
      const entry = registry.get(key);
      return entry ? entry.value : fallback;
    },
  });
}
