import { supabase } from '../../lib/supabase';
import { SUPPLIER_TABLES } from './supplierTables';

export async function listSupplierProducts(proveedorId) {
  if (!supabase || !proveedorId) return [];

  const { data, error } = await supabase
    .from(SUPPLIER_TABLES.productos)
    .select('*')
    .eq('proveedor_id', proveedorId);

  if (error) throw error;
  return data || [];
}

export async function deleteSupplierProducts(proveedorId) {
  if (!supabase || !proveedorId) return true;

  const { error } = await supabase
    .from(SUPPLIER_TABLES.productos)
    .delete()
    .eq('proveedor_id', proveedorId);

  if (error) throw error;
  return true;
}
