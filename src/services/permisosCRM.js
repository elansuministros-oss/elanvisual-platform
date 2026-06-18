export const normalizarTexto = (valor) =>
  String(valor || '').trim().toLowerCase();

export const normalizarCodigo = (valor) =>
  String(valor || '').trim().toUpperCase();

export const esAdminCRM = (usuario) => {
  const rol = normalizarTexto(usuario?.rol || usuario?.rolNombre || usuario?.tipo);
  const nombre = normalizarTexto(usuario?.usuario || usuario?.nombre || usuario?.email);

  return (
    rol === 'admin' ||
    rol === 'administrador' ||
    rol === 'administrador general' ||
    nombre === 'admin'
  );
};

export const esVendedorCRM = (usuario) => {
  const rol = normalizarTexto(usuario?.rol || usuario?.rolNombre || usuario?.tipo);
  return rol === 'ventas' || rol === 'vendedor';
};

export const codigoVendedorCRM = (usuario) => {
  const base = usuario?.codigo || usuario?.codigo_vendedor || usuario?.usuario || usuario?.id || '001';
  return `VEN-${normalizarCodigo(base).replace(/[^A-Z0-9]/g, '')}`;
};

export const obtenerFirmaVendedor = (usuario) => ({
  vendedor_id: usuario?.id || '',
  vendedorId: usuario?.id || '',
  vendedor_nombre: usuario?.nombre || usuario?.usuario || usuario?.email || '',
  codigo_vendedor: usuario?.codigo_vendedor || usuario?.codigo || codigoVendedorCRM(usuario),
  created_by: usuario?.id || '',
});

export const perteneceAlVendedor = (usuario, registro) => {
  if (esAdminCRM(usuario)) return true;
  if (!esVendedorCRM(usuario)) return false;

  const usuarioId = String(usuario?.id || '');
  const codigo = normalizarCodigo(usuario?.codigo_vendedor || usuario?.codigo || codigoVendedorCRM(usuario));
  const nombre = normalizarTexto(usuario?.nombre || usuario?.usuario || usuario?.email);

  return (
    String(registro?.vendedor_id || '') === usuarioId ||
    String(registro?.vendedorId || '') === usuarioId ||
    String(registro?.created_by || '') === usuarioId ||
    normalizarCodigo(registro?.codigo_vendedor) === codigo ||
    normalizarCodigo(registro?.vendedor_codigo) === codigo ||
    normalizarTexto(registro?.vendedor_nombre) === nombre
  );
};

export const filtrarRegistrosCRM = (usuario, registros = []) => {
  if (esAdminCRM(usuario)) return registros;
  if (!esVendedorCRM(usuario)) return [];
  return registros.filter((registro) => perteneceAlVendedor(usuario, registro));
};

export const puedeCrearCRM = (usuario) => esAdminCRM(usuario) || esVendedorCRM(usuario);

export const puedeEditarCRM = (usuario, registro) => perteneceAlVendedor(usuario, registro);

export const puedeEliminarCRM = (usuario, registro) => perteneceAlVendedor(usuario, registro);