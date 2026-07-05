import {
  createConfigurationRegistry,
  createDomainRegistry,
  createEventBus,
  createLogger,
  createNavigationRegistry,
  createPermissionRegistry,
  createServiceRegistry,
} from '../../infrastructure';
import { DOMAIN_DEFINITIONS } from './domainDefinitions';
import { PERMISSION_DEFINITIONS } from './permissionDefinitions';

export function createApplicationKernel({ logger = createLogger({ namespace: 'elanvisual:v2:kernel' }) } = {}) {
  const eventBus = createEventBus({ logger });
  const serviceRegistry = createServiceRegistry({ logger });
  const domainRegistry = createDomainRegistry({ logger });
  const permissionRegistry = createPermissionRegistry({ logger });
  const configurationRegistry = createConfigurationRegistry({ logger });
  const navigationRegistry = createNavigationRegistry({ logger });

  DOMAIN_DEFINITIONS.forEach((domain) => domainRegistry.register(domain));
  PERMISSION_DEFINITIONS.forEach((permission) => permissionRegistry.register(permission));

  return Object.freeze({
    logger,
    eventBus,
    serviceRegistry,
    domainRegistry,
    permissionRegistry,
    configurationRegistry,
    navigationRegistry,
  });
}

export const applicationKernel = createApplicationKernel();
