import { createRegistry } from './createRegistry';

export function createPermissionRegistry({ logger } = {}) {
  const registry = createRegistry({ name: 'permission', key: 'name', logger });

  return Object.freeze({
    ...registry,
    byDomain(domain) {
      return registry.list().filter((permission) => permission.domain === domain);
    },
  });
}
