import { listSupplierCompanies, createSupplierCompany, updateSupplierCompany, deleteSupplierCompany } from './supplierCompanyService';
import { listSupplierContactsByCompanies, createSupplierContact, deleteSupplierContacts } from './supplierContactService';
import { listSupplierCapabilitiesByCompanies, createSupplierCapabilities, deleteSupplierCapabilities } from './supplierCapabilityService';
import { deleteSupplierProducts } from './supplierProductService';
import { mapSupplierToUI, normalizeSupplierForm } from './supplierMapper';
import {
  createSupplierConnect,
  deleteSupplierConnect,
  listSuppliersConnect,
  updateSupplierConnect,
} from '../../modules/connect/services/supplierConnectClient';
import { isConnectUnavailableError } from '../../modules/connect/services/connectCoreClient';

export async function listSuppliersV2() {
  try {
    const suppliers = await listSuppliersConnect();
    if (Array.isArray(suppliers)) return suppliers;
  } catch (error) {
    if (!isConnectUnavailableError(error)) throw error;
  }

  const empresas = await listSupplierCompanies();
  const ids = empresas.map((empresa) => empresa.id).filter(Boolean);

  if (ids.length === 0) return [];

  const [contactos, capacidades] = await Promise.all([
    listSupplierContactsByCompanies(ids),
    listSupplierCapabilitiesByCompanies(ids),
  ]);

  return empresas.map((empresa) =>
    mapSupplierToUI(
      empresa,
      contactos.filter((item) => item.proveedor_id === empresa.id),
      capacidades.filter((item) => item.proveedor_id === empresa.id)
    )
  );
}

export async function createSupplierV2(datos) {
  const limpio = normalizeSupplierForm(datos);
  if (!limpio.nombre) throw new Error('Nombre de proveedor requerido');

  try {
    return await createSupplierConnect(limpio);
  } catch (error) {
    if (!isConnectUnavailableError(error)) throw error;
  }

  const empresa = await createSupplierCompany(limpio);

  if (limpio.contacto || limpio.whatsapp || limpio.correo) {
    await createSupplierContact(empresa.id, limpio);
  }

  if (limpio.categoria || limpio.subcategorias) {
    await createSupplierCapabilities(empresa.id, limpio);
  }

  return empresa;
}

export async function updateSupplierV2(id, datos) {
  const limpio = normalizeSupplierForm(datos);
  if (!id) throw new Error('ID de proveedor requerido');
  if (!limpio.nombre) throw new Error('Nombre de proveedor requerido');

  try {
    return await updateSupplierConnect(id, limpio);
  } catch (error) {
    if (!isConnectUnavailableError(error)) throw error;
  }

  return updateSupplierCompany(id, limpio);
}

export async function deleteSupplierV2(id) {
  if (!id) throw new Error('ID de proveedor requerido');

  try {
    return await deleteSupplierConnect(id);
  } catch (error) {
    if (!isConnectUnavailableError(error)) throw error;
  }

  await deleteSupplierProducts(id);
  await deleteSupplierCapabilities(id);
  await deleteSupplierContacts(id);
  await deleteSupplierCompany(id);

  return true;
}
