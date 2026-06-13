import { useMemo, useState } from 'react';
import { useElan } from '../core/context/ElanContext.jsx';

const categorias = [
  'Banner',
  'Banner Desktop',
  'Banner Mobile',
  'Producto',
  'Showroom',
  'Proyecto',
  'Logo',
  'Cliente',
  'General',
];

const pesoMaximoMB = 6;
const pesoMaximoBytes = pesoMaximoMB * 1024 * 1024;
const anchoMaximo = 1800;
const calidadWebp = 0.75;

function formatoFecha() {
  return new Date().toLocaleDateString('es-NI', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

function comprimirImagen(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = () => {
      img.onload = () => {
        const escala = Math.min(1, anchoMaximo / img.width);
        const ancho = Math.round(img.width * escala);
        const alto = Math.round(img.height * escala);

        const canvas = document.createElement('canvas');
        canvas.width = ancho;
        canvas.height = alto;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, ancho, alto);

        const dataUrl = canvas.toDataURL('image/webp', calidadWebp);

        resolve({ dataUrl, ancho, alto });
      };

      img.onerror = () => reject(new Error('No se pudo procesar la imagen.'));
      img.src = reader.result;
    };

    reader.onerror = () => reject(new Error('No se pudo leer el archivo.'));
    reader.readAsDataURL(file);
  });
}

function obtenerImagen(item = {}) {
  return (
    item.imagen ||
    item.imagenMobile ||
    item.imagenDesktop ||
    item.url ||
    item.src ||
    item.archivo ||
    ''
  );
}

