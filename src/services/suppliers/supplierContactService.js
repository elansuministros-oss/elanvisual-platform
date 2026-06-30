import { supabase } from '../../lib/supabase';
import { SUPPLIER_TABLES } from './supplierTables';

export async function listSupplierContactsByCompanies(companyIds = []) {
  if (!supabase || companyIds.length === 0) return [];

  const { data, error } = await supabase
    .from(SUPPLIER_TABLES.contactos)
    .select('*')
    .in('proveedor_id', companyIds);

  if (error) throw error;
  return data || [];
}

export async function createSupplierContact(proveedorId, datos) {
  if (!supabase) throw new Error('Supabase no configurado');
  if (!proveedorId) throw new Error('ID de proveedor requerido');

  const payload = {
    proveedor_id: proveedorId,
    unidad: 'ELANVISUAL',
    contacto: datos.contacto || 'Contacto principal',
    cargo: datos.cargoContacto || null,
    telefono: datos.telefonoAlterno || null,
    whatsapp: datos.whatsapp || null,
    correo: datos.correo || null,
    area_atencion: datos.categoria || 'Atencion general',
    estado: 'activo',
  };

  const { data, error } = await supabase
    .from(SUPPLIER_TABLES.contactos)
    .insert([payload])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteSupplierContacts(proveedorId) {
  if (!supabase || !proveedorId) return true;

  const { error } = await supabase
    .from(SUPPLIER_TABLES.contactos)
    .delete()
    .eq('proveedor_id', proveedorId);

  if (error) throw error;
  return true;
}
