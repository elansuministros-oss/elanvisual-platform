import React, { useState } from 'react';
import ImageUploader from './ImageUploader';

const imagenBase = {
  nombre: '',
  categoria: 'general',
  src: '',
};

function nombreVisible(img) {
  if (img?.nombre && String(img.nombre).trim()) return img.nombre;
  return `Imagen ${img?.id || ''}`.trim();
}

export default function MediaLibrary({
  imagenes = [],
  onAdd,
  onUpdate,
  onRemove,
  onSelect,
}) {
  const [nuevaImagen, setNuevaImagen] = useState(imagenBase);
  const [editandoId, setEditandoId] = useState(null);

  const limpiarFormulario = () => {
    setNuevaImagen(imagenBase);
    setEditandoId(null);
  };

  const guardarImagen = () => {
    if (!nuevaImagen.src) return alert('Seleccioná una imagen primero.');

    const item = {
      id: editandoId || Date.now(),
      nombre: nuevaImagen.nombre || 'Imagen sin nombre',
      categoria: nuevaImagen.categoria || 'general',
      src: nuevaImagen.src,
      fecha: new Date().toISOString(),
    };

    if (editandoId && onUpdate) {
      onUpdate(item);
    } else if (onAdd) {
      onAdd(item);
    }

    limpiarFormulario();
  };

  const editarImagen = (img) => {
    setEditandoId(img.id);
    setNuevaImagen({
      nombre: img.nombre || '',
      categoria: img.categoria || 'general',
      src: img.src || '',
    });
  };

  return (
    <section className="media-library">
      <h3>{editandoId ? 'Editar imagen' : 'Gestor Multimedia'}</h3>
      <p>
        Subí imágenes para usarlas en servicios, banners, portafolio,
        identidad visual y logo corporativo.
      </p>

      <div className="media-form">
        <input
          placeholder="Nombre visible de la imagen"
          value={nuevaImagen.nombre}
          onChange={(e) =>
            setNuevaImagen({ ...nuevaImagen, nombre: e.target.value })
          }
        />

        <select
          value={nuevaImagen.categoria}
          onChange={(e) =>
            setNuevaImagen({ ...nuevaImagen, categoria: e.target.value })
          }
        >
          <option value="general">General</option>
          <option value="servicio">Servicio</option>
          <option value="banner">Banner</option>
          <option value="portafolio">Portafolio</option>
          <option value="logo">Logo</option>
        </select>

        <ImageUploader
          label={editandoId ? 'Reemplazar imagen' : 'Subir imagen'}
          value={nuevaImagen.src}
          onChange={(img) =>
            setNuevaImagen({ ...nuevaImagen, src: img })
          }
        />

        <div className="form-actions">
          <button type="button" onClick={guardarImagen}>
            {editandoId ? 'Guardar cambios' : 'Guardar imagen'}
          </button>

          {editandoId && (
            <button type="button" className="ghost-btn" onClick={limpiarFormulario}>
              Cancelar
            </button>
          )}
        </div>
      </div>

      <div className="media-grid">
        {imagenes.map((img) => (
          <article className="media-card" key={img.id}>
            <img src={img.src} alt={nombreVisible(img)} />

            <div className="media-info">
              <strong title={nombreVisible(img)}>
                {nombreVisible(img)}
              </strong>
              <small>{img.categoria || 'general'}</small>
              <span className="media-id">ID: {String(img.id)}</span>
            </div>

            <div className="media-actions">
              {onSelect && (
                <button type="button" onClick={() => onSelect(img)}>
                  Usar
                </button>
              )}

              <button type="button" onClick={() => editarImagen(img)}>
                Editar
              </button>

              {onRemove && (
                <button type="button" onClick={() => onRemove(img.id)}>
                  Eliminar
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}