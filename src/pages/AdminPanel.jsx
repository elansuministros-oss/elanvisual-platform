import React, { useMemo, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { CreditCard, ImagePlus, Megaphone, Plus, Save, Settings, Store } from 'lucide-react';
import MediaLibrary from '../components/MediaLibrary';
import ImageUploader from '../components/ImageUploader';
import { estadosProduccion, etiquetasEstado, useApp } from '../context/AppContext';
import { formatoC$ as formatoBaseC$ } from '../lib/calculos';

const formatoC$ = (valor) => {
  const numero = Number(valor || 0);
  return `C$ ${numero.toLocaleString('es-NI', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const tabs = [
  'dashboard',
  'productos',
  'banners',
  'trabajos',
  'multimedia',
  'identidad',
  'cuentas',
  'pedidos',
  'produccion',
  'veterinarias',
  'usuarios',
];

const cuentaVacia = { banco: '', titular: '', numero: '', moneda: 'Córdobas', activa: true, visible: true };
const usuarioVacio = { nombre: '', usuario: '', email: '', password: '', rol: 'veterinaria', veterinariaId: '', activo: true };
const veterinariaVacia = { nombre: '', responsable: '', whatsapp: '', email: '', direccion: '', comisionPorcentaje: 10, logo: '', activa: true };

function slugUsuario(texto) {
  return String(texto || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '')
    .slice(0, 20);
}


const opcionesUbicacionBanner = [
  { value: 'hero-principal', label: 'Banner principal de portada' },
  { value: 'slider-home', label: 'Slider principal' },
  { value: 'home', label: 'Promociones destacadas' },
  { value: 'catalogo', label: 'Catálogo' },
];

const opcionesLinkBanner = [
  { value: 'catalogo', label: 'Catálogo' },
  { value: 'contacto', label: 'Contacto' },
  { value: 'home', label: 'Inicio' },
  { value: 'whatsapp', label: 'WhatsApp' },
];

function etiquetaUbicacionBanner(valor) {
  return opcionesUbicacionBanner.find((opcion) => opcion.value === valor)?.label || valor || 'Sin ubicación';
}

function etiquetaLinkBanner(valor) {
  return opcionesLinkBanner.find((opcion) => opcion.value === valor)?.label || valor || 'Sin enlace';
}


function limpiarRutaPublica(valor) {
  const texto = String(valor || '').trim();
  if (!texto || texto.startsWith('data:image/')) return '';
  if (texto.startsWith('http://') || texto.startsWith('https://')) return texto;
  return texto.startsWith('/') ? texto : `/${texto}`;
}

function prepararBannerParaGuardar(banner) {
  const imagenRuta = limpiarRutaPublica(banner.imagenRuta || banner.imagen);

  return {
    ...banner,
    imagenRuta,
    imagen: imagenRuta,
    activo: banner.activo !== false,
  };
}

function obtenerImagenBanner(banner) {
  return limpiarRutaPublica(banner?.imagenRuta || banner?.imagen);
}

export default function AdminPanel() {
  const {
    imagenes,
    crearImagen,
    eliminarImagen,
    productos,
    crearProducto,
    actualizarProducto,
    veterinarias,
    crearVeterinaria,
    actualizarVeterinaria,
    eliminarVeterinaria,
    banners,
    crearBanner,
    actualizarBanner,
    eliminarBanner,
    trabajos,
    crearTrabajo,
    actualizarTrabajo,
    configuracion,
    actualizarConfiguracion,
    cuentasBancarias,
    crearCuentaBancaria,
    actualizarCuentaBancaria,
    eliminarCuentaBancaria,
    pedidos,
    actualizarPedido,
    confirmarAnticipo,
    cambiarEstadoProduccion,
    usuarios,
    crearUsuario,
    actualizarUsuario,
    eliminarUsuario,
  } = useApp();

  const [tab, setTab] = useState('dashboard');
  const [nuevoProducto, setNuevoProducto] = useState({ nombre: '', categoria: 'Casas para perros', descripcion: '', medidas: '', precio: '', imagen: '' });
  const [productoEditando, setProductoEditando] = useState(null);
  const bannerVacio = { titulo: '', subtitulo: '', ubicacion: 'hero-principal', link: 'catalogo', imagen: '', imagenRuta: '/productos/portada2-01.png', activo: true };
  const [nuevoBanner, setNuevoBanner] = useState(bannerVacio);
  const [bannerEditando, setBannerEditando] = useState(null);
  const [nuevoTrabajo, setNuevoTrabajo] = useState({ titulo: '', tipo: 'Foto', descripcion: '', imagen: '/productos/producto-01.jpg' });
  const [nuevaCuenta, setNuevaCuenta] = useState(cuentaVacia);
  const [cuentaEditando, setCuentaEditando] = useState(null);
  const [nuevaVeterinaria, setNuevaVeterinaria] = useState(veterinariaVacia);
  const [veterinariaEditando, setVeterinariaEditando] = useState(null);
  const [busquedaVeterinaria, setBusquedaVeterinaria] = useState('');
  const [nuevoUsuario, setNuevoUsuario] = useState(usuarioVacio);
  const [mostrarPasswordUsuario, setMostrarPasswordUsuario] = useState(false);
  const [veterinariaDetalleId, setVeterinariaDetalleId] = useState(null);
  const [mensajeConfig, setMensajeConfig] = useState('');

  const usuariosPorVeterinaria = useMemo(() => {
    const mapa = new Map();
    usuarios.forEach((u) => {
      if (u.rol === 'veterinaria' && u.veterinariaId) mapa.set(u.veterinariaId, u);
    });
    return mapa;
  }, [usuarios]);

  const guardarConfig = (campo, valor) => {
    const nuevoValor = campo === 'anticipoPorcentaje' ? Number(valor) : valor;
    actualizarConfiguracion({
      ...configuracion,
      [campo]: nuevoValor,
      logoTexto: campo === 'nombreSitio' ? nuevoValor : configuracion.logoTexto,
    });
    setMensajeConfig('Cambios guardados localmente.');
  };

  const confirmarGuardadoConfig = () => {
    actualizarConfiguracion(configuracion);
    setMensajeConfig('Configuración guardada y persistida correctamente.');
    setTimeout(() => setMensajeConfig(''), 2500);
  };

  const resetUsuario = () => {
    setNuevoUsuario(usuarioVacio);
    setMostrarPasswordUsuario(false);
  };

  const agregarProducto = (e) => {
    e.preventDefault();
    if (!nuevoProducto.nombre || !nuevoProducto.precio) return;
    crearProducto({ ...nuevoProducto, precio: Number(nuevoProducto.precio), imagen: nuevoProducto.imagen || '/productos/producto-01.jpg' });
    setNuevoProducto({ nombre: '', categoria: 'Casas para perros', descripcion: '', medidas: '', precio: '', imagen: '' });
  };

  const agregarBanner = (e) => {
    e.preventDefault();
    if (!nuevoBanner.titulo) return;

    const bannerPreparado = prepararBannerParaGuardar(nuevoBanner);
    if (!bannerPreparado.imagenRuta) return alert('Escribí una ruta pública de imagen. Ejemplo: /productos/portada2-01.png');

    crearBanner(bannerPreparado);
    setNuevoBanner(bannerVacio);
  };

  const agregarTrabajo = (e) => {
    e.preventDefault();
    if (!nuevoTrabajo.titulo) return;
    crearTrabajo(nuevoTrabajo);
    setNuevoTrabajo({ titulo: '', tipo: 'Foto', descripcion: '', imagen: '/productos/producto-01.jpg' });
  };

  const agregarCuenta = (e) => {
    e.preventDefault();
    if (!nuevaCuenta.banco || !nuevaCuenta.numero) return;
    if (cuentaEditando) {
      actualizarCuentaBancaria({ ...cuentaEditando, ...nuevaCuenta, activa: nuevaCuenta.activa !== false, visible: nuevaCuenta.visible !== false });
      setCuentaEditando(null);
    } else {
      crearCuentaBancaria({ ...nuevaCuenta, activa: true, visible: true });
    }
    setNuevaCuenta(cuentaVacia);
  };

  const agregarVeterinaria = (e) => {
    e.preventDefault();
    if (!nuevaVeterinaria.nombre) return;
    const datosVeterinaria = { ...nuevaVeterinaria, comisionPorcentaje: Number(nuevaVeterinaria.comisionPorcentaje) || 10, activa: nuevaVeterinaria.activa !== false };
    if (veterinariaEditando) {
      actualizarVeterinaria({ ...veterinariaEditando, ...datosVeterinaria });
      setVeterinariaEditando(null);
    } else {
      crearVeterinaria(datosVeterinaria);
    }
    setNuevaVeterinaria(veterinariaVacia);
  };

  const agregarUsuario = (e) => {
    e.preventDefault();
    const usuarioLimpio = String(nuevoUsuario.usuario || '').trim().toLowerCase();
    const emailLimpio = String(nuevoUsuario.email || '').trim().toLowerCase();
    const passwordLimpio = String(nuevoUsuario.password || '').trim();
    const rol = nuevoUsuario.rol || 'veterinaria';

    if (!usuarioLimpio) return alert('Debés escribir un nombre de usuario.');
    if (!nuevoUsuario.id && !passwordLimpio) return alert('Debés escribir una contraseña para el usuario nuevo.');
    if (rol === 'veterinaria' && !nuevoUsuario.veterinariaId) return alert('Debés asignar una veterinaria a este usuario.');

    const vetAsignada = veterinarias.find((v) => v.id === nuevoUsuario.veterinariaId);
    const datosUsuario = {
      ...nuevoUsuario,
      nombre: nuevoUsuario.nombre || (rol === 'veterinaria' ? vetAsignada?.nombre || usuarioLimpio : usuarioLimpio),
      usuario: usuarioLimpio,
      email: emailLimpio,
      rol,
      veterinariaId: rol === 'veterinaria' ? nuevoUsuario.veterinariaId : '',
      activo: nuevoUsuario.activo !== false,
    };

    if (passwordLimpio) datosUsuario.password = passwordLimpio;
    if (!passwordLimpio && nuevoUsuario.id) delete datosUsuario.password;

    if (nuevoUsuario.id) {
      actualizarUsuario(datosUsuario);
    } else {
      const res = crearUsuario(datosUsuario);
      if (!res.ok) return alert('No se pudo crear: usuario/correo/veterinaria duplicada.');
    }
    resetUsuario();
  };

  const editarUsuario = (u) => {
    setNuevoUsuario({ ...u, password: '', veterinariaId: u.veterinariaId || '', rol: u.rol || 'veterinaria', activo: u.activo !== false });
    setTab('usuarios');
    setMostrarPasswordUsuario(false);
  };

  const resetearPasswordUsuario = (u) => {
    const passwordTemporal = window.prompt(`Nueva contraseña para ${u.usuario || u.email}:`, '123456');
    if (!passwordTemporal) return;
    actualizarUsuario({ ...u, password: passwordTemporal, debeCambiarPassword: true, activo: u.activo !== false });
    alert(`Contraseña actualizada para ${u.usuario || u.email}.`);
  };

  const crearAccesoVeterinaria = (v) => {
    const existente = usuariosPorVeterinaria.get(v.id);
    if (existente) {
      alert(`Esta veterinaria ya tiene usuario: ${existente.usuario || existente.email}`);
      return editarUsuario(existente);
    }

    const usuarioSugerido = slugUsuario(v.nombre) || `vet${Date.now()}`;
    const usuarioNuevo = window.prompt(`Usuario para ${v.nombre}:`, usuarioSugerido);
    if (!usuarioNuevo) return;
    const passwordNuevo = window.prompt(`Contraseña temporal para ${v.nombre}:`, '123456');
    if (!passwordNuevo) return;

    const res = crearUsuario({
      nombre: v.nombre,
      usuario: usuarioNuevo,
      email: v.email || '',
      password: passwordNuevo,
      rol: 'veterinaria',
      veterinariaId: v.id,
      activo: true,
      debeCambiarPassword: true,
    });

    if (!res.ok) return alert('No se pudo crear el acceso. Revisá si ya existe ese usuario, correo o veterinaria asignada.');
    alert(`Acceso creado. Usuario: ${usuarioNuevo}`);
  };

  const resetearAccesoVeterinaria = (v) => {
    const u = usuariosPorVeterinaria.get(v.id);
    if (!u) return crearAccesoVeterinaria(v);
    resetearPasswordUsuario(u);
  };

  const marcarComisionPagada = (pedido) => actualizarPedido({ ...pedido, comisionEstado: 'pagada' });

  const calcularComisionPedido = (pedido) => {
    const total = Number(pedido?.resumen?.total || 0);
    const porcentaje = Number(pedido?.veterinaria?.comisionPorcentaje || pedido?.veterinaria?.comision_porcentaje || 10);
    return Number(pedido?.resumen?.comision ?? (total * porcentaje) / 100);
  };

  const obtenerEstadoPedido = (pedido) =>
    etiquetasEstado[pedido?.estadoProduccion] || etiquetasEstado[pedido?.estado] || pedido?.estadoProduccion || pedido?.estado || 'Sin estado';

  function mensajeSeguimiento(pedido, codigo) {
    return `Hola ${pedido.cliente?.nombre}.\n\nConfirmamos la recepción de tu ${pedido.pagoTipo === 'total' ? 'pago total' : 'anticipo'}.\n\nTu pedido ya fue ingresado a producción.\n\nCódigo de seguimiento:\n${codigo}\n\nConsulta el avance en:\nhttps://pet.elankav.com/seguimiento\n\nGracias por confiar en ELANPET.`;
  }

  function confirmarYPedirSeguimiento(pedido) {
    const codigo = confirmarAnticipo(pedido, pedido.pagoTipo);
    const tel = String(pedido.cliente?.whatsapp || '').replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${tel}?text=${encodeURIComponent(mensajeSeguimiento(pedido, codigo))}`, '_blank');
  }

  return (
    <main>
      <div className="admin-head">
        <div>
          <span className="badge">Acceso administrador</span>
          <h1>Panel Maestro ELANPET</h1>
        </div>
        <div className="admin-tabs">
          {tabs.map((t) => (
            <button key={t} type="button" className={tab === t ? 'nav-active' : ''} onClick={() => setTab(t)}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {tab === 'dashboard' && (
        <>
          <div className="cards">
            <div className="kpi"><b>{veterinarias.length}</b><span>Veterinarias</span></div>
            <div className="kpi"><b>{productos.length}</b><span>Productos</span></div>
            <div className="kpi"><b>{usuarios.filter((u) => u.activo !== false).length}</b><span>Usuarios activos</span></div>
            <div className="kpi"><b>{pedidos.filter((p) => p.estado === 'pendiente_pago').length}</b><span>Pendientes de pago</span></div>
            <div className="kpi"><b>{pedidos.filter((p) => p.estadoProduccion && p.estadoProduccion !== 'entregado').length}</b><span>En proceso</span></div>
            <div className="kpi"><b>{formatoC$(pedidos.filter((p) => p.comisionEstado === 'pendiente').reduce((a, p) => a + (p.resumen?.comision || 0), 0))}</b><span>Comisiones por pagar</span></div>
          </div>
          <section className="panel"><h2>Control comercial</h2><p className="note">Los pedidos quedan como clientes potenciales al presionar “Enviar pedido”. El código de seguimiento se genera al confirmar anticipo o pago total.</p></section>
        </>
      )}

      {tab === 'multimedia' && (
        <section className="panel">
          <h2>Gestor Multimedia</h2>
          <MediaLibrary imagenes={imagenes} onAdd={crearImagen} onRemove={eliminarImagen} onSelect={(img) => console.log('Imagen seleccionada', img)} />
        </section>
      )}

      {tab === 'identidad' && (
        <section className="panel">
          <h2><Settings size={20} /> Identidad del sitio</h2>
          <div className="form-grid">
            <label>Nombre del sitio<input value={configuracion.nombreSitio || ''} onChange={(e) => guardarConfig('nombreSitio', e.target.value)} /></label>
            <div className="span-2"><ImageUploader label="Logo principal del sitio" value={configuracion.logo || ''} onChange={(img) => guardarConfig('logo', img)} /></div>
            <label>Slogan<input value={configuracion.slogan || ''} onChange={(e) => guardarConfig('slogan', e.target.value)} /></label>
            <label>WhatsApp<input value={configuracion.whatsapp || ''} onChange={(e) => guardarConfig('whatsapp', e.target.value)} /></label>
            <label>Correo<input value={configuracion.correo || ''} onChange={(e) => guardarConfig('correo', e.target.value)} /></label>
            <label>Instagram<input value={configuracion.instagram || ''} onChange={(e) => guardarConfig('instagram', e.target.value)} /></label>
            <label>Anticipo %<input type="number" value={configuracion.anticipoPorcentaje || 60} onChange={(e) => guardarConfig('anticipoPorcentaje', e.target.value)} /></label>
            <label>Color principal<input type="color" value={configuracion.colorPrincipal || '#1E5AA8'} onChange={(e) => guardarConfig('colorPrincipal', e.target.value)} /></label>
            <label>Color secundario<input type="color" value={configuracion.colorSecundario || '#058B8C'} onChange={(e) => guardarConfig('colorSecundario', e.target.value)} /></label>
            <label>Texto hero<input value={configuracion.textoHero || ''} onChange={(e) => guardarConfig('textoHero', e.target.value)} /></label>
            <label className="span-2">Descripción hero<input value={configuracion.descripcionHero || ''} onChange={(e) => guardarConfig('descripcionHero', e.target.value)} /></label>
          </div>
          <button type="button" onClick={confirmarGuardadoConfig}><Save size={18} /> Guardar cambios</button>
          {mensajeConfig && <p className="success-msg">{mensajeConfig}</p>}
        </section>
      )}

      {tab === 'productos' && (
        <section className="panel">
          <h2><Store size={20} /> Productos</h2>
          <form className="form-grid" onSubmit={agregarProducto}>
            <input placeholder="Nombre" value={nuevoProducto.nombre} onChange={(e) => setNuevoProducto({ ...nuevoProducto, nombre: e.target.value })} />
            <input placeholder="Categoría" value={nuevoProducto.categoria} onChange={(e) => setNuevoProducto({ ...nuevoProducto, categoria: e.target.value })} />
            <input placeholder="Medidas" value={nuevoProducto.medidas} onChange={(e) => setNuevoProducto({ ...nuevoProducto, medidas: e.target.value })} />
            <input placeholder="Precio" type="number" value={nuevoProducto.precio} onChange={(e) => setNuevoProducto({ ...nuevoProducto, precio: e.target.value })} />
            <div className="span-2"><ImageUploader label="Imagen principal del producto" value={nuevoProducto.imagen} onChange={(img) => setNuevoProducto({ ...nuevoProducto, imagen: img })} /></div>
            <input className="span-2" placeholder="Descripción" value={nuevoProducto.descripcion} onChange={(e) => setNuevoProducto({ ...nuevoProducto, descripcion: e.target.value })} />
            <button><Plus size={18} /> Nuevo producto</button>
          </form>

          <div className="admin-list">
            {productos.map((p) => (
              <article key={p.id} className="admin-row admin-row-actions">
                <img src={p.imagen} alt={p.nombre} />
                <div><b>{p.nombre}</b><span>{p.categoria} · {p.medidas}</span></div>
                <strong>{formatoC$(p.precio)}</strong>
                <button className="btn-outline" type="button" onClick={() => setProductoEditando(p)}>Editar</button>
                <button className="btn-outline" type="button" onClick={() => actualizarProducto({ ...p, activo: !p.activo })}>{p.activo === false ? 'Activar' : 'Ocultar'}</button>

                {productoEditando?.id === p.id && (
                  <div className="edit-box span-2">
                    <h3>Editar producto</h3>
                    <ImageUploader label="Reemplazar imagen" value={productoEditando.imagen} onChange={(img) => setProductoEditando({ ...productoEditando, imagen: img })} />
                    <input placeholder="Nombre" value={productoEditando.nombre || ''} onChange={(e) => setProductoEditando({ ...productoEditando, nombre: e.target.value })} />
                    <input placeholder="Categoría" value={productoEditando.categoria || ''} onChange={(e) => setProductoEditando({ ...productoEditando, categoria: e.target.value })} />
                    <input placeholder="Medidas" value={productoEditando.medidas || ''} onChange={(e) => setProductoEditando({ ...productoEditando, medidas: e.target.value })} />
                    <input type="number" placeholder="Precio" value={productoEditando.precio || ''} onChange={(e) => setProductoEditando({ ...productoEditando, precio: Number(e.target.value) })} />
                    <textarea placeholder="Descripción" value={productoEditando.descripcion || ''} onChange={(e) => setProductoEditando({ ...productoEditando, descripcion: e.target.value })} />
                    <input placeholder="Etiqueta" value={productoEditando.etiqueta || ''} onChange={(e) => setProductoEditando({ ...productoEditando, etiqueta: e.target.value })} />
                    <div className="edit-actions"><button type="button" onClick={() => { actualizarProducto(productoEditando); setProductoEditando(null); }}>Guardar cambios</button><button className="btn-outline" type="button" onClick={() => setProductoEditando(null)}>Cancelar</button></div>
                  </div>
                )}
              </article>
            ))}
          </div>
        </section>
      )}

      {tab === 'banners' && (
        <section className="panel">
          <h2><Megaphone size={20} /> Banners</h2>
          <p className="note">Usar como promociones destacadas o campañas de marcas aliadas.</p>
          <form className="form-grid" onSubmit={agregarBanner}>
            <input placeholder="Título" value={nuevoBanner.titulo} onChange={(e) => setNuevoBanner({ ...nuevoBanner, titulo: e.target.value })} />
            <input placeholder="Subtítulo" value={nuevoBanner.subtitulo} onChange={(e) => setNuevoBanner({ ...nuevoBanner, subtitulo: e.target.value })} />
            <input
              className="span-2"
              placeholder="Ruta pública de imagen. Ej: /productos/portada2-01.png"
              value={nuevoBanner.imagenRuta || ''}
              onChange={(e) => setNuevoBanner({ ...nuevoBanner, imagenRuta: e.target.value, imagen: e.target.value })}
            />
            <p className="note span-2">Para banners usá imágenes guardadas en public/productos, public/banners o public/categorias. No se guardan imágenes pesadas en el navegador.</p>
            <select value={nuevoBanner.ubicacion} onChange={(e) => setNuevoBanner({ ...nuevoBanner, ubicacion: e.target.value })}>
              {opcionesUbicacionBanner.map((opcion) => (
                <option key={opcion.value} value={opcion.value}>{opcion.label}</option>
              ))}
            </select>
            <select value={nuevoBanner.link} onChange={(e) => setNuevoBanner({ ...nuevoBanner, link: e.target.value })}>
              {opcionesLinkBanner.map((opcion) => (
                <option key={opcion.value} value={opcion.value}>{opcion.label}</option>
              ))}
            </select>
            <button><ImagePlus size={18} /> Crear banner</button>
          </form>

          <div className="admin-list">
            {banners.map((b) => (
              <article key={b.id} className="admin-row admin-row-actions">
                {obtenerImagenBanner(b) ? <img src={obtenerImagenBanner(b)} alt={b.titulo} /> : <div className="admin-thumb-empty">Sin imagen</div>}
                <div><b>{b.titulo}</b><span>{b.subtitulo}</span><span>{etiquetaUbicacionBanner(b.ubicacion)} · link: {etiquetaLinkBanner(b.link)}</span><span>Imagen: {obtenerImagenBanner(b) || 'Sin ruta'}</span></div>
                <strong>{b.activo !== false ? 'Activo' : 'Oculto'}</strong>
                <button type="button" className="btn-outline" onClick={() => setBannerEditando(b)}>Editar</button>
                <button type="button" className="btn-outline" onClick={() => actualizarBanner({ ...b, activo: b.activo === false })}>{b.activo === false ? 'Activar' : 'Ocultar'}</button>
                <button type="button" className="btn-outline" onClick={() => { if (window.confirm(`¿Eliminar banner ${b.titulo}?`)) eliminarBanner?.(b.id); }}>Eliminar</button>

                {bannerEditando?.id === b.id && (
                  <div className="edit-box span-2">
                    <h3>Editar banner</h3>
                    <input placeholder="Título" value={bannerEditando.titulo || ''} onChange={(e) => setBannerEditando({ ...bannerEditando, titulo: e.target.value })} />
                    <input placeholder="Subtítulo" value={bannerEditando.subtitulo || ''} onChange={(e) => setBannerEditando({ ...bannerEditando, subtitulo: e.target.value })} />
                    <input
                      placeholder="Ruta pública de imagen. Ej: /productos/portada2-01.png"
                      value={bannerEditando.imagenRuta || bannerEditando.imagen || ''}
                      onChange={(e) => setBannerEditando({ ...bannerEditando, imagenRuta: e.target.value, imagen: e.target.value })}
                    />
                    <p className="note">La imagen debe existir dentro de public/. Ejemplo válido: /productos/portada2-01.png</p>
                    <select value={bannerEditando.ubicacion || 'hero-principal'} onChange={(e) => setBannerEditando({ ...bannerEditando, ubicacion: e.target.value })}>
                      {opcionesUbicacionBanner.map((opcion) => (
                        <option key={opcion.value} value={opcion.value}>{opcion.label}</option>
                      ))}
                    </select>
                    <select value={bannerEditando.link || 'catalogo'} onChange={(e) => setBannerEditando({ ...bannerEditando, link: e.target.value })}>
                      {opcionesLinkBanner.map((opcion) => (
                        <option key={opcion.value} value={opcion.value}>{opcion.label}</option>
                      ))}
                    </select>
                    <label className="switch-row"><input type="checkbox" checked={bannerEditando.activo !== false} onChange={(e) => setBannerEditando({ ...bannerEditando, activo: e.target.checked })} /> Banner activo</label>
                    <div className="edit-actions"><button type="button" onClick={() => { const bannerPreparado = prepararBannerParaGuardar(bannerEditando); if (!bannerPreparado.imagenRuta) return alert('Escribí una ruta pública de imagen. Ejemplo: /productos/portada2-01.png'); actualizarBanner(bannerPreparado); setBannerEditando(null); }}>Guardar cambios</button><button type="button" className="btn-outline" onClick={() => setBannerEditando(null)}>Cancelar</button></div>
                  </div>
                )}
              </article>
            ))}
          </div>
        </section>
      )}

      {tab === 'trabajos' && (
        <section className="panel">
          <h2><ImagePlus size={20} /> Trabajos entregados</h2>
          <form className="form-grid" onSubmit={agregarTrabajo}>
            <input placeholder="Título del trabajo" value={nuevoTrabajo.titulo} onChange={(e) => setNuevoTrabajo({ ...nuevoTrabajo, titulo: e.target.value })} />
            <select value={nuevoTrabajo.tipo} onChange={(e) => setNuevoTrabajo({ ...nuevoTrabajo, tipo: e.target.value })}><option>Foto</option><option>Video</option></select>
            <div className="span-2"><ImageUploader label="Foto del trabajo realizado" value={nuevoTrabajo.imagen} onChange={(img) => setNuevoTrabajo({ ...nuevoTrabajo, imagen: img })} /></div>
            <input className="span-2" placeholder="Descripción" value={nuevoTrabajo.descripcion} onChange={(e) => setNuevoTrabajo({ ...nuevoTrabajo, descripcion: e.target.value })} />
            <button><Plus size={18} /> Publicar trabajo</button>
          </form>
          <div className="admin-list">{trabajos.map((t) => <article key={t.id} className="admin-row"><img src={t.imagen} alt={t.titulo} /><div><b>{t.titulo}</b><span>{t.tipo} · {t.descripcion}</span></div><strong>{t.activo ? 'Activo' : 'Oculto'}</strong><label className="switch-row"><input type="checkbox" checked={t.activo !== false} onChange={(e) => actualizarTrabajo({ ...t, activo: e.target.checked })} /> Mostrar</label></article>)}</div>
        </section>
      )}

      {tab === 'cuentas' && (
        <section className="panel">
          <h2><CreditCard size={20} /> Cuentas bancarias oficiales</h2>
          <form className="form-grid" onSubmit={agregarCuenta}>
            <input placeholder="Banco" value={nuevaCuenta.banco} onChange={(e) => setNuevaCuenta({ ...nuevaCuenta, banco: e.target.value })} />
            <input placeholder="Número de cuenta" value={nuevaCuenta.numero} onChange={(e) => setNuevaCuenta({ ...nuevaCuenta, numero: e.target.value })} />
            <input placeholder="Titular" value={nuevaCuenta.titular} onChange={(e) => setNuevaCuenta({ ...nuevaCuenta, titular: e.target.value })} />
            <select value={nuevaCuenta.moneda} onChange={(e) => setNuevaCuenta({ ...nuevaCuenta, moneda: e.target.value })}><option>Córdobas</option><option>Dólares</option></select>
            <button><Plus size={18} /> {cuentaEditando ? 'Guardar cuenta' : 'Agregar cuenta'}</button>
            {cuentaEditando && <button type="button" className="btn-outline" onClick={() => { setCuentaEditando(null); setNuevaCuenta(cuentaVacia); }}>Cancelar edición</button>}
          </form>
          <div className="admin-list">
            {cuentasBancarias.map((c) => (
              <article key={c.id} className="admin-row no-image admin-row-actions">
                <div><b>{c.banco}</b><span>{c.numero} · {c.titular} · {c.moneda}</span><span>Estado: {c.activa !== false ? 'Activa' : 'Inactiva'} · Visibilidad: {c.visible !== false ? 'Visible' : 'Oculta'}</span></div>
                <button type="button" className="btn-outline" onClick={() => { setCuentaEditando(c); setNuevaCuenta({ banco: c.banco || '', titular: c.titular || '', numero: c.numero || '', moneda: c.moneda || 'Córdobas', activa: c.activa !== false, visible: c.visible !== false }); }}>Editar</button>
                <button type="button" className="btn-outline" onClick={() => actualizarCuentaBancaria({ ...c, activa: !(c.activa !== false) })}>{c.activa !== false ? 'Desactivar' : 'Activar'}</button>
                <button type="button" className="btn-outline" onClick={() => actualizarCuentaBancaria({ ...c, visible: !(c.visible !== false) })}>{c.visible !== false ? 'Ocultar' : 'Mostrar'}</button>
                <button type="button" className="btn-outline" onClick={() => { if (window.confirm(`¿Eliminar cuenta ${c.banco}?`)) eliminarCuentaBancaria(c.id); }}>Eliminar</button>
              </article>
            ))}
          </div>
        </section>
      )}

      {tab === 'pedidos' && (
        <section className="panel">
          <h2>Pedidos / clientes potenciales</h2>
          <p className="note">Aquí aparecen los clientes que presionaron “Enviar pedido”. Si no depositan, se les puede dar seguimiento.</p>
          {pedidos.filter((p) => p.estado === 'pendiente_pago').length === 0 ? <p>No hay clientes potenciales pendientes de pago.</p> : <div className="admin-list">{pedidos.filter((p) => p.estado === 'pendiente_pago').map((p) => <article key={p.id} className="admin-row no-image"><div><b>{p.numero} · {p.cliente?.nombre}</b><span>{p.cliente?.whatsapp} · {p.veterinaria?.nombre || 'Venta directa'} · {etiquetasEstado[p.estado] || p.estado}</span><span>Monto solicitado: {formatoC$(p.montoSolicitado || 0)} · Saldo: {formatoC$(p.saldoPendiente || 0)}</span></div><strong>{formatoC$(p.resumen?.total || 0)}</strong><button className="btn-outline" onClick={() => confirmarYPedirSeguimiento(p)}>Validar pago y enviar a producción</button></article>)}</div>}
        </section>
      )}

      {tab === 'produccion' && (
        <section className="panel">
          <h2>Producción y seguimiento</h2>
          <p className="note">Actualizá el estado de fabricación. El cliente lo verá con su código de seguimiento.</p>
          {pedidos.filter((p) => p.codigoSeguimiento).length === 0 ? <p>No hay pedidos con seguimiento activo.</p> : <div className="admin-list">{pedidos.filter((p) => p.codigoSeguimiento).map((p) => <article key={p.id} className="admin-row no-image"><div><b>{p.codigoSeguimiento} · {p.cliente?.nombre}</b><span>{p.items?.map((i) => i.nombre).join(', ')}</span><span>Estado actual: {etiquetasEstado[p.estadoProduccion]}</span></div><strong>{formatoC$(p.saldoPendiente || 0)} saldo</strong><select value={p.estadoProduccion} onChange={(e) => cambiarEstadoProduccion(p, e.target.value)}>{estadosProduccion.map((estado) => <option value={estado} key={estado}>{etiquetasEstado[estado]}</option>)}</select>{p.comisionEstado === 'pendiente' && <button className="btn-outline" onClick={() => marcarComisionPagada(p)}>Comisión pagada</button>}</article>)}</div>}
        </section>
      )}

      {tab === 'veterinarias' && (
        <section className="panel">
          <h2>Veterinarias afiliadas</h2>
          <input type="text" placeholder="Buscar veterinaria..." value={busquedaVeterinaria} onChange={(e) => setBusquedaVeterinaria(e.target.value)} className="span-2" />
          <form className="form-grid" onSubmit={agregarVeterinaria}>
            <input placeholder="Nombre de la veterinaria" value={nuevaVeterinaria.nombre} onChange={(e) => setNuevaVeterinaria({ ...nuevaVeterinaria, nombre: e.target.value })} />
            <input placeholder="Responsable" value={nuevaVeterinaria.responsable} onChange={(e) => setNuevaVeterinaria({ ...nuevaVeterinaria, responsable: e.target.value })} />
            <input placeholder="WhatsApp" value={nuevaVeterinaria.whatsapp} onChange={(e) => setNuevaVeterinaria({ ...nuevaVeterinaria, whatsapp: e.target.value })} />
            <input placeholder="Correo" value={nuevaVeterinaria.email} onChange={(e) => setNuevaVeterinaria({ ...nuevaVeterinaria, email: e.target.value })} />
            <input className="span-2" placeholder="Dirección" value={nuevaVeterinaria.direccion} onChange={(e) => setNuevaVeterinaria({ ...nuevaVeterinaria, direccion: e.target.value })} />
            <input type="number" placeholder="Comisión %" value={nuevaVeterinaria.comisionPorcentaje} onChange={(e) => setNuevaVeterinaria({ ...nuevaVeterinaria, comisionPorcentaje: e.target.value })} />
            <div className="span-2"><ImageUploader label="Logo de la veterinaria" value={nuevaVeterinaria.logo} onChange={(img) => setNuevaVeterinaria({ ...nuevaVeterinaria, logo: img })} /></div>
            <button type="submit">{veterinariaEditando ? 'Guardar cambios' : 'Nueva veterinaria'}</button>
            {veterinariaEditando && <button type="button" className="btn-outline" onClick={() => { setVeterinariaEditando(null); setNuevaVeterinaria(veterinariaVacia); }}>Cancelar edición</button>}
          </form>
          <p className="note">Cada veterinaria tiene un enlace único, QR, usuario propio y comisión individual.</p>
          <div className="admin-list">
            {veterinarias
              .filter((v) => {
                const texto = busquedaVeterinaria.toLowerCase();
                return !texto || v.nombre?.toLowerCase().includes(texto) || v.codigo?.toLowerCase().includes(texto) || v.responsable?.toLowerCase().includes(texto) || v.whatsapp?.toLowerCase().includes(texto) || v.email?.toLowerCase().includes(texto) || v.direccion?.toLowerCase().includes(texto);
              })
              .map((v) => {
                const usuarioVet = usuariosPorVeterinaria.get(v.id);
                const pedidosVeterinaria = pedidos.filter((p) => p.veterinaria?.id === v.id || p.veterinariaId === v.id);
                const pedidosEntregados = pedidosVeterinaria.filter((p) => p.estado === 'entregado' || p.estadoProduccion === 'entregado');
                const comisionesPendientes = pedidosEntregados.filter((p) => p.comisionEstado === 'pendiente');
                const comisionesPagadas = pedidosEntregados.filter((p) => p.comisionEstado === 'pagada');
                const ventasEntregadas = pedidosEntregados.reduce((a, p) => a + Number(p.resumen?.total || 0), 0);
                const comisionPendiente = comisionesPendientes.reduce((a, p) => a + calcularComisionPedido(p), 0);
                const comisionPagada = comisionesPagadas.reduce((a, p) => a + calcularComisionPedido(p), 0);
                const comisionVeterinaria = comisionPendiente + comisionPagada;
                const mostrarDetalle = veterinariaDetalleId === v.id;
                const linkBase = 'https://pet.elankav.com';
                const linkAfiliado = `${linkBase}/v/${v.codigo || v.slug}`;
                return (
                  <article key={v.id} className="admin-row no-image vet-card">
                    <div className="vet-info">
                      {v.logo && <img src={v.logo} alt={v.nombre} className="vet-logo" />}
                      <b>{v.nombre}</b>
                      <span>{v.codigo} · Comisión {v.comisionPorcentaje || 10}%</span>
                      <span>Estado: {v.activa ? 'Activa' : 'Inactiva'}</span>
                      <span>Usuario asignado: {usuarioVet ? `${usuarioVet.usuario || usuarioVet.email} (${usuarioVet.activo !== false ? 'activo' : 'inactivo'})` : 'Sin acceso creado'}</span>
                      {v.responsable && <span>Responsable: {v.responsable}</span>}
                      {v.whatsapp && <span>WhatsApp: {v.whatsapp}</span>}
                      {v.email && <span>Correo: {v.email}</span>}
                      {v.direccion && <span>Dirección: {v.direccion}</span>}
                      <span>Pedidos: {pedidosVeterinaria.length} · Ventas entregadas: {formatoC$(ventasEntregadas)}</span>
                      <span>Comisión pendiente: {formatoC$(comisionPendiente)} · Comisión pagada: {formatoC$(comisionPagada)}</span>
                      <span>Comisión total generada: {formatoC$(comisionVeterinaria)}</span>
                    </div>
                    <div className="qr-box">
                      <QRCodeCanvas id={`qr-${v.id}`} value={linkAfiliado} size={120} includeMargin />
                      <small>{linkAfiliado}</small>
                      <button type="button" className="btn-outline" onClick={() => navigator.clipboard.writeText(linkAfiliado)}>Copiar enlace</button>
                      <button type="button" className="btn-outline" onClick={() => crearAccesoVeterinaria(v)}>{usuarioVet ? 'Ver usuario asignado' : 'Crear acceso'}</button>
                      <button type="button" className="btn-outline" onClick={() => resetearAccesoVeterinaria(v)}>Resetear contraseña</button>
                      <button type="button" className="btn-outline" onClick={() => setVeterinariaDetalleId(mostrarDetalle ? null : v.id)}>{mostrarDetalle ? 'Ocultar pedidos' : 'Ver pedidos'}</button>
                      <button type="button" className="btn-outline" onClick={() => { setVeterinariaEditando(v); setNuevaVeterinaria({ nombre: v.nombre || '', responsable: v.responsable || '', whatsapp: v.whatsapp || '', email: v.email || '', direccion: v.direccion || '', comisionPorcentaje: v.comisionPorcentaje || 10, logo: v.logo || '', activa: v.activa !== false }); }}>Editar</button>
                      <button type="button" className="btn-outline" onClick={() => actualizarVeterinaria({ ...v, activa: !v.activa })}>{v.activa ? 'Desactivar' : 'Activar'}</button>
                      <button type="button" className="btn-outline" onClick={() => { if (window.confirm(`¿Eliminar ${v.nombre}?`)) eliminarVeterinaria(v.id); }}>Eliminar</button>
                    </div>
                    {mostrarDetalle && (
                      <div className="edit-box">
                        <h3>Pedidos y comisiones de {v.nombre}</h3>
                        {pedidosVeterinaria.length === 0 ? (
                          <p className="note">Esta veterinaria todavía no tiene pedidos registrados.</p>
                        ) : (
                          <table>
                            <thead>
                              <tr>
                                <th>Pedido</th>
                                <th>Cliente</th>
                                <th>Total</th>
                                <th>Estado</th>
                                <th>Comisión</th>
                                <th>Pago comisión</th>
                                <th>Acción</th>
                              </tr>
                            </thead>
                            <tbody>
                              {pedidosVeterinaria.map((p) => {
                                const entregado = p.estado === 'entregado' || p.estadoProduccion === 'entregado';
                                const comision = entregado ? calcularComisionPedido(p) : 0;
                                return (
                                  <tr key={p.id}>
                                    <td>{p.codigoSeguimiento || p.numero || p.id}</td>
                                    <td>{p.cliente?.nombre || 'Sin cliente'}</td>
                                    <td>{formatoC$(p.resumen?.total || 0)}</td>
                                    <td>{obtenerEstadoPedido(p)}</td>
                                    <td>{entregado ? formatoC$(comision) : 'No generada'}</td>
                                    <td>{entregado ? (p.comisionEstado === 'pagada' ? 'Pagada' : 'Pendiente') : 'No aplica'}</td>
                                    <td>
                                      {entregado && p.comisionEstado !== 'pagada' ? (
                                        <button type="button" className="btn-outline" onClick={() => marcarComisionPagada(p)}>Marcar pagada</button>
                                      ) : (
                                        <span className="note">—</span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        )}
                      </div>
                    )}
                  </article>
                );
              })}
          </div>
        </section>
      )}

      {tab === 'usuarios' && (
        <section className="panel">
          <h2>Usuarios</h2>
          <p className="note">Administración de accesos para administradores y veterinarias. Cada veterinaria debe tener un usuario asignado a su ficha real.</p>
          <form className="form-grid" onSubmit={agregarUsuario}>
            <input placeholder="Nombre completo" value={nuevoUsuario.nombre || ''} onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, nombre: e.target.value })} />
            <input placeholder="Usuario" value={nuevoUsuario.usuario || ''} onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, usuario: e.target.value })} />
            <input placeholder="Correo" value={nuevoUsuario.email || ''} onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, email: e.target.value })} />
            <div className="password-field">
              <input type={mostrarPasswordUsuario ? 'text' : 'password'} placeholder={nuevoUsuario.id ? 'Nueva contraseña opcional' : 'Contraseña temporal'} value={nuevoUsuario.password || ''} onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, password: e.target.value })} autoComplete="new-password" />
              <button type="button" className="password-toggle" onClick={() => setMostrarPasswordUsuario((prev) => !prev)}>{mostrarPasswordUsuario ? 'OCULTAR' : 'VER'}</button>
            </div>
<select
  value={nuevoUsuario.rol || 'veterinaria'}
  onChange={(e) =>
    setNuevoUsuario({
      ...nuevoUsuario,
      rol: e.target.value,
      veterinariaId:
        e.target.value === 'veterinaria'
          ? nuevoUsuario.veterinariaId
          : '',
    })
  }
>
  <option value="veterinaria">Veterinaria</option>
  <option value="admin">Administrador</option>
  <option value="produccion">Producción</option>
</select>            {(nuevoUsuario.rol || 'veterinaria') === 'veterinaria' && <select value={nuevoUsuario.veterinariaId || ''} onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, veterinariaId: e.target.value })}><option value="">Seleccionar veterinaria existente</option>{veterinarias.map((v) => <option key={v.id} value={v.id}>{v.nombre}</option>)}</select>}
            <button type="submit">{nuevoUsuario.id ? 'Actualizar usuario' : 'Crear usuario'}</button>
            {nuevoUsuario.id && <button type="button" className="btn-outline" onClick={resetUsuario}>Cancelar edición</button>}
          </form>
          <div className="admin-list">
            {usuarios.map((u) => {
              const vetAsignada = veterinarias.find((v) => v.id === u.veterinariaId);
              return (
                <article key={u.id} className="admin-row no-image">
                  <div style={{ display: 'grid', gap: '4px' }}>
                    <b>{u.nombre || u.usuario || u.email}</b>
                    <span>Usuario: {u.usuario || 'Sin usuario'}</span>
                    <span>Correo: {u.email || 'Sin correo'}</span>
                    <span>Rol: {u.rol === 'admin' ? 'Administrador' : u.rol === 'produccion' ? 'Producción' : 'Veterinaria'}</span>
                    <span>Veterinaria: {u.rol === 'veterinaria' ? vetAsignada?.nombre || 'No asignada' : 'No aplica'}</span>
                    <span>Estado: {u.activo !== false ? 'Activo' : 'Inactivo'}</span>
                    <span>Contraseña: protegida</span>
                  </div>
                  <div className="actions">
                    <button type="button" className="btn-outline" onClick={() => editarUsuario(u)}>Editar</button>
                    <button type="button" className="btn-outline" onClick={() => resetearPasswordUsuario(u)}>Resetear contraseña</button>
                    <button type="button" className="btn-outline" onClick={() => actualizarUsuario({ ...u, activo: !(u.activo !== false) })}>{u.activo !== false ? 'Desactivar' : 'Activar'}</button>
                    <button type="button" className="btn-outline" onClick={() => { if (window.confirm(`¿Eliminar el usuario ${u.usuario || u.email}?`)) eliminarUsuario(u.id); }}>Eliminar</button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}
    </main>
  );
}