export default function MultimediaCRM() {
  const {
    multimedia = [],
    agregarMultimedia,
    actualizarMultimedia,
    eliminarMultimedia,
  } = useElan();

  const [form, setForm] = useState({
    nombre: '',
    categoria: 'Banner',
    imagen: '',
    estado: 'Activo',
  });

  const [busqueda, setBusqueda] = useState('');
  const [error, setError] = useState('');
  const [procesando, setProcesando] = useState(false);
  const [detalleImagen, setDetalleImagen] = useState('');
  const [visor, setVisor] = useState(null);

  const cambiar = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const cargarImagen = async (e) => {
    const file = e.target.files?.[0];
    setError('');
    setDetalleImagen('');

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Solo se permiten imágenes.');
      return;
    }

    if (file.size > pesoMaximoBytes) {
      setError(`La imagen pesa demasiado. Máximo permitido: ${pesoMaximoMB} MB.`);
      return;
    }

    try {
      setProcesando(true);
      const optimizada = await comprimirImagen(file);

      setForm((prev) => ({
        ...prev,
        imagen: optimizada.dataUrl,
        nombre: prev.nombre || file.name.replace(/\.[^/.]+$/, ''),
      }));

      const pesoOriginalKB = Math.round(file.size / 1024);
      const pesoFinalKB = Math.round((optimizada.dataUrl.length * 0.75) / 1024);

      setDetalleImagen(
        `Optimizada a ${optimizada.ancho} × ${optimizada.alto}px · aprox. ${pesoFinalKB} KB · original ${pesoOriginalKB} KB`
      );
    } catch (err) {
      setError(err.message || 'No se pudo cargar la imagen.');
    } finally {
      setProcesando(false);
    }
  };

  const guardar = (e) => {
    e.preventDefault();
    setError('');

    if (!form.nombre.trim()) {
      setError('Escribí un nombre para la imagen.');
      return;
    }

    if (!form.imagen) {
      setError('Seleccioná una imagen.');
      return;
    }

    const nuevo = {
      id: `media-${Date.now()}`,
      nombre: form.nombre.trim(),
      categoria: form.categoria,
      imagen: form.imagen,
      imagenDesktop:
        form.categoria === 'Banner Desktop' || form.categoria === 'Banner'
          ? form.imagen
          : '',
      imagenMobile:
        form.categoria === 'Banner Mobile' ? form.imagen : '',
      url: form.imagen,
      src: form.imagen,
      archivo: form.imagen,
      estado: form.estado,
      fecha: formatoFecha(),
    };

    agregarMultimedia(nuevo);

    setForm({
      nombre: '',
      categoria: 'Banner',
      imagen: '',
      estado: 'Activo',
    });

    setDetalleImagen('');
  };

  const lista = useMemo(() => {
    const q = busqueda.trim().toLowerCase();

    return multimedia.filter((item) => {
      if (!q) return true;

      return [item.nombre, item.categoria, item.estado]
        .join(' ')
        .toLowerCase()
        .includes(q);
    });
  }, [multimedia, busqueda]);

  return (
    <section className="media-admin">
      <style>{`
        .media-admin {
          display: grid;
          gap: 20px;
        }

        .media-card {
          background: #ffffff;
          border-radius: 28px;
          padding: 22px;
          box-shadow: 0 10px 28px rgba(15,23,42,.10);
          border: 1px solid rgba(15,23,42,.08);
        }

        .media-head {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          align-items: flex-start;
        }

        .media-head h1,
        .media-head h2 {
          margin: 0 0 8px;
        }

        .media-head p {
          margin: 0;
          color: #667085;
          font-weight: 700;
          line-height: 1.35;
        }

        .media-form {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
          margin-top: 18px;
        }

        .media-field {
          display: grid;
          gap: 8px;
          font-weight: 900;
        }

        .media-field input,
        .media-field select {
          width: 100%;
          min-height: 54px;
          border-radius: 16px;
          border: 1px solid rgba(15,23,42,.16);
          padding: 12px 14px;
          font-size: 17px;
        }

        .media-file {
          grid-column: span 2;
        }

        .media-preview {
          grid-column: span 2;
          border-radius: 24px;
          overflow: hidden;
          border: 1px solid rgba(15,23,42,.10);
          background: #101826;
        }

        .media-preview img {
          width: 100%;
          max-height: 420px;
          object-fit: contain;
          display: block;
        }

        .media-info {
          grid-column: span 2;
          margin: 0;
          font-weight: 800;
          color: #475467;
        }

        .media-error {
          grid-column: span 2;
          margin: 0;
          font-weight: 900;
          color: #b42318;
        }

        .media-save {
          grid-column: span 2;
          min-height: 60px;
          border-radius: 18px;
          font-size: 20px;
          font-weight: 900;
          cursor: pointer;
        }

        .media-search {
          width: 100%;
          min-height: 56px;
          border-radius: 18px;
          border: 1px solid rgba(15,23,42,.16);
          padding: 12px 16px;
          font-size: 18px;
          margin-top: 16px;
        }

        .media-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
          margin-top: 18px;
        }

        .media-item {
          border-radius: 24px;
          overflow: hidden;
          background: #ffffff;
          border: 1px solid rgba(15,23,42,.10);
          box-shadow: 0 10px 24px rgba(15,23,42,.08);
        }

        .media-thumb-btn {
          width: 100%;
          border: 0;
          padding: 0;
          background: #101826;
          cursor: zoom-in;
        }

        .media-thumb-btn img {
          width: 100%;
          height: 180px;
          object-fit: cover;
          display: block;
        }

        .media-body {
          padding: 16px;
          display: grid;
          gap: 8px;
        }

        .media-title {
          font-size: 18px;
          font-weight: 950;
          color: #172033;
          line-height: 1.15;
        }

        .media-meta {
          color: #667085;
          font-weight: 800;
          line-height: 1.3;
        }

        .media-actions {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-top: 8px;
        }

        .media-actions button {
          min-height: 48px;
          border-radius: 14px;
          font-weight: 900;
          cursor: pointer;
        }

        .media-empty {
          padding: 24px;
          border-radius: 20px;
          background: rgba(15,23,42,.04);
          color: #667085;
          font-weight: 900;
        }

        .media-viewer {
          position: fixed;
          inset: 0;
          z-index: 99999;
          background: rgba(9,12,18,.94);
          display: grid;
          place-items: center;
          padding: 14px;
        }

        .media-viewer-box {
          width: min(1100px, 100%);
          display: grid;
          gap: 14px;
        }

        .media-viewer img {
          width: 100%;
          max-height: 80vh;
          object-fit: contain;
          border-radius: 18px;
          background: #111827;
        }

        .media-viewer button {
          justify-self: end;
          min-height: 56px;
          border-radius: 16px;
          padding: 12px 22px;
          font-size: 18px;
          font-weight: 900;
        }

        @media (max-width: 900px) {
          .media-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 760px) {
          .media-card {
            padding: 18px;
            border-radius: 26px;
          }

          .media-head {
            display: grid;
          }

          .media-head h1 {
            font-size: 32px !important;
          }

          .media-head h2 {
            font-size: 28px !important;
          }

          .media-head p {
            font-size: 18px;
          }

          .media-form {
            grid-template-columns: 1fr;
          }

          .media-file,
          .media-preview,
          .media-info,
          .media-error,
          .media-save {
            grid-column: span 1;
          }

          .media-field {
            font-size: 20px;
          }

          .media-field input,
          .media-field select,
          .media-search {
            min-height: 62px;
            font-size: 20px;
            border-radius: 18px;
          }

          .media-save {
            min-height: 66px;
            font-size: 22px;
          }

          .media-grid {
            grid-template-columns: 1fr;
            gap: 18px;
          }

          .media-thumb-btn img {
            height: 260px;
          }

          .media-title {
            font-size: 24px;
          }

          .media-meta {
            font-size: 18px;
          }

          .media-actions {
            grid-template-columns: 1fr;
          }

          .media-actions button {
            min-height: 60px;
            font-size: 19px;
          }

          .media-viewer button {
            width: 100%;
            min-height: 64px;
            font-size: 22px;
          }
        }
      `}</style>

      <div className="media-card">
        <div className="media-head">
          <div>
            <h1>Multimedia Central</h1>
            <p>
              Biblioteca central para banners desktop, banners mobile, productos,
              showroom, proyectos, logos y clientes.
            </p>
          </div>
        </div>

        <form className="media-form" onSubmit={guardar}>
          <label className="media-field">
            Nombre
            <input
              name="nombre"
              value={form.nombre}
              onChange={cambiar}
              placeholder="Ej: Banner principal ELANVISUAL"
            />
          </label>

          <label className="media-field">
            Categoría
            <select name="categoria" value={form.categoria} onChange={cambiar}>
              {categorias.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </label>

          <label className="media-field">
            Estado
            <select name="estado" value={form.estado} onChange={cambiar}>
              <option value="Activo">Activo</option>
              <option value="Inactivo">Inactivo</option>
            </select>
          </label>

          <label className="media-field media-file">
            Imagen local
            <input type="file" accept="image/*" onChange={cargarImagen} />
          </label>

          {procesando && <p className="media-info">Procesando imagen...</p>}
          {detalleImagen && <p className="media-info">{detalleImagen}</p>}
          {error && <p className="media-error">{error}</p>}

          {form.imagen && (
            <div className="media-preview">
              <img src={form.imagen} alt={form.nombre || 'Vista previa'} />
            </div>
          )}

          <button className="media-save" type="submit" disabled={procesando}>
            Guardar imagen
          </button>
        </form>
      </div>

      <div className="media-card">
        <div className="media-head">
          <div>
            <h2>Biblioteca</h2>
            <p>Imágenes disponibles para banners, catálogo y showroom.</p>
          </div>
        </div>

        <input
          className="media-search"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar imagen..."
        />

        {lista.length === 0 ? (
          <div className="media-empty">No hay imágenes guardadas.</div>
        ) : (
          <div className="media-grid">
            {lista.map((item) => {
              const imagen = obtenerImagen(item);

              return (
                <article className="media-item" key={item.id}>
                  {imagen ? (
                    <button
                      type="button"
                      className="media-thumb-btn"
                      onClick={() =>
                        setVisor({
                          imagen,
                          titulo: item.nombre || 'Multimedia',
                        })
                      }
                    >
                      <img src={imagen} alt={item.nombre || 'Multimedia'} />
                    </button>
                  ) : (
                    <div className="media-empty">Sin imagen</div>
                  )}

                  <div className="media-body">
                    <div className="media-title">
                      {item.nombre || 'Sin nombre'}
                    </div>

                    <div className="media-meta">
                      {item.categoria || 'General'} · {item.fecha || '-'}
                    </div>

                    <div className="media-meta">
                      Estado: {item.estado || 'Activo'}
                    </div>

                    <div className="media-actions">
                      <button
                        type="button"
                        onClick={() =>
                          actualizarMultimedia(item.id, {
                            estado:
                              item.estado === 'Activo' ? 'Inactivo' : 'Activo',
                          })
                        }
                      >
                        {item.estado === 'Activo' ? 'Desactivar' : 'Activar'}
                      </button>

                      <button
                        type="button"
                        onClick={() => eliminarMultimedia(item.id)}
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {visor && (
        <div className="media-viewer" onClick={() => setVisor(null)}>
          <div className="media-viewer-box" onClick={(e) => e.stopPropagation()}>
            <button type="button" onClick={() => setVisor(null)}>
              Cerrar imagen
            </button>
            <img src={visor.imagen} alt={visor.titulo} />
          </div>
        </div>
      )}
    </section>
  );
}