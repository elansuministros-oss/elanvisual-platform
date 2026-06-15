import React, { useMemo, useState } from 'react';
import {
  Building2,
  ClipboardList,
  Factory,
  FileText,
  ImagePlus,
  ShieldCheck,
  PlusCircle,
  Save,
  Trash2,
  Pencil,
  X,
  Copy,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import MediaLibrary from '../components/MediaLibrary';

const nuevoServicioBase = {
  nombre: '',
  categoria: 'Rotulacin',
  descripcion: '',
  medidas: '',
  imagen: '',
  etiqueta: 'A cotizar',
  precio: 0,
  activo: true,
};

const nuevoTrabajoBase = {
  titulo: '',
  tipo: 'Foto',
  descripcion: '',
  imagen: '',
  activo: true,
};

const nuevoBannerBase = {
  titulo: '',
  subtitulo: '',
  ubicacion: 'hero-principal',
  link: 'catalogo',
  imagen: '',
  imagenRuta: '',
  imagenDesktop: '',
  imagenMobile: '',
  activo: true,
};

export default function AdminPanel() {
  const {
    configuracion,
    actualizarConfiguracion,
    productos,
    trabajos,
    banners,
    pedidos = [],
    usuarios,
    crearProducto,
    actualizarProducto,
    eliminarProducto,
    crearTrabajo,
    actualizarTrabajo,
    eliminarTrabajo,
    crearBanner,
    actualizarBanner,
    eliminarBanner,
    crearUsuario,
    actualizarUsuario,
    eliminarUsuario,
  } = useApp();
const [tab, setTab] = useState('dashboard');
  const [servicio, setServicio] = useState(nuevoServicioBase);
  const [trabajo, setTrabajo] = useState(nuevoTrabajoBase);
  const [banner, setBanner] = useState(nuevoBannerBase);
  const [nuevoUsuario, setNuevoUsuario] = useState({
    nombre: '',
    usuario: '',
    email: '',
    password: '',
    rol: 'ventas',
    activo: true,
  });

  const [editandoServicioId, setEditandoServicioId] = useState(null);
  const [editandoTrabajoId, setEditandoTrabajoId] = useState(null);
  const [editandoBannerId, setEditandoBannerId] = useState(null);

  const kpis = [
    { label: 'Servicios', value: productos.length },
    { label: 'Portafolio', value: trabajos.length },
    { label: 'Banners', value: banners.length },
    { label: 'Solicitudes', value: pedidos.length },
    { label: 'Usuarios', value: usuarios.filter((u) => u.activo !== false).length },
  ];

  const imagenesPorCategoria = useMemo(() => imagenes || [], [imagenes]);

  const SelectorImagen = ({ valor, onPick, categoriaPreferida = '' }) => {
    const lista = categoriaPreferida
      ? imagenesPorCategoria.filter(
          (img) => img.categoria === categoriaPreferida || img.categoria === 'general'
        )
      : imagenesPorCategoria;

    return (
      <div className="image-picker">
        <h4>Seleccionar imagen desde Multimedia</h4>

        {lista.length === 0 ? (
          <p className="note">
            Todava no hay imgenes cargadas. Sub imgenes desde la pestaa Multimedia.
          </p>
        ) : (
          <div className="image-picker-grid">
            {lista.map((img) => (
              <button
                key={img.id}
                type="button"
                className={`image-picker-card ${valor === img.src ? 'active' : ''}`}
                onClick={() => onPick(img.src)}
                title={img.nombre}
              >
                <img src={img.src} alt={img.nombre} />
                <strong>{img.nombre || 'Imagen sin nombre'}</strong>
                <small>{img.categoria || 'general'}</small>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  const limpiarServicio = () => {
    setServicio(nuevoServicioBase);
    setEditandoServicioId(null);
  };

  const limpiarTrabajo = () => {
    setTrabajo(nuevoTrabajoBase);
    setEditandoTrabajoId(null);
  };

  const limpiarBanner = () => {
    setBanner(nuevoBannerBase);
    setEditandoBannerId(null);
  };

  const guardarServicio = () => {
    if (!servicio.nombre.trim()) return alert('Escrib el nombre del servicio.');

    const datos = {
      ...servicio,
      precio: Number(servicio.precio || 0),
      activo: servicio.activo !== false,
    };

    if (editandoServicioId) {
      actualizarProducto({ ...datos, id: editandoServicioId });
    } else {
      crearProducto(datos);
    }

    limpiarServicio();
  };

  const guardarTrabajo = () => {
    if (!trabajo.titulo.trim()) return alert('Escrib el ttulo del trabajo.');

    const datos = {
      ...trabajo,
      activo: trabajo.activo !== false,
    };

    if (editandoTrabajoId) {
      actualizarTrabajo({ ...datos, id: editandoTrabajoId });
    } else {
      crearTrabajo(datos);
    }

    limpiarTrabajo();
  };

  const guardarBanner = () => {
    if (!banner.titulo.trim()) return alert('Escrib el ttulo del banner.');

    const datos = {
      ...banner,
      imagenRuta: banner.imagenRuta || banner.imagen,
      imagenDesktop: banner.imagenDesktop || banner.imagenRuta || banner.imagen,
      imagenMobile: banner.imagenMobile || '',
      activo: banner.activo !== false,
    };

    if (editandoBannerId) {
      actualizarBanner({ ...datos, id: editandoBannerId });
    } else {
      crearBanner(datos);
    }

    limpiarBanner();
  };

  const editarServicio = (p) => {
    setServicio({
      nombre: p.nombre || '',
      categoria: p.categoria || 'Rotulacin',
      descripcion: p.descripcion || '',
      medidas: p.medidas || '',
      imagen: p.imagen || '',
      etiqueta: p.etiqueta || 'A cotizar',
      precio: Number(p.precio || 0),
      activo: p.activo !== false,
    });
    setEditandoServicioId(p.id);
    setTab('servicios');
  };

  const editarTrabajo = (t) => {
    setTrabajo({
      titulo: t.titulo || '',
      tipo: t.tipo || 'Foto',
      descripcion: t.descripcion || '',
      imagen: t.imagen || '',
      activo: t.activo !== false,
    });
    setEditandoTrabajoId(t.id);
    setTab('portafolio');
  };

  const editarBanner = (b) => {
    setBanner({
      titulo: b.titulo || '',
      subtitulo: b.subtitulo || '',
      ubicacion: b.ubicacion || 'hero-principal',
      link: b.link || 'catalogo',
      imagen: b.imagen || b.imagenRuta || '',
      imagenRuta: b.imagenRuta || b.imagen || '',
      imagenDesktop: b.imagenDesktop || b.imagenRuta || b.imagen || '',
      imagenMobile: b.imagenMobile || '',
      activo: b.activo !== false,
    });
    setEditandoBannerId(b.id);
    setTab('banners');
  };

  const duplicarBanner = (b) => {
    crearBanner({
      ...b,
      titulo: `${b.titulo || 'Banner'} copia`,
      activo: false,
      imagen: b.imagen || b.imagenRuta || '',
      imagenRuta: b.imagenRuta || b.imagen || '',
    });
  };

  return (
    <main>
      <div className="admin-head">
        <div>
          <span className="badge">ELANVISUAL  Administracin</span>
          <h1>Panel Operativo ELANVISUAL</h1>
          <p className="note">
            Administracin visual del portal: servicios, portafolio, banners y multimedia.
          </p>
        </div>
      </div>

      <nav className="admin-tabs">
        {[
          ['dashboard', 'Resumen'],
          ['servicios', 'Servicios'],
          ['portafolio', 'Portafolio'],
          ['banners', 'Banners'],
          ['multimedia', 'Multimedia'],
          ['usuarios', 'Usuarios'],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={tab === key ? 'active' : ''}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </nav>

      {tab === 'dashboard' && (
        <>
          <section className="cards">
            {kpis.map((item) => (
              <div className="kpi" key={item.label}>
                <b>{item.value}</b>
                <span>{item.label}</span>
              </div>
            ))}
          </section>

          <section className="panel">
            <h2><Building2 size={20} /> Estado de unidad</h2>
            <div className="form-grid">
              <label>Nombre visible<input value={configuracion?.nombreSitio || 'ELANVISUAL'} onChange={(e) => actualizarConfiguracion({ nombreSitio: e.target.value })} /></label>
              <label>WhatsApp<input value={configuracion?.whatsapp || ''} onChange={(e) => actualizarConfiguracion({ whatsapp: e.target.value })} /></label>
              <label>Correo<input value={configuracion?.correo || ''} onChange={(e) => actualizarConfiguracion({ correo: e.target.value })} /></label>
              <label>Anticipo configurado<input type="number" value={configuracion?.anticipoPorcentaje || 60} onChange={(e) => actualizarConfiguracion({ anticipoPorcentaje: Number(e.target.value || 60) })} /></label>
            </div>
          </section>

          <section className="panel">
            <h2><ClipboardList size={20} /> Flujo operativo vigente</h2>
            <p className="note">
              Cliente ? Solicitud ? Cotizacin ? Pedido ? Orden de Trabajo ?
              Produccin ? Instalacin ? Entrega ? Cobro ? Comisin.
            </p>
          </section>

          <section className="panel">
            <h2><Factory size={20} /> Administracin real</h2>
            <div className="admin-list">
              <article className="admin-row no-image">
                <div><b>Servicios</b><span>Catlogo pblico y solicitudes comerciales.</span></div>
                <strong>{productos.length}</strong>
              </article>
              <article className="admin-row no-image">
                <div><b>Portafolio</b><span>Trabajos entregados y referencias visuales.</span></div>
                <strong>{trabajos.length}</strong>
              </article>
              <article className="admin-row no-image">
                <div><b>Banners</b><span>Portada, catlogo y promociones.</span></div>
                <strong>{banners.length}</strong>
              </article>
            </div>
          </section>
        </>
      )}

      {tab === 'servicios' && (
        <section className="panel">
          <h2><FileText size={20} /> {editandoServicioId ? 'Editar servicio' : 'Servicios fabricables'}</h2>

          <div className="form-grid">
            <input placeholder="Nombre del servicio" value={servicio.nombre} onChange={(e) => setServicio({ ...servicio, nombre: e.target.value })} />
            <input placeholder="Categora" value={servicio.categoria} onChange={(e) => setServicio({ ...servicio, categoria: e.target.value })} />
            <input placeholder="Medidas / referencia" value={servicio.medidas} onChange={(e) => setServicio({ ...servicio, medidas: e.target.value })} />
            <input placeholder="Etiqueta" value={servicio.etiqueta} onChange={(e) => setServicio({ ...servicio, etiqueta: e.target.value })} />
            <input type="number" placeholder="Precio" value={servicio.precio} onChange={(e) => setServicio({ ...servicio, precio: e.target.value })} />
            <select value={servicio.activo ? 'activo' : 'oculto'} onChange={(e) => setServicio({ ...servicio, activo: e.target.value === 'activo' })}>
              <option value="activo">Activo</option>
              <option value="oculto">Oculto</option>
            </select>
            <input className="span-2" placeholder="URL o imagen seleccionada" value={servicio.imagen} onChange={(e) => setServicio({ ...servicio, imagen: e.target.value })} />
            <textarea className="span-2" placeholder="Descripcin tcnica" value={servicio.descripcion} onChange={(e) => setServicio({ ...servicio, descripcion: e.target.value })} />
          </div>

          <SelectorImagen valor={servicio.imagen} categoriaPreferida="servicio" onPick={(src) => setServicio({ ...servicio, imagen: src })} />

          <div className="form-actions">
            <button type="button" onClick={guardarServicio}>
              {editandoServicioId ? <Save size={18} /> : <PlusCircle size={18} />}
              {editandoServicioId ? 'Guardar cambios' : 'Crear servicio'}
            </button>
            {editandoServicioId && (
              <button type="button" className="ghost-btn" onClick={limpiarServicio}>
                <X size={18} /> Cancelar
              </button>
            )}
          </div>

          <div className="admin-list">
            {productos.map((p) => (
              <article className="admin-row" key={p.id}>
                {p.imagen ? <img src={p.imagen} alt={p.nombre} /> : <div className="admin-thumb-empty">IMG</div>}
                <div><b>{p.nombre}</b><span>{p.categoria}  {p.medidas || 'Medidas por definir'}</span></div>
                <strong>{p.activo === false ? 'Oculto' : 'Activo'}</strong>
                <button type="button" onClick={() => editarServicio(p)}><Pencil size={15} /> Editar</button>
                <button type="button" onClick={() => actualizarProducto({ ...p, activo: p.activo === false })}>
                  {p.activo === false ? <Eye size={15} /> : <EyeOff size={15} />}
                  {p.activo === false ? 'Activar' : 'Ocultar'}
                </button>
              </article>
            ))}
          </div>
        </section>
      )}

      {tab === 'portafolio' && (
        <section className="panel">
          <h2><ImagePlus size={20} /> {editandoTrabajoId ? 'Editar trabajo' : 'Portafolio'}</h2>

          <div className="form-grid">
            <input placeholder="Ttulo del trabajo" value={trabajo.titulo} onChange={(e) => setTrabajo({ ...trabajo, titulo: e.target.value })} />
            <input placeholder="Tipo" value={trabajo.tipo} onChange={(e) => setTrabajo({ ...trabajo, tipo: e.target.value })} />
            <select value={trabajo.activo ? 'activo' : 'oculto'} onChange={(e) => setTrabajo({ ...trabajo, activo: e.target.value === 'activo' })}>
              <option value="activo">Activo</option>
              <option value="oculto">Oculto</option>
            </select>
            <input className="span-2" placeholder="URL o imagen seleccionada" value={trabajo.imagen} onChange={(e) => setTrabajo({ ...trabajo, imagen: e.target.value })} />
            <textarea className="span-2" placeholder="Descripcin del trabajo" value={trabajo.descripcion} onChange={(e) => setTrabajo({ ...trabajo, descripcion: e.target.value })} />
          </div>

          <SelectorImagen valor={trabajo.imagen} categoriaPreferida="portafolio" onPick={(src) => setTrabajo({ ...trabajo, imagen: src })} />

          <div className="form-actions">
            <button type="button" onClick={guardarTrabajo}>
              {editandoTrabajoId ? <Save size={18} /> : <PlusCircle size={18} />}
              {editandoTrabajoId ? 'Guardar cambios' : 'Crear trabajo'}
            </button>
            {editandoTrabajoId && (
              <button type="button" className="ghost-btn" onClick={limpiarTrabajo}>
                <X size={18} /> Cancelar
              </button>
            )}
          </div>

          <div className="admin-list">
            {trabajos.map((t) => (
              <article className="admin-row" key={t.id}>
                {t.imagen ? <img src={t.imagen} alt={t.titulo} /> : <div className="admin-thumb-empty">IMG</div>}
                <div><b>{t.titulo}</b><span>{t.tipo}  {t.descripcion}</span></div>
                <strong>{t.activo === false ? 'Oculto' : 'Activo'}</strong>
                <button type="button" onClick={() => editarTrabajo(t)}><Pencil size={15} /> Editar</button>
                <button type="button" onClick={() => actualizarTrabajo({ ...t, activo: t.activo === false })}>
                  {t.activo === false ? <Eye size={15} /> : <EyeOff size={15} />}
                  {t.activo === false ? 'Activar' : 'Ocultar'}
                </button>
              </article>
            ))}
          </div>
        </section>
      )}

      {tab === 'banners' && (
        <section className="panel">
          <h2><ShieldCheck size={20} /> {editandoBannerId ? 'Editar banner' : 'Banners'}</h2>

          <div className="form-grid">
            <input placeholder="Ttulo" value={banner.titulo} onChange={(e) => setBanner({ ...banner, titulo: e.target.value })} />
            <select value={banner.ubicacion} onChange={(e) => setBanner({ ...banner, ubicacion: e.target.value })}>
              <option value="hero-principal">Hero principal</option>
              <option value="catalogo">Catlogo</option>
              <option value="home">Home</option>
              <option value="slider-home">Slider Home</option>
            </select>
            <select value={banner.activo ? 'activo' : 'oculto'} onChange={(e) => setBanner({ ...banner, activo: e.target.value === 'activo' })}>
              <option value="activo">Activo</option>
              <option value="oculto">Oculto</option>
            </select>
            <input className="span-2" placeholder="Subttulo" value={banner.subtitulo} onChange={(e) => setBanner({ ...banner, subtitulo: e.target.value })} />
            <input className="span-2" placeholder="URL o imagen seleccionada" value={banner.imagen} onChange={(e) => setBanner({ ...banner, imagen: e.target.value, imagenRuta: e.target.value, imagenDesktop: e.target.value })} />
            <input className="span-2" placeholder="Imagen Hero Desktop 1920x1080" value={banner.imagenDesktop || ''} onChange={(e) => setBanner({ ...banner, imagenDesktop: e.target.value })} />
            <input className="span-2" placeholder="Imagen Hero Mobile 1080x1920" value={banner.imagenMobile || ''} onChange={(e) => setBanner({ ...banner, imagenMobile: e.target.value })} />
          </div>

          <SelectorImagen valor={banner.imagen} categoriaPreferida="banner" onPick={(src) => setBanner({ ...banner, imagen: src, imagenRuta: src, imagenDesktop: src })} />

          <SelectorImagen valor={banner.imagenMobile} categoriaPreferida="banner" onPick={(src) => setBanner({ ...banner, imagenMobile: src })} />

          <div className="form-actions">
            <button type="button" onClick={guardarBanner}>
              <Save size={18} /> {editandoBannerId ? 'Guardar cambios' : 'Crear banner'}
            </button>
            {editandoBannerId && (
              <button type="button" className="ghost-btn" onClick={limpiarBanner}>
                <X size={18} /> Cancelar
              </button>
            )}
          </div>

          <div className="admin-list">
            {banners.map((b) => (
              <article className="admin-row" key={b.id}>
                {b.imagen ? <img src={b.imagen} alt={b.titulo} /> : <div className="admin-thumb-empty">IMG</div>}
                <div><b>{b.titulo}</b><span>{b.ubicacion}  {b.subtitulo}</span></div>
                <strong>{b.activo === false ? 'Oculto' : 'Activo'}</strong>
                <button type="button" onClick={() => editarBanner(b)}><Pencil size={15} /> Editar</button>
                <button type="button" onClick={() => duplicarBanner(b)}><Copy size={15} /> Duplicar</button>
                <button type="button" onClick={() => actualizarBanner({ ...b, activo: b.activo === false })}>
                  {b.activo === false ? <Eye size={15} /> : <EyeOff size={15} />}
                  {b.activo === false ? 'Activar' : 'Ocultar'}
                </button>
                <button type="button" onClick={() => eliminarBanner(b.id)}><Trash2 size={15} /> Eliminar</button>
              </article>
            ))}
          </div>
        </section>
      )}
      {tab === 'usuarios' && (
        <section className="panel">
          <h2><ShieldCheck size={20} /> Usuarios, vendedores y produccion</h2>

          <div className="form-grid">
            <input
              placeholder="Nombre completo"
              value={nuevoUsuario.nombre}
              onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, nombre: e.target.value })}
            />
            <input
              placeholder="Usuario de acceso"
              value={nuevoUsuario.usuario}
              onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, usuario: e.target.value })}
            />
            <input
              placeholder="Correo"
              value={nuevoUsuario.email}
              onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, email: e.target.value })}
            />
            <input
              placeholder="Contrasena temporal"
              value={nuevoUsuario.password}
              onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, password: e.target.value })}
            />
            <select
              value={nuevoUsuario.rol}
              onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, rol: e.target.value })}
            >
              {(rolesSistema || ['admin', 'ventas', 'produccion']).map((rol) => (
                <option key={rol} value={rol}>{rol}</option>
              ))}
            </select>
            <select
              value={nuevoUsuario.activo ? 'activo' : 'inactivo'}
              onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, activo: e.target.value === 'activo' })}
            >
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
            </select>
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={() => {
                if (!nuevoUsuario.usuario.trim()) return alert('Escribi el usuario.');
                if (!nuevoUsuario.password.trim()) return alert('Escribi una contrasena temporal.');
                crearUsuario({
                  ...nuevoUsuario,
                  codigoVendedor:
                    nuevoUsuario.rol === 'ventas'
                      ? `VEN-${nuevoUsuario.usuario.toUpperCase().replace(/[^A-Z0-9]/g, '')}`
                      : '',
                });
                setNuevoUsuario({
                  nombre: '',
                  usuario: '',
                  email: '',
                  password: '',
                  rol: 'ventas',
                  activo: true,
                });
              }}
            >
              <PlusCircle size={18} />
              Crear usuario
            </button>
          </div>

          <div className="admin-list">
            {(usuarios || []).map((u) => {
              const codigo = u.codigoVendedor || (u.rol === 'ventas' ? `VEN-${String(u.usuario || u.id).toUpperCase().replace(/[^A-Z0-9]/g, '')}` : '');
              const linkQR = codigo ? `${window.location.origin}/?ref=${encodeURIComponent(codigo)}` : '';

              return (
                <article className="admin-row no-image" key={u.id}>
                  <div>
                    <b>{u.nombre || u.usuario}</b>
                    <span>{u.usuario}  {u.rol}  {u.activo === false ? 'Inactivo' : 'Activo'}</span>
                    {codigo && <small>QR vendedor: {codigo}</small>}
                  </div>

                  <select
                    value={u.rol}
                    onChange={(e) => actualizarUsuario({ ...u, rol: e.target.value })}
                  >
                    {(rolesSistema || ['admin', 'ventas', 'produccion']).map((rol) => (
                      <option key={rol} value={rol}>{rol}</option>
                    ))}
                  </select>

                  {linkQR && (
                    <button type="button" onClick={() => navigator.clipboard.writeText(linkQR)}>
                      <Copy size={15} /> Copiar QR
                    </button>
                  )}

                  <button type="button" onClick={() => actualizarUsuario({ ...u, activo: u.activo === false })}>
                    {u.activo === false ? <Eye size={15} /> : <EyeOff size={15} />}
                    {u.activo === false ? 'Activar' : 'Desactivar'}
                  </button>

                  <button type="button" onClick={() => eliminarUsuario(u.id)}>
                    <Trash2 size={15} /> Eliminar
                  </button>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {tab === 'multimedia' && (
        <MediaLibrary
          imagenes={imagenes}
          onAdd={crearImagen}
          onUpdate={actualizarImagen}
          onRemove={eliminarImagen}
        />
      )}
    </main>
  );
}





