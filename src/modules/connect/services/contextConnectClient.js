import { requestConnect } from './connectCoreClient.js';

const PLATFORM = 'ELANVISUAL';

function legacyRouteUnavailable(route) {
  const error = new Error(`Ruta legacy no disponible en CONNECT: ${route}`);
  error.code = 'ELANKAV_CONNECT_LEGACY_ROUTE_UNAVAILABLE';
  error.status = 404;
  return error;
}

// Estas rutas pertenecen al puente legacy anterior a la consolidación de CONNECT.
// Se mantienen como contratos locales temporales para que los consumidores existentes
// puedan activar su fallback sin generar tráfico 404/CORS contra producción.
export async function getPlatformStateConnect() {
  throw legacyRouteUnavailable('/api/v1/platforms/ELANVISUAL/state');
}

export async function updatePlatformStateConnect(_state) {
  throw legacyRouteUnavailable('/api/v1/platforms/ELANVISUAL/state');
}

export async function getCoreSnapshotConnect() {
  throw legacyRouteUnavailable('/api/v1/core/snapshot');
}

export async function mutateCoreEntityConnect({ entity, action, id = '', data = {} } = {}) {
  return requestConnect(`/api/v1/core/${encodeURIComponent(entity)}${id ? `/${encodeURIComponent(id)}` : ''}`, {
    method: action === 'delete' ? 'DELETE' : action === 'update' ? 'PATCH' : 'POST',
    body: JSON.stringify({
      platform: PLATFORM,
      entity,
      action,
      data
    })
  });
}

export const contextConnectClient = Object.freeze({
  getPlatformStateConnect,
  updatePlatformStateConnect,
  getCoreSnapshotConnect,
  mutateCoreEntityConnect
});
