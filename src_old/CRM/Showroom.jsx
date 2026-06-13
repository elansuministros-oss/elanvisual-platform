import React, { useMemo, useState } from 'react';
import { useElan } from '../core/context/ElanContext.jsx';

const STORAGE_KEY = 'elanvisual_state_v2';

const formInicial = {
  id: '',
  titulo: '',
  categoria: '',
  cliente: '',
  ubicacion: '',
  descripcion: '',
  imagen: '',
  estado: 'Activo',
};

export default function ShowroomCRM() {
  const { showroom = [], multimedia = [] } = useElan();

  const [lista, setLista] = useState(showroom || []);
  const [form, setForm] = useState(formInicial);
  const [busqueda, setBusqueda] = useState('');
  const [visor, setVisor] = useState(null);

  const imagenesShowroom = multimedia.filter(
    (m) =>
      m.estado === 'Activo' &&
      ['Showroom', 'Proyecto', 'General'].includes(m.categoria)
  );

  const cambiar = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const guardarStorage = (nuevaLista) => {
    const actual = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ...actual,
        showroom: nuevaLista,
      })
    );

    setLista(nuevaLista);
  };

  const limpiar = () => setForm(formInicial);

  const guardar = (e) => {
    e.preventDefault();

    if (!form.titulo.trim()) {
      alert('Ingrese el título del trabajo.');
      return;
    }

    const item = {
      ...form,
      id: form.id || `show-${Date.now()}`,
      fecha: form.fecha || new Date().toISOString(),
      titulo: form.titulo.trim(),
      estado: form.estado || 'Activo',
    };

    const nuevaLista = form.id
      ? lista.map((x) => (x.id === form.id ? item : x))
      : [item, ...lista];

    guardarStorage(nuevaLista);
    limpiar();
  };

  const editar = (item) => {
    setForm({
      id: item.id || '',
      titulo: item.titulo || '',
      categoria: item.categoria || '',
      cliente: item.cliente || '',
      ubicacion: item.ubicacion || '',
      descripcion: item.descripcion || '',
      imagen: item.imagen || '',
      estado: item.estado || 'Activo',
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const eliminar = (id) => {
    if (!confirm('¿Eliminar este trabajo del showroom?')) return;
    guardarStorage(lista.filter((x) => x.id !== id));
  };

  const filtrados = useMemo(() => {
    const q = busqueda.toLowerCase().trim();

    if (!q) return lista;

    return lista.filter((item) =>
      [
        item.titulo,
        item.categoria,
        item.cliente,
        item.ubicacion,
        item.estado,
      ]
        .join(' ')
        .toLowerCase()
        .includes(q)
    );
  }, [lista, busqueda]);

  return (
    <div className="showroom-crm-page">
      <style>
        {`
          .showroom-crm-page {
            display: grid;
            gap: 18px;
          }

          .showroom-crm-page h2 {
            margin: 0;
            font-size: 34px;
            line-height: 1.1;
          }

          .showroom-crm-intro {
            margin: 0;
            color: #667085;
            font-weight: 700;
          }

          .showroom-form,
          .showroom-list-card {
            border: 1px solid rgba(15, 23, 42, .12);
            border-radius: 22px;
            padding: 18px;
            background: #ffffff;
            box-shadow: 0 10px 26px rgba(15, 23, 42, .08);
          }

          .showroom-form h3 {
            margin: 0 0 16px;
            font-size: 24px;
          }

          .showroom-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 14px;
          }

          .showroom-grid label {
            display: grid;
            gap: 8px;
            font-weight: 900;
            color: #172033;
          }

          .showroom-grid input,
          .showroom-grid select,
          .showroom-grid textarea,
          .showroom-search {
            width: 100%;
            min-height: 50px;
            border-radius: 14px;
            border: 1px solid rgba(15, 23, 42, .18);
            padding: 12px 14px;
            font-size: 16px;
            background: #fff;
          }

          .showroom-grid textarea {
            min-height: 110px;
            resize: vertical;
          }

          .showroom-preview {
            margin-top: 14px;
          }

          .showroom-preview img {
            width: 260px;
            height: 160px;
            object-fit: cover;
            border-radius: 16px;
            border: 1px solid rgba(15, 23, 42, .14);
            cursor: zoom-in;
          }

          .showroom-actions {
            display: flex;
            gap: 10px;
            margin-top: 16px;
          }

          .showroom-actions button,
          .showroom-item-actions button {
            min-height: 52px;
            border-radius: 14px;
            padding: 12px 18px;
            font-size: 16px;
            font-weight: 900;
            cursor: pointer;
          }

          .showroom-list {
            display: grid;
            gap: 14px;
          }

          .showroom-item {
            border: 1px solid rgba(15, 23, 42, .12);
            border-radius: 20px;
            padding: 14px;
            display: grid;
            grid-template-columns: 180px 1fr;
            gap: 16px;
            background: #ffffff;
          }

          .showroom-item-img {
            width: 100%;
            height: 130px;
            object-fit: cover;
            border-radius: 16px;
            cursor: zoom-in;
          }

          .showroom-item h3 {
            margin: 0 0 8px;
            font-size: 22px;
          }

          .showroom-meta,
          .showroom-desc {
            margin: 0 0 8px;
            color: #475467;
            font-weight: 700;
            line-height: 1.35;
          }

          .showroom-status {
            display: inline-flex;
            width: fit-content;
            border-radius: 999px;
            padding: 7px 12px;
            background: rgba(216, 168, 79, .16);
            color: #172033;
            font-size: 14px;
            font-weight: 900;
            margin-bottom: 10px;
          }

          .showroom-item-actions {
            display: flex;
            gap: 10px;
            margin-top: 12px;
          }

          .showroom-viewer {
            position: fixed;
            inset: 0;
            z-index: 99999;
            background: rgba(9, 12, 18, .92);
            display: grid;
            place-items: center;
            padding: 18px;
          }

          .showroom-viewer-box {
            width: min(1100px, 100%);
            display: grid;
            gap: 14px;
          }

          .showroom-viewer img {
            width: 100%;
            max-height: 80vh;
            object-fit: contain;
            border-radius: 18px;
            background: #111827;
          }

          .showroom-viewer button {
            justify-self: end;
            min-height: 54px;
            border-radius: 16px;
            padding: 12px 20px;
            font-size: 18px;
            font-weight: 900;
          }

          @media (max-width: 760px) {
            .showroom-crm-page h2 {
              font-size: 34px;
            }

            .showroom-crm-intro {
              font-size: 19px;
              line-height: 1.35;
            }

            .showroom-form,
            .showroom-list-card {
              padding: 18px;
              border-radius: 24px;
            }

            .showroom-form h3 {
              font-size: 28px;
            }

            .showroom-grid {
              grid-template-columns: 1fr;
              gap: 16px;
            }

            .showroom-grid label {
              font-size: 20px;
            }

            .showroom-grid input,
            .showroom-grid select,
            .showroom-grid textarea,
            .showroom-search {
              min-height: 62px;
              font-size: 20px;
              border-radius: 18px;
            }

            .showroom-grid textarea {
              min-height: 150px;
            }

            .showroom-preview img {
              width: 100%;
              height: 240px;
            }

            .showroom-actions {
              flex-direction: column;
            }

            .showroom-actions button,
            .showroom-item-actions button {
              width: 100%;
              min-height: 64px;
              font-size: 21px;
              border-radius: 18px;
            }

            .showroom-list {
              gap: 18px;
            }

            .showroom-item {
              grid-template-columns: 1fr;
              padding: 16px;
              border-radius: 24px;
            }

            .showroom-item-img {
              height: 260px;
              border-radius: 20px;
            }

            .showroom-item h3 {
              font-size: 27px;
              line-height: 1.15;
            }

            .showroom-meta,
            .showroom-desc {
              font-size: 20px;
            }

            .showroom-status {
              font-size: 17px;
              padding: 9px 14px;
            }

            .showroom-item-actions {
              flex-direction: column;
            }

            .showroom-viewer {
              padding: 10px;
            }

            .showroom-viewer img {
              max-height: 74vh;
              border-radius: 14px;
            }

            .showroom-viewer button {
              width: 100%;
              min-height: 64px;
              font-size: 22px;
            }
          }
        `}
      </style>

      <h2>Showroom</h2>

      <p className="showroom-crm-intro">
        Galería administrativa de trabajos realizados, conectada a Multimedia
        Central.
      </p>

      <form className="showroom-form" onSubmit={guardar}>
        <h3>{form.id ? 'Editar trabajo' : 'Nuevo trabajo'}</h3>

        <div className="showroom-grid">
          <label>
            Título
            <input
              name="titulo"
              value={form.titulo}
              onChange={cambiar}
              placeholder="Ej: Fachada COMEX Altamira"
            />
          </label>

          <label>
            Categoría
            <input
              name="categoria"
              value={form.categoria}
              onChange={cambiar}
              placeholder="Ej: Fachada, monolito, letras 3D"
            />
          </label>

          <label>
            Cliente
            <input
              name="cliente"
              value={form.cliente}
              onChange={cambiar}
              placeholder="Ej: COMEX"
            />
          </label>

          <label>
            Ubicación
            <input
              name="ubicacion"
              value={form.ubicacion}
              onChange={cambiar}
              placeholder="Ej: Managua, Nicaragua"
            />
          </label>

          <label>
            Imagen desde Multimedia
            <select name="imagen" value={form.imagen} onChange={cambiar}>
              <option value="">Sin imagen</option>

              {imagenesShowroom.map((img) => (
                <option
                  key={img.id}
                  value={img.imagen || img.url || img.src || ''}
                >
                  {img.nombre || img.titulo || img.id}
                </option>
              ))}
            </select>
          </label>

          <label>
            Estado
            <select name="estado" value={form.estado} onChange={cambiar}>
              <option value="Activo">Activo</option>
              <option value="Inactivo">Inactivo</option>
            </select>
          </label>

          <label>
            Descripción
            <textarea
              name="descripcion"
              value={form.descripcion}
              onChange={cambiar}
              placeholder="Descripción técnica o comercial del trabajo"
            />
          </label>
        </div>

        {form.imagen && (
          <div className="showroom-preview">
            <img
              src={form.imagen}
              alt={form.titulo || 'Showroom'}
              onClick={() =>
                setVisor({
                  imagen: form.imagen,
                  titulo: form.titulo || 'Showroom',
                })
              }
            />
          </div>
        )}

        <div className="showroom-actions">
          <button type="submit">
            {form.id ? 'Guardar cambios' : 'Crear trabajo'}
          </button>

          {form.id && (
            <button type="button" onClick={limpiar}>
              Cancelar edición
            </button>
          )}
        </div>
      </form>

      <input
        className="showroom-search"
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        placeholder="Buscar trabajo, cliente, ubicación o estado..."
      />

      <section className="showroom-list-card">
        {filtrados.length === 0 ? (
          <p>No hay trabajos registrados.</p>
        ) : (
          <div className="showroom-list">
            {filtrados.map((item) => (
              <article className="showroom-item" key={item.id}>
                {item.imagen && (
                  <img
                    className="showroom-item-img"
                    src={item.imagen}
                    alt={item.titulo}
                    onClick={() =>
                      setVisor({
                        imagen: item.imagen,
                        titulo: item.titulo || 'Showroom',
                      })
                    }
                  />
                )}

                <div>
                  <h3>{item.titulo}</h3>

                  <p className="showroom-meta">
                    {item.categoria || 'Sin categoría'} ·{' '}
                    {item.cliente || 'Sin cliente'} ·{' '}
                    {item.ubicacion || 'Sin ubicación'}
                  </p>

                  <span className="showroom-status">
                    Estado: {item.estado || 'Activo'}
                  </span>

                  {item.descripcion && (
                    <p className="showroom-desc">{item.descripcion}</p>
                  )}

                  <div className="showroom-item-actions">
                    <button type="button" onClick={() => editar(item)}>
                      Editar
                    </button>

                    <button type="button" onClick={() => eliminar(item.id)}>
                      Eliminar
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {visor && (
        <div className="showroom-viewer" onClick={() => setVisor(null)}>
          <div
            className="showroom-viewer-box"
            onClick={(e) => e.stopPropagation()}
          >
            <button type="button" onClick={() => setVisor(null)}>
              Cerrar imagen
            </button>

            <img src={visor.imagen} alt={visor.titulo} />
          </div>
        </div>
      )}
    </div>
  );
}