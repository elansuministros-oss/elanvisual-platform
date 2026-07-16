function emcBaseUrl() {
  return String(import.meta.env.VITE_ELANKAV_EMC_URL || '').replace(/\/$/, '');
}

export function isEmcConfigured() {
  return Boolean(emcBaseUrl());
}

async function emcRequest(path, params = {}) {
  const base = emcBaseUrl();
  if (!base) return { configured: false, data: [] };

  const url = new URL(`${base}${path}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value));
  });

  const response = await fetch(url, { headers: { Accept: 'application/json' } });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(payload?.error || 'EMC no está disponible.');
    error.code = payload?.code || 'EMC_REQUEST_FAILED';
    error.status = response.status;
    throw error;
  }

  return { configured: true, data: payload?.data || payload || [] };
}

export function searchMaterials(query, filters = {}) {
  return emcRequest('/api/emc/materials', { q: query, ...filters });
}

export function getMaterialCost(materialId) {
  return emcRequest(`/api/emc/materials/${encodeURIComponent(materialId)}/cost`);
}

export function getMaterialInventory(materialId) {
  return emcRequest(`/api/emc/materials/${encodeURIComponent(materialId)}/inventory`);
}

export function getMaterialSuppliers(materialId) {
  return emcRequest(`/api/emc/materials/${encodeURIComponent(materialId)}/suppliers`);
}

export const emcCatalogGateway = {
  isConfigured: isEmcConfigured,
  searchMaterials,
  getMaterialCost,
  getMaterialInventory,
  getMaterialSuppliers,
};
