import { buildQuery, requestConnect } from './connectCoreClient.js';

const PLATFORM = 'ELANVISUAL';
const ORDERS_PATH = '/api/v1/orders';

function orderPath(id = '') {
  return id ? `${ORDERS_PATH}/${encodeURIComponent(id)}` : ORDERS_PATH;
}

export async function listOrdersConnect({ platform = PLATFORM, limit = 500 } = {}) {
  const result = await requestConnect(`${ORDERS_PATH}${buildQuery({ platform, limit })}`, {
    method: 'GET'
  });
  return Array.isArray(result) ? result : result?.orders || result?.items || [];
}

export async function createOrderConnect(order) {
  return requestConnect(ORDERS_PATH, {
    method: 'POST',
    body: JSON.stringify({
      platform: PLATFORM,
      order
    })
  });
}

export async function updateOrderConnect(id, order) {
  return requestConnect(orderPath(id), {
    method: 'PATCH',
    body: JSON.stringify({
      platform: PLATFORM,
      order
    })
  });
}

export async function deleteOrderConnect(id) {
  await requestConnect(orderPath(id), {
    method: 'DELETE',
    body: JSON.stringify({ platform: PLATFORM })
  });
  return true;
}

export const operationsConnectClient = Object.freeze({
  listOrdersConnect,
  createOrderConnect,
  updateOrderConnect,
  deleteOrderConnect
});

