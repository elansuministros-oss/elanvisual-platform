import { createRegistry } from './createRegistry';

export function createDomainRegistry({ logger } = {}) {
  return createRegistry({ name: 'domain', key: 'id', logger });
}
