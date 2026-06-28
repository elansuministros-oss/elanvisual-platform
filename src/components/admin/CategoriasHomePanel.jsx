import React, { useState } from 'react';
import { Copy, Eye, EyeOff, ImagePlus, Pencil, PlusCircle, Save, Trash2, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const baseCategoria = {
  nombre: '',
  slug: '',
  descripcion: '',
  imagenDesktop: '',
  imagenMobile: '',
  orden: 1,
  activo: true,
};

const slugify = (value = '') =>
  String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

export default function CategoriasHomePanel() {
  const {
    categoriasHome = [],
    imagenes = [],
    crearCategoriaHome,
    actualizarCategoriaHome,
    eliminarCategoriaHome,
  } = useApp();

  const [form, setForm] = useState(baseCategoria);
  const [editandoId, setEditandoId] = useState(null);

  const limpiar = () => {
    setForm(baseCategoria);
    setEditandoId(null);
  };

  const guardar = () => {
    const nombre = String(form.nombre || '').trim();
    const imagenDesktop = String(form.imagenDesktop || '').trim();

    if (!nombre) return alert('Escribi el nombre de la categoria.');
    if (!imagenDesktop) return alert('Selecciona o pega una imagen Desktop.');

    const datos = {
      nombre,
      slug: slugify(form.slug || nombre),
      descripcion: form.descripcion || '',
      imagenDesktop,
      imagenMobile: form.imagenMobile || '',
      orden: Number(form.orden || 1),
      activo: form.activo !== false,
    };

    if (editandoId) {
      actualizarCategoriaHome({ ...datos, id: editandoId });
    } else {
      crearCategoriaHome(datos);
    }

    limpiar();
  };

  const editar = (item) => {
    setForm({
      nombre: item.nombre || '',
      slug: item.slug || '',
      descripcion: item.descripcion || '',
      imagenDesktop: item.imagenDesktop || item.imagenRuta || item.imagen || item.img || '',
      imagenMobile: item.imagenMobile || '',
      orden: Number(item.orden || 1),
      activo: item.activo !== false,
    });
    setEditandoId(item.id);
  };

  const duplicar = (item) => {
    const nombre = `${item.nombre || 'Categoria'} copia`;

    crearCategoriaHome({
      nombre,
      slug: slugify(nombre),
      descripcion: item.descripcion || '',
      imagenDesktop: item.imagenDesktop || item.imagenRuta || item.imagen || item.img || '',
      imagenMobile: item.imagenMobile || '',
      orden: Number(item.orden || 1) + 1,
      activo: false,
    });
  };

  const imagenesDisponibles = imagenes.filter(
    (img) => img.categoria === 'banner' || img.categoria === 'general'
  );

  const SelectorImagen = ({ valor, onPick, titulo }) => (
    <div className="image-picker">
      <h4>{titulo}</h4>
      {imagenesDisponibles.length === 0 ? (
        <p className="note">No hay imagenes disponibles. Subilas primero en Multimedia.</p>
      ) : (
        <div className="image-picker-grid">
          {imagenesDisponibles.map((img) => (
            <button
              key={img.id}
              type="button"
              className={`image-picker-card ${valor === img.src ? 'active' : ''}`}
              onClick={() => onPick(img.src)}
            >
              <img src={img.src} alt={img.nombre || 'Imagen'} />
              <strong>{img.nombre || 'Imagen'}</strong>
              <small>{img.categoria || 'general'}</small>
            </button>
          ))}
        </div>
      )}
    </div>
  );

  const lista = [...categoriasHome].sort(
    (a, b) => Number(a.orden || 999) - Number(b.orden || 999)
  );

  return (
    <section className="panel">
      <h2><ImagePlus size={20} /> {editandoId ? 'Editar categoria Home' : 'Categorias Home'}</h2>
      <p className="note">
        Estas tarjetas controlan las imagenes grandes debajo del Hero. Ya no dependen de productos.
      </p>

      <div className="form-grid">
        <input placeholder="Nombre visible" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
        <input placeholder="Slug tienda: rotulacion" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />

        <select value={form.activo ? 'activo' : 'oculto'} onChange={(e) => setForm({ ...form, activo: e.target.value === 'activo' })}>
          <option value="activo">Activo</option>
          <option value="oculto">Oculto</option>
        </select>

        <input type="number" min="1" placeholder="Orden" value={form.orden} onChange={(e) => setForm({ ...form, orden: e.target.value })} />
        <input className="span-2" placeholder="Imagen Desktop categoria" value={form.imagenDesktop} onChange={(e) => setForm({ ...form, imagenDesktop: e.target.value })} />
        <input className="span-2" placeholder="Imagen Mobile opcional" value={form.imagenMobile} onChange={(e) => setForm({ ...form, imagenMobile: e.target.value })} />
        <textarea className="span-2" placeholder="Descripcion interna opcional" value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
      </div>

      <SelectorImagen titulo="Imagen Desktop desde Multimedia" valor={form.imagenDesktop} onPick={(src) => setForm({ ...form, imagenDesktop: src })} />
      <SelectorImagen titulo="Imagen Mobile desde Multimedia" valor={form.imagenMobile} onPick={(src) => setForm({ ...form, imagenMobile: src })} />

      <div className="form-actions">
        <button type="button" onClick={guardar}>
          {editandoId ? <Save size={18} /> : <PlusCircle size={18} />}
          {editandoId ? 'Guardar cambios' : 'Crear categoria'}
        </button>

        {editandoId && (
          <button type="button" className="ghost-btn" onClick={limpiar}>
            <X size={18} /> Cancelar
          </button>
        )}
      </div>

      <div className="admin-list">
        {lista.map((item) => {
          const thumb = item.imagenDesktop || item.imagenRuta || item.imagen || item.img || item.imagenMobile || '';

          return (
            <article className="admin-row" key={item.id}>
              {thumb ? <img src={thumb} alt={item.nombre || 'Categoria Home'} /> : <div className="admin-thumb-empty">IMG</div>}
              <div>
                <b>{item.nombre || 'Categoria Home'}</b>
                <span>/{item.slug || 'categoria'} · Orden {item.orden || 1} · Mobile: {item.imagenMobile ? 'Configurada' : 'Usa desktop'}</span>
              </div>
              <strong>{item.activo === false ? 'Oculta' : 'Activa'}</strong>
              <button type="button" onClick={() => editar(item)}><Pencil size={15} /> Editar</button>
              <button type="button" onClick={() => duplicar(item)}><Copy size={15} /> Duplicar</button>
              <button type="button" onClick={() => actualizarCategoriaHome({ ...item, activo: item.activo === false })}>
                {item.activo === false ? <Eye size={15} /> : <EyeOff size={15} />}
                {item.activo === false ? 'Activar' : 'Ocultar'}
              </button>
              <button type="button" onClick={() => eliminarCategoriaHome(item.id)}><Trash2 size={15} /> Eliminar</button>
            </article>
          );
        })}
      </div>
    </section>
  );
}
