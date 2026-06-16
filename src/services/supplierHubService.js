import { supabase } from '../lib/supabase';

const EMPRESAS = 'elankav_supplier_empresas';
const CONTACTOS = 'elankav_supplier_contactos_unidad';
const CAPACIDADES = 'elankav_supplier_capacidades';
const PRODUCTOS = 'elankav_supplier_productos_servicios';

const mapProveedorUI = (empresa = {}, contactos = [], capacidades = []) => {
  const contactoPrincipal = contactos[0] || {};
  const capacidadesTexto = capacidades.map((c) => c.capacidad).filter(Boolean).join(', ');
  const categoriaPrincipal = capacidades[0]?.categoria || 'Proveedor';

  return {
    id: empresa.id,
    nombre: empresa.nombre_comercial || '',
    razonSocial: empresa.razon_social || '',
    ruc: empresa.ruc || '',
    contacto: contactoPrincipal.contacto || '',
    cargoContacto: contactoPrincipal.cargo || '',
    whatsapp: contactoPrincipal.whatsapp || empresa.whatsapp_principal || '',
    telefonoAlterno: contactoPrincipal.telefono || empresa.telefono_principal || '',
    correo: contactoPrincipal.correo || empresa.correo_principal || '',
    sitioWeb: empresa.sitio_web || '',
    direccion: empresa.direccion_principal || '',
    departamento: empresa.ciudad || '',
    municipio: empresa.zona || '',
    zonaCobertura: empresa.zona || '',
    ubicacion: empresa.direccion_principal || '',
    categoria: categoriaPrincipal,
    subcategorias: capacidadesTexto,
    aceptaCredito: 'No',
    diasCredito: 0,
    moneda: 'USD',
    tiempoEntrega: '',
    capacidad: capacidadesTexto,
    condicionesPago: '',
    observaciones: empresa.notas || '',
    calidad: 5,
    cumplimiento: 5,
    precio: 5,
    tiempo: 5,
    preferido: false,
    activo: empresa.estado !== 'inactivo',
    raw: empresa,
    contactos,
    capacidades,
  };
};

export async function obtenerProveedores() {
  if (!supabase) return [];

  const { data: empresas, error } = await supabase
    .from(EMPRESAS)
    .select('*')
    .order('nombre_comercial');

  if (error) {
    console.error('Supplier Hub proveedores error:', error);
    return [];
  }

  const ids = (empresas || []).map((e) => e.id);

  if (ids.length === 0) return [];

  const [{ data: contactos }, { data: capacidades }] = await Promise.all([
    supabase.from(CONTACTOS).select('*').in('proveedor_id', ids),
    supabase.from(CAPACIDADES).select('*').in('proveedor_id', ids),
  ]);

  return (empresas || []).map((empresa) =>
    mapProveedorUI(
      empresa,
      (contactos || []).filter((c) => c.proveedor_id === empresa.id),
      (capacidades || []).filter((c) => c.proveedor_id === empresa.id)
    )
  );
}

export async function crearProveedor(datos) {
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
    .from(EMPRESAS)
    .insert([payload])
    .select()
    .single();

  if (error) throw error;

  if (datos.contacto || datos.whatsapp || datos.correo) {
    await supabase.from(CONTACTOS).insert([{
      proveedor_id: data.id,
      unidad: 'ELANVISUAL',
      contacto: datos.contacto || 'Contacto principal',
      cargo: datos.cargoContacto || null,
      telefono: datos.telefonoAlterno || null,
      whatsapp: datos.whatsapp || null,
      correo: datos.correo || null,
      area_atencion: datos.categoria || 'Atencion general',
      estado: 'activo',
    }]);
  }

  if (datos.categoria || datos.subcategorias) {
    const caps = String(datos.subcategorias || datos.categoria || '')
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean);

    const lista = caps.length ? caps : [datos.categoria];

    await supabase.from(CAPACIDADES).insert(
      lista.map((capacidad) => ({
        proveedor_id: data.id,
        categoria: datos.categoria || 'General',
        capacidad,
        aplica_a_unidad: 'ELANVISUAL',
        estado: 'activo',
      }))
    );
  }

  return data;
}

export async function actualizarProveedor(id, datos) {
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
    estado: datos.activo === false ? 'inactivo' : 'activo',
    notas: datos.observaciones || null,
    actualizado_en: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from(EMPRESAS)
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  return data;
}

export async function obtenerProductosProveedor(proveedorId) {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from(PRODUCTOS)
    .select('*')
    .eq('proveedor_id', proveedorId);

  if (error) {
    console.error('Supplier Hub productos error:', error);
    return [];
  }

  return data || [];
}
