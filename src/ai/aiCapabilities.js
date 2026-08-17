const CAPABILITIES_BY_ROLE = {
  admin: {
    role: 'owner',
    canUseAssistant: true,
    canUseVoice: true,
    canAnalyzeFiles: true,
    canRequestDesign: true,
    canRequestImage: true,
    canRequestVideo: true,
    canDraftDocuments: true,
    canReadBusinessData: true,
    canCreateBusinessRecords: true,
    canSendBusinessDocuments: true,
    canApplyAuthorizedDiscounts: true,
    canViewMargins: true,
    canManageMasterPricing: true,
    requiresConfirmationForSensitiveActions: true,
  },
  ventas: {
    role: 'seller',
    canUseAssistant: true,
    canUseVoice: true,
    canAnalyzeFiles: true,
    canRequestDesign: true,
    canRequestImage: true,
    canRequestVideo: true,
    canDraftDocuments: true,
    canReadBusinessData: true,
    canCreateBusinessRecords: true,
    canSendBusinessDocuments: true,
    canApplyAuthorizedDiscounts: false,
    canViewMargins: false,
    canManageMasterPricing: false,
    requiresConfirmationForSensitiveActions: true,
  },
};

const DEFAULT_CAPABILITIES = {
  role: 'restricted',
  canUseAssistant: false,
  canUseVoice: false,
  canAnalyzeFiles: false,
  canRequestDesign: false,
  canRequestImage: false,
  canRequestVideo: false,
  canDraftDocuments: false,
  canReadBusinessData: false,
  canCreateBusinessRecords: false,
  canSendBusinessDocuments: false,
  canApplyAuthorizedDiscounts: false,
  canViewMargins: false,
  canManageMasterPricing: false,
  requiresConfirmationForSensitiveActions: true,
};

export function getAICapabilitiesForRole(role) {
  const normalized = String(role || '').trim().toLowerCase();
  return {
    ...DEFAULT_CAPABILITIES,
    ...(CAPABILITIES_BY_ROLE[normalized] || {}),
  };
}

export function buildAIRuntimeContext({ usuario, contextoAI } = {}) {
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '/';
  const search = typeof window !== 'undefined' ? window.location.search : '';
  const role = String(usuario?.rol || '').toLowerCase();

  return {
    platform: 'ELANVISUAL',
    channel: 'web',
    pathname,
    search,
    role,
    user: usuario
      ? {
          id: usuario.id || null,
          nombre: usuario.nombre || usuario.name || null,
          email: usuario.email || null,
          rol: usuario.rol || null,
        }
      : null,
    businessContext: contextoAI || null,
    capabilities: getAICapabilitiesForRole(role),
    generatedAt: new Date().toISOString(),
  };
}
