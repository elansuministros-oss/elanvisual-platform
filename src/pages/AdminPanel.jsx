import React, { useMemo, useState } from 'react';
import Usuarios20Panel from '../components/admin/Usuarios20Panel';
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
  categoria: 'Rotulacion',
  descripcion: '',
  medidas: '',
  imagen: '',
  etiqueta: '',
  precio: '',
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
  ubicacion: 'hero-principal',
  imagen: '',
  imagenRuta: '',
  imagenDesktop: '',
  imagenMobile: '',
  activo: true,
  orden: 1,
};

export default function AdminPanel() {
  const {
    configuracion,
    actualizarConfiguracion,
    productos = [],
    trabajos = [],
    banners = [],
    pedidos = [],
    usuarios = [],
    imagenes = [],
    crearProducto,
    actualizarProducto,
    eliminarProducto,
    crearTrabajo,
    actualizarTrabajo,
    eliminarTrabajo,
    crearBanner,
    actualizarBanner,
    eliminarBanner,
    crearImagen,
    actualizarImagen,
    eliminarImagen,
  } = useApp();

  const [tab, setTab] = useState('dashboard');
  const [servicio, setServicio] = useState(nuevoServicioBase);
  const [trabajo, setTrabajo] = useState(nuevoTrabajoBase);
  const [banner, setBanner] = useState(nuevoBannerBase);

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
            Todavia no hay imagenes cargadas. Subi imagenes desde la pestana Multimedia.
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
    if (!servicio.nombre.trim()) return alert('Escribi el nombre del servicio.');

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
    if (!trabajo.titulo.trim()) return alert('Escribi el titulo del trabajo.');

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
    const imagenDesktop =
      banner.imagenDesktop ||
      banner.imagenRuta ||
      banner.imagen ||
      '';

    if (!imagenDesktop.trim()) {
      return alert('Selecciona o pega una imagen Desktop para el banner.');
    }

    const datos = {
      ubicacion: banner.ubicacion || 'hero-principal',
      imagen: imagenDesktop,
      imagenRuta: imagenDesktop,
      imagenDesktop,
      imagenMobile: banner.imagenMobile || '',
      activo: banner.activo !== false,
      orden: Number(banner.orden || 1),
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
      categoria: p.categoria || 'Rotulacion',
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
    const imagenDesktop = b.imagenDesktop || b.imagenRuta || b.imagen || '';

    setBanner({
      ubicacion: b.ubicacion || 'hero-principal',
      imagen: imagenDesktop,
      imagenRuta: imagenDesktop,
      imagenDesktop,
      imagenMobile: b.imagenMobile || '',
      activo: b.activo !== false,
      orden: Number(b.orden || 1),
    });
    setEditandoBannerId(b.id);
    setTab('banners');
  };

  const duplicarBanner = (b) => {
    const imagenDesktop = b.imagenDesktop || b.imagenRuta || b.imagen || '';

    crearBanner({
      ubicacion: b.ubicacion || 'hero-principal',
      imagen: imagenDesktop,
      imagenRuta: imagenDesktop,
      imagenDesktop,
      imagenMobile: b.imagenMobile || '',
      activo: false,
      orden: Number(b.orden || 1) + 1,
    });
  };

  const miniaturaBanner = (b) => b.imagenDesktop || b.imagenRuta || b.imagen || b.imagenMobile || '';

  return (
    <main>
      <div className="admin-head">
        <div>
          <span className="badge">ELANVISUAL  Administracion</span>
          <h1>Panel Operativo ELANVISUAL </h1>
          <p className="note">
            Administracion visual del portal: servicios, portafolio, banners y multimedia.
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
              <label>Tipo de cambio C$ por USD<input type="number" step="0.01" value={configuracion?.tipoCambio || 36.8} onChange={(e) => actualizarConfiguracion({ tipoCambio: Number(e.target.value || 36.8) })} /></label>
            </div>
          </section>

          <section className="panel">
            <h2><ClipboardList size={20} /> Flujo operativo vigente</h2>
            <p className="note">
              Cliente ? Solicitud ? Cotizacion ? Pedido ? Orden de Trabajo ?
              Produccion ? Instalacion ? Entrega ? Cobro ? Comision.
            </p>
          </section>

          <section className="panel">
            <h2><Factory size={20} /> Administracion real</h2>
            <div className="admin-list">
              <article className="admin-row no-image">
                <div><b>Servicios</b><span>Catalogo publico y solicitudes comerciales.</span></div>
                <strong>{productos.length}</strong>
              </article>
              <article className="admin-row no-image">
                <div><b>Portafolio</b><span>Trabajos entregados y referencias visuales.</span></div>
                <strong>{trabajos.length}</strong>
              </article>
              <article className="admin-row no-image">
                <div><b>Banners</b><span>Imagenes principales sin texto HTML superpuesto.</span></div>
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
            <input placeholder="Categoria" value={servicio.categoria} onChange={(e) => setServicio({ ...servicio, categoria: e.target.value })} />
            <input placeholder="Medidas / referencia" value={servicio.medidas} onChange={(e) => setServicio({ ...servicio, medidas: e.target.value })} />
            <input placeholder="Etiqueta de precio opcional" value={servicio.etiqueta} onChange={(e) => setServicio({ ...servicio, etiqueta: e.target.value })} />
            <input type="number" placeholder="Precio base USD" value={servicio.precio} onChange={(e) => setServicio({ ...servicio, precio: e.target.value })} />
            <select value={servicio.activo ? 'activo' : 'oculto'} onChange={(e) => setServicio({ ...servicio, activo: e.target.value === 'activo' })}>
              <option value="activo">Activo</option>
              <option value="oculto">Oculto</option>
            </select>
            <input className="span-2" placeholder="URL o imagen seleccionada" value={servicio.imagen} onChange={(e) => setServicio({ ...servicio, imagen: e.target.value })} />
            <textarea className="span-2" placeholder="Descripcion tecnica" value={servicio.descripcion} onChange={(e) => setServicio({ ...servicio, descripcion: e.target.value })} />
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
                <button type="button" onClick={() => {
                  if (window.confirm('Eliminar este servicio permanentemente?')) {
                    eliminarProducto(p.id);
                  }
                }}>
                  <Trash2 size={15} /> Eliminar
                </button>
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
            <input placeholder="Titulo del trabajo" value={trabajo.titulo} onChange={(e) => setTrabajo({ ...trabajo, titulo: e.target.value })} />
            <input placeholder="Tipo" value={trabajo.tipo} onChange={(e) => setTrabajo({ ...trabajo, tipo: e.target.value })} />
            <select value={trabajo.activo ? 'activo' : 'oculto'} onChange={(e) => setTrabajo({ ...trabajo, activo: e.target.value === 'activo' })}>
              <option value="activo">Activo</option>
              <option value="oculto">Oculto</option>
            </select>
            <input className="span-2" placeholder="URL o imagen seleccionada" value={trabajo.imagen} onChange={(e) => setTrabajo({ ...trabajo, imagen: e.target.value })} />
            <textarea className="span-2" placeholder="Descripcion del trabajo" value={trabajo.descripcion} onChange={(e) => setTrabajo({ ...trabajo, descripcion: e.target.value })} />
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
          <p className="note">
            El Hero no usa titulo, subtitulo, descripcion ni botones HTML. Todo el mensaje comercial debe venir integrado en la imagen del banner.
          </p>

          <div className="form-grid">
            <select value={banner.ubicacion} onChange={(e) => setBanner({ ...banner, ubicacion: e.target.value })}>
              <option value="hero-principal">Hero principal</option>
              <option value="catalogo">Catalogo</option>
              <option value="home">Home</option>
              <option value="slider-home">Slider Home</option>
            </select>

            <select value={banner.activo ? 'activo' : 'oculto'} onChange={(e) => setBanner({ ...banner, activo: e.target.value === 'activo' })}>
              <option value="activo">Activo</option>
              <option value="oculto">Oculto</option>
            </select>

            <input type="number" min="1" placeholder="Orden" value={banner.orden || 1} onChange={(e) => setBanner({ ...banner, orden: e.target.value })} />

            <input
              className="span-2"
              placeholder="Imagen Desktop del banner"
              value={banner.imagenDesktop || ''}
              onChange={(e) => setBanner({
                ...banner,
                imagen: e.target.value,
                imagenRuta: e.target.value,
                imagenDesktop: e.target.value,
              })}
            />

            <input
              className="span-2"
              placeholder="Imagen Mobile del banner"
              value={banner.imagenMobile || ''}
              onChange={(e) => setBanner({ ...banner, imagenMobile: e.target.value })}
            />
          </div>

          <SelectorImagen
            valor={banner.imagenDesktop}
            categoriaPreferida="banner"
            onPick={(src) => setBanner({
              ...banner,
              imagen: src,
              imagenRuta: src,
              imagenDesktop: src,
            })}
          />

          <SelectorImagen
            valor={banner.imagenMobile}
            categoriaPreferida="banner"
            onPick={(src) => setBanner({ ...banner, imagenMobile: src })}
          />

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
            {banners.map((b) => {
              const thumb = miniaturaBanner(b);

              return (
                <article className="admin-row" key={b.id}>
                  {thumb ? <img src={thumb} alt="Banner ELANVISUAL" /> : <div className="admin-thumb-empty">IMG</div>}
                  <div>
                    <b>{b.ubicacion || 'hero-principal'}</b>
                    <span>
                      Desktop: {b.imagenDesktop || b.imagenRuta || b.imagen ? 'Configurada' : 'Pendiente'} · Mobile: {b.imagenMobile ? 'Configurada' : 'Usa desktop'} · Orden {b.orden || 1}
                    </span>
                  </div>
                  <strong>{b.activo === false ? 'Oculto' : 'Activo'}</strong>
                  <button type="button" onClick={() => editarBanner(b)}><Pencil size={15} /> Editar</button>
                  <button type="button" onClick={() => duplicarBanner(b)}><Copy size={15} /> Duplicar</button>
                  <button type="button" onClick={() => actualizarBanner({ ...b, activo: b.activo === false })}>
                    {b.activo === false ? <Eye size={15} /> : <EyeOff size={15} />}
                    {b.activo === false ? 'Activar' : 'Ocultar'}
                  </button>
                  <button type="button" onClick={() => eliminarBanner(b.id)}><Trash2 size={15} /> Eliminar</button>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {tab === 'usuarios' && <Usuarios20Panel />}

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
