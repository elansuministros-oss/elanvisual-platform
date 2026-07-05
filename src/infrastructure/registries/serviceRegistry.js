import { createRegistry } from './createRegistry';

export function createServiceRegistry({ logger } = {}) {
  const registry = createRegistry({ name: 'service', key: 'name', logger });

  return Object.freeze({
    ...registry,
    resolve(name) {
      return registry.get(name)?.service || null;
    },
  });
}
