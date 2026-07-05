import { DOMAIN_STATUS } from '../../shared/constants/domainIds';

const permissions = [
  ['commercial.quote.read', 'commercial', 'Read commercial quotes.'],
  ['commercial.quote.create', 'commercial', 'Create commercial quotes.'],
  ['commercial.quote.approve', 'commercial', 'Approve commercial quotes.'],
  ['commercial.quote.convertToOrder', 'commercial', 'Convert quote to order.'],
  ['catalog.material.read', 'catalog', 'Read catalog materials.'],
  ['catalog.material.write', 'catalog', 'Write catalog materials.'],
  ['catalog.cost.validate', 'catalog', 'Validate missing costs.'],
  ['emc.import.run', 'emc', 'Run EMC import.'],
  ['emc.import.save', 'emc', 'Save EMC import result.'],
  ['emc.catalog.read', 'emc', 'Read EMC catalog.'],
  ['ai.studio.use', 'ai', 'Use AI Studio.'],
  ['ai.memory.read', 'ai', 'Read AI memory.'],
  ['ai.quoteDraft.send', 'ai', 'Send AI quote draft.'],
  ['orders.read', 'orders', 'Read orders.'],
  ['orders.update', 'orders', 'Update orders.'],
  ['orders.convert', 'orders', 'Convert order state.'],
  ['production.read', 'production', 'Read production.'],
  ['production.updateStatus', 'production', 'Update production status.'],
  ['finance.read', 'finance', 'Read finance data.'],
  ['finance.payment.register', 'finance', 'Register payment.'],
  ['finance.receipt.generate', 'finance', 'Generate receipt request.'],
  ['inventory.read', 'inventory', 'Read inventory.'],
  ['inventory.reserve', 'inventory', 'Reserve inventory.'],
  ['inventory.consume', 'inventory', 'Consume inventory.'],
  ['purchasing.request.create', 'purchasing', 'Create purchase request.'],
  ['purchasing.order.manage', 'purchasing', 'Manage purchase order.'],
  ['pdf.generate', 'pdf', 'Generate PDF document.'],
  ['pdf.read', 'pdf', 'Read PDF document.'],
  ['admin.users.manage', 'admin', 'Manage users.'],
  ['admin.config.manage', 'admin', 'Manage configuration.'],
];

export const PERMISSION_DEFINITIONS = Object.freeze(
  permissions.map(([name, domain, description]) =>
    Object.freeze({
      name,
      domain,
      description,
      status: DOMAIN_STATUS.ACTIVE,
    })
  )
);
