import { supabase } from '../../lib/supabase';
import { SUPPLIER_TABLES } from './supplierTables';

export async function listSupplierCompanies() {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from(SUPPLIER_TABLES.empresas)
    .select('*')
    .order('nombre_comercial');

  if (error) throw error;
  return data || [];
}

export async function createSupplierCompany(datos) {
  if (!supabase) throw new Error('Supabase no configurado');

  const payload = {
    nombre_comercial: datos.nombre,
    razon_social: datos.razonSocial || null,
    ruc: datos.ruc || null,
    telefono_principal: datos.telefonoAlterno || null,
    whatsapp_principal: datos.whatsapp || null,
    correo_principal: datos.correo || null,
    direccion_principal: datos.direccion || null,
    ciudad: datos.departamento || 'Managua',
    zona: datos.zonaCobertura || datos.municipio || null,
    sitio_web: datos.sitioWeb || null,
    unidad_origen: 'ELANVISUAL',
    estado: datos.activo === false ? 'inactivo' : 'activo',
    notas: datos.observaciones || null,
  };

  const { data, error } = await supabase
    .from(SUPPLIER_TABLES.empresas)
    .insert([payload])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateSupplierCompany(id, datos) {
  if (!supabase) throw new Error('Supabase no configurado');
  if (!id) throw new Error('ID de proveedor requerido');

  const payload = {
    nombre_comercial: datos.nombre,
    razon_social: datos.razonSocial || null,
    ruc: datos.ruc || null,
    telefono_principal: datos.telefonoAlterno || null,
    whatsapp_principal: datos.whatsapp || null,
    correo_principal: datos.correo || null,
    direccion_principal: datos.direccion || null,
    ciudad: datos.departamento || 'Managua',
    zona: datos.zonaCobertura || datos.municipio || null,
    sitio_web: datos.sitioWeb || null,
    estado: datos.activo === false ? 'inactivo' : 'activo',
    notas: datos.observaciones || null,
    actualizado_en: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from(SUPPLIER_TABLES.empresas)
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteSupplierCompany(id) {
  if (!supabase) throw new Error('Supabase no configurado');
  if (!id) throw new Error('ID de proveedor requerido');

  const { data, error } = await supabase
    .from(SUPPLIER_TABLES.empresas)
    .delete()
    .eq('id', id)
    .select('id');

  if (error) throw error;

  if (!data || data.length === 0) {
    throw new Error('Supabase no eliminó el proveedor. Revisar RLS, permisos o ID.');
  }

  return true;
}
