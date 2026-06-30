import { listSupplierCompanies, createSupplierCompany, updateSupplierCompany, deleteSupplierCompany } from './supplierCompanyService';
import { listSupplierContactsByCompanies, createSupplierContact, deleteSupplierContacts } from './supplierContactService';
import { listSupplierCapabilitiesByCompanies, createSupplierCapabilities, deleteSupplierCapabilities } from './supplierCapabilityService';
import { deleteSupplierProducts } from './supplierProductService';
import { mapSupplierToUI, normalizeSupplierForm } from './supplierMapper';

export async function listSuppliersV2() {
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

  return updateSupplierCompany(id, limpio);
}

export async function deleteSupplierV2(id) {
  if (!id) throw new Error('ID de proveedor requerido');

  await deleteSupplierProducts(id);
  await deleteSupplierCapabilities(id);
  await deleteSupplierContacts(id);
  await deleteSupplierCompany(id);

  return true;
}
