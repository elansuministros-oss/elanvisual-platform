import React, { useState } from 'react';
import ImageUploader from './ImageUploader';

export default function MediaLibrary({
  imagenes = [],
  onAdd,
  onRemove,
  onSelect,
}) {
  const [nuevaImagen, setNuevaImagen] = useState({
    nombre: '',
    categoria: 'general',
    src: '',
  });

  const agregarImagen = () => {
    if (!nuevaImagen.src) return alert('Seleccioná una imagen primero.');

    const item = {
      id: Date.now(),
      nombre: nuevaImagen.nombre || 'Imagen sin nombre',
      categoria: nuevaImagen.categoria || 'general',
      src: nuevaImagen.src,
      fecha: new Date().toISOString(),
    };

    if (onAdd) onAdd(item);

    setNuevaImagen({
      nombre: '',
      categoria: 'general',
      src: '',
    });
  };

  return (
    <section className="media-library">
      <h3>Gestor Multimedia</h3>
      <p>
        Subí imágenes para usarlas en servicios, banners, portafolio,
        identidad visual y logo corporativo.
      </p>

      <div className="media-form">
        <input
          placeholder="Nombre de la imagen"
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
          label="Subir imagen"
          value={nuevaImagen.src}
          onChange={(img) =>
            setNuevaImagen({ ...nuevaImagen, src: img })
          }
        />

        <button type="button" onClick={agregarImagen}>
          Guardar imagen
        </button>
      </div>

      <div className="media-grid">
        {imagenes.map((img) => (
          <article className="media-card" key={img.id}>
            <img src={img.src} alt={img.nombre} />

            <div>
              <strong>{img.nombre}</strong>
              <small>{img.categoria}</small>
            </div>

            <div className="media-actions">
              {onSelect && (
                <button type="button" onClick={() => onSelect(img)}>
                  Usar
                </button>
              )}

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
