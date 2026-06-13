import React, { useState } from 'react';
import {
  Building2,
  ClipboardList,
  Factory,
  FileText,
  ImagePlus,
  Settings,
  ShieldCheck,
  PlusCircle,
  Save,
  Trash2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import MediaLibrary from '../components/MediaLibrary';

const nuevoServicioBase = {
  nombre: '',
  categoria: 'Rotulación',
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
  activo: true,
};

export default function AdminPanel() {
  const {
    productos,
    trabajos,
    banners,
    pedidos,
    usuarios,
    configuracion,
    imagenes,
    crearImagen,
    eliminarImagen,
    crearProducto,
    actualizarProducto,
    crearTrabajo,
    actualizarTrabajo,
    crearBanner,
    actualizarBanner,
    eliminarBanner,
  } = useApp();

  const [tab, setTab] = useState('dashboard');
  const [servicio, setServicio] = useState(nuevoServicioBase);
  const [trabajo, setTrabajo] = useState(nuevoTrabajoBase);
  const [banner, setBanner] = useState(nuevoBannerBase);

  const kpis = [
    { label: 'Servicios', value: productos.length },
    { label: 'Portafolio', value: trabajos.length },
    { label: 'Banners', value: banners.length },
    { label: 'Solicitudes', value: pedidos.length },
    { label: 'Usuarios', value: usuarios.filter((u) => u.activo !== false).length },
  ];

  const usarImagen = (img) => {
    if (tab === 'servicios') setServicio((prev) => ({ ...prev, imagen: img.src }));
    if (tab === 'portafolio') setTrabajo((prev) => ({ ...prev, imagen: img.src }));
    if (tab === 'banners') setBanner((prev) => ({ ...prev, imagen: img.src, imagenRuta: img.src }));
  };

  const guardarServicio = () => {
    if (!servicio.nombre.trim()) return alert('Escribí el nombre del servicio.');
    crearProducto({
      ...servicio,
      id: servicio.id || undefined,
      precio: Number(servicio.precio || 0),
      activo: servicio.activo !== false,
    });
    setServicio(nuevoServicioBase);
  };

  const guardarTrabajo = () => {
    if (!trabajo.titulo.trim()) return alert('Escribí el título del trabajo.');
    crearTrabajo({
      ...trabajo,
      activo: trabajo.activo !== false,
    });
    setTrabajo(nuevoTrabajoBase);
  };

  const guardarBanner = () => {
    if (!banner.titulo.trim()) return alert('Escribí el título del banner.');
    crearBanner({
      ...banner,
      imagenRuta: banner.imagenRuta || banner.imagen,
      activo: banner.activo !== false,
    });
    setBanner(nuevoBannerBase);
  };

  return (
    <main>
      <div className="admin-head">
        <div>
          <span className="badge">ELANVISUAL · Administración</span>
          <h1>Panel Operativo ELANVISUAL</h1>
          <p className="note">
            Administración visual del portal: servicios, portafolio, banners y multimedia.
          </p>
        </div>
      </div>

      <nav className="admin-tabs">
        <button className={tab === 'dashboard' ? 'active' : ''} onClick={() => setTab('dashboard')}>Resumen</button>
        <button className={tab === 'servicios' ? 'active' : ''} onClick={() => setTab('servicios')}>Servicios</button>
        <button className={tab === 'portafolio' ? 'active' : ''} onClick={() => setTab('portafolio')}>Portafolio</button>
        <button className={tab === 'banners' ? 'active' : ''} onClick={() => setTab('banners')}>Banners</button>
        <button className={tab === 'multimedia' ? 'active' : ''} onClick={() => setTab('multimedia')}>Multimedia</button>
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
              <label>Nombre visible<input value={configuracion?.nombreSitio || 'ELANVISUAL'} readOnly /></label>
              <label>WhatsApp<input value={configuracion?.whatsapp || ''} readOnly /></label>
              <label>Correo<input value={configuracion?.correo || ''} readOnly /></label>
              <label>Anticipo configurado<input value={`${configuracion?.anticipoPorcentaje || 60}%`} readOnly /></label>
            </div>
          </section>

          <section className="panel">
            <h2><ClipboardList size={20} /> Flujo operativo vigente</h2>
            <p className="note">
              Cliente ? Solicitud ? Cotización ? Pedido ? Orden de Trabajo ?
              Producción ? Instalación ? Entrega ? Cobro ? Comisión.
            </p>
          </section>

          <section className="panel">
            <h2><Factory size={20} /> Administración real</h2>
            <div className="admin-list">
              <article className="admin-row no-image">
                <div><b>Servicios</b><span>Catálogo público y solicitudes comerciales.</span></div>
                <strong>{productos.length}</strong>
              </article>
              <article className="admin-row no-image">
                <div><b>Portafolio</b><span>Trabajos entregados y referencias visuales.</span></div>
                <strong>{trabajos.length}</strong>
              </article>
              <article className="admin-row no-image">
                <div><b>Banners</b><span>Portada, catálogo y promociones.</span></div>
                <strong>{banners.length}</strong>
              </article>
            </div>
          </section>
        </>
      )}

      {tab === 'servicios' && (
        <section className="panel">
          <h2><FileText size={20} /> Servicios fabricables</h2>

          <div className="form-grid">
            <input placeholder="Nombre del servicio" value={servicio.nombre} onChange={(e) => setServicio({ ...servicio, nombre: e.target.value })} />
            <input placeholder="Categoría" value={servicio.categoria} onChange={(e) => setServicio({ ...servicio, categoria: e.target.value })} />
            <input placeholder="Medidas / referencia" value={servicio.medidas} onChange={(e) => setServicio({ ...servicio, medidas: e.target.value })} />
            <input placeholder="Etiqueta" value={servicio.etiqueta} onChange={(e) => setServicio({ ...servicio, etiqueta: e.target.value })} />
            <input className="span-2" placeholder="URL o imagen seleccionada" value={servicio.imagen} onChange={(e) => setServicio({ ...servicio, imagen: e.target.value })} />
            <textarea className="span-2" placeholder="Descripción técnica" value={servicio.descripcion} onChange={(e) => setServicio({ ...servicio, descripcion: e.target.value })} />
          </div>

          <button type="button" onClick={guardarServicio}><PlusCircle size={18} /> Crear servicio</button>

          <div className="admin-list">
            {productos.map((p) => (
              <article className="admin-row" key={p.id}>
                {p.imagen ? <img src={p.imagen} alt={p.nombre} /> : <div className="admin-thumb-empty">IMG</div>}
                <div><b>{p.nombre}</b><span>{p.categoria} · {p.medidas || 'Medidas por definir'}</span></div>
                <strong>{p.activo === false ? 'Oculto' : 'Activo'}</strong>
              </article>
            ))}
          </div>
        </section>
      )}

      {tab === 'portafolio' && (
        <section className="panel">
          <h2><ImagePlus size={20} /> Portafolio</h2>

          <div className="form-grid">
            <input placeholder="Título del trabajo" value={trabajo.titulo} onChange={(e) => setTrabajo({ ...trabajo, titulo: e.target.value })} />
            <input placeholder="Tipo" value={trabajo.tipo} onChange={(e) => setTrabajo({ ...trabajo, tipo: e.target.value })} />
            <input className="span-2" placeholder="URL o imagen seleccionada" value={trabajo.imagen} onChange={(e) => setTrabajo({ ...trabajo, imagen: e.target.value })} />
            <textarea className="span-2" placeholder="Descripción del trabajo" value={trabajo.descripcion} onChange={(e) => setTrabajo({ ...trabajo, descripcion: e.target.value })} />
          </div>

          <button type="button" onClick={guardarTrabajo}><PlusCircle size={18} /> Crear trabajo</button>

          <div className="admin-list">
            {trabajos.map((t) => (
              <article className="admin-row" key={t.id}>
                {t.imagen ? <img src={t.imagen} alt={t.titulo} /> : <div className="admin-thumb-empty">IMG</div>}
                <div><b>{t.titulo}</b><span>{t.tipo} · {t.descripcion}</span></div>
                <strong>{t.activo === false ? 'Oculto' : 'Activo'}</strong>
              </article>
            ))}
          </div>
        </section>
      )}

      {tab === 'banners' && (
        <section className="panel">
          <h2><ShieldCheck size={20} /> Banners</h2>

          <div className="form-grid">
            <input placeholder="Título" value={banner.titulo} onChange={(e) => setBanner({ ...banner, titulo: e.target.value })} />
            <select value={banner.ubicacion} onChange={(e) => setBanner({ ...banner, ubicacion: e.target.value })}>
              <option value="hero-principal">Hero principal</option>
              <option value="catalogo">Catálogo</option>
              <option value="home">Home</option>
              <option value="slider-home">Slider Home</option>
            </select>
            <input className="span-2" placeholder="Subtítulo" value={banner.subtitulo} onChange={(e) => setBanner({ ...banner, subtitulo: e.target.value })} />
            <input className="span-2" placeholder="URL o imagen seleccionada" value={banner.imagen} onChange={(e) => setBanner({ ...banner, imagen: e.target.value, imagenRuta: e.target.value })} />
          </div>

          <button type="button" onClick={guardarBanner}><Save size={18} /> Crear banner</button>

          <div className="admin-list">
            {banners.map((b) => (
              <article className="admin-row" key={b.id}>
                {b.imagen ? <img src={b.imagen} alt={b.titulo} /> : <div className="admin-thumb-empty">IMG</div>}
                <div><b>{b.titulo}</b><span>{b.ubicacion} · {b.subtitulo}</span></div>
                <button type="button" onClick={() => eliminarBanner(b.id)}><Trash2 size={15} /> Eliminar</button>
              </article>
            ))}
          </div>
        </section>
      )}

      {tab === 'multimedia' && (
        <MediaLibrary
          imagenes={imagenes}
          onAdd={crearImagen}
          onRemove={eliminarImagen}
          onSelect={usarImagen}
        />
      )}
    </main>
  );
}
