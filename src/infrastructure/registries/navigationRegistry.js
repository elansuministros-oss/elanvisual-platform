import { createRegistry } from './createRegistry';

export function createNavigationRegistry({ logger } = {}) {
  const registry = createRegistry({ name: 'navigation', key: 'path', logger });

  return Object.freeze({
    ...registry,
    byDomain(domain) {
      return registry.list().filter((route) => route.domain === domain);
    },
  });
}
