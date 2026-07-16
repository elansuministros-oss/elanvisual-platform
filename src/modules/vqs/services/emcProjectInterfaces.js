const NOT_CONNECTED = 'EMC_NOT_CONNECTED';

function pendingInterface(name) {
  return async function emcPendingInterface() {
    const error = new Error(`${name} está preparado como interfaz, pero EMC todavía no está conectado al VQS.`);
    error.code = NOT_CONNECTED;
    throw error;
  };
}

export const getMaterials = pendingInterface('getMaterials');
export const getPricing = pendingInterface('getPricing');
export const getInventory = pendingInterface('getInventory');
export const getSuppliers = pendingInterface('getSuppliers');

export const emcProjectInterfaces = Object.freeze({
  getMaterials,
  getPricing,
  getInventory,
  getSuppliers
});

export { NOT_CONNECTED };
