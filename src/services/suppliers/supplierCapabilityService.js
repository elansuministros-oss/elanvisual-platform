import { supabase } from '../../lib/supabase';
import { SUPPLIER_TABLES } from './supplierTables';

export async function listSupplierCapabilitiesByCompanies(companyIds = []) {
  if (!supabase || companyIds.length === 0) return [];

  const { data, error } = await supabase
    .from(SUPPLIER_TABLES.capacidades)
    .select('*')
    .in('proveedor_id', companyIds);

  if (error) throw error;
  return data || [];
}

export async function createSupplierCapabilities(proveedorId, datos) {
  if (!supabase) throw new Error('Supabase no configurado');
  if (!proveedorId) throw new Error('ID de proveedor requerido');

  const base = String(datos.subcategorias || datos.categoria || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  const capacidades = base.length ? base : [datos.categoria || 'General'];

  const payload = capacidades.map((capacidad) => ({
    proveedor_id: proveedorId,
    categoria: datos.categoria || 'General',
    capacidad,
    aplica_a_unidad: 'ELANVISUAL',
    estado: 'activo',
  }));

  const { data, error } = await supabase
    .from(SUPPLIER_TABLES.capacidades)
    .insert(payload)
    .select();

  if (error) throw error;
  return data || [];
}

export async function deleteSupplierCapabilities(proveedorId) {
  if (!supabase || !proveedorId) return true;

  const { error } = await supabase
    .from(SUPPLIER_TABLES.capacidades)
    .delete()
    .eq('proveedor_id', proveedorId);

  if (error) throw error;
  return true;
}
