export function mapSupplierToUI(empresa = {}, contactos = [], capacidades = []) {
  const contactoPrincipal = contactos[0] || {};
  const capacidadesTexto = capacidades.map((item) => item.capacidad).filter(Boolean).join(', ');
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
}

export function normalizeSupplierForm(datos = {}) {
  return {
    nombre: String(datos.nombre || '').trim(),
    razonSocial: String(datos.razonSocial || '').trim(),
    ruc: String(datos.ruc || '').trim(),
    contacto: String(datos.contacto || '').trim(),
    cargoContacto: String(datos.cargoContacto || '').trim(),
    whatsapp: String(datos.whatsapp || '').trim(),
    telefonoAlterno: String(datos.telefonoAlterno || '').trim(),
    correo: String(datos.correo || '').trim(),
    sitioWeb: String(datos.sitioWeb || '').trim(),
    direccion: String(datos.direccion || '').trim(),
    departamento: String(datos.departamento || 'Managua').trim(),
    municipio: String(datos.municipio || '').trim(),
    zonaCobertura: String(datos.zonaCobertura || '').trim(),
    categoria: String(datos.categoria || 'General').trim(),
    subcategorias: String(datos.subcategorias || '').trim(),
    observaciones: String(datos.observaciones || '').trim(),
    activo: datos.activo !== false,
  };
}
