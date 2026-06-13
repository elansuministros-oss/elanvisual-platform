import { useMemo, useState } from 'react';
import { useElan } from '../../core/context/ElanContext.jsx';
import { uid } from '../../utils/formatters.js';

import AppCard from '../../components/AppCard.jsx';
import AppInput from '../../components/AppInput.jsx';
import AppButton from '../../components/AppButton.jsx';
import ImageViewer from '../../components/ImageViewer.jsx';

const TIPOS = [
  { value: 'banner', label: 'Banner' },
  { value: 'producto', label: 'Producto' },
  { value: 'showroom', label: 'Showroom' },
  { value: 'general', label: 'General' },
];

export default function Multimedia() {
  const { state, addItem, removeItem } = useElan();

  const [form, setForm] = useState({
    titulo: '',
    url: '',
    tipo: 'banner',
  });

  const [preview, setPreview] = useState('');
  const [viewer, setViewer] = useState(null);
  const [filtro, setFiltro] = useState('todos');

  const multimedia = Array.isArray(state.multimedia) ? state.multimedia : [];

  const listaFiltrada = useMemo(() => {
    if (filtro === 'todos') return multimedia;
    return multimedia.filter((item) => item.tipo === filtro);
  }, [multimedia, filtro]);

  const cambiarCampo = (campo, valor) => {
    setForm((prev) => ({ ...prev, [campo]: valor }));

    if (campo === 'url') {
      setPreview(valor.trim());
    }
  };

  const cargarDesdePC = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Seleccioná únicamente archivos de imagen.');
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const result = String(reader.result || '');

      setForm((prev) => ({
        ...prev,
        titulo: prev.titulo || file.name.replace(/\.[^/.]+$/, ''),
        url: result,
      }));

      setPreview(result);
    };

    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const guardar = () => {
    const url = form.url.trim();

    if (!url) {
      alert('Primero cargá una imagen desde la PC o pegá una URL.');
      return;
    }

    addItem('multimedia', {
      id: uid('media'),
      titulo: form.titulo.trim() || 'Imagen sin título',
      url,
      tipo: form.tipo,
      creado: new Date().toISOString(),
    });

    setForm({ titulo: '', url: '', tipo: 'banner' });
    setPreview('');
  };

  const limpiar = () => {
    setForm({ titulo: '', url: '', tipo: 'banner' });
    setPreview('');
  };

  return (
    <main className="page-shell">
      <div className="page-title">
        <p className="eyebrow">Administrador</p>
        <h1>Multimedia</h1>
        <p className="muted">
          Banco central de imágenes para banners, productos, showroom y contenido general.
        </p>
      </div>

      <AppCard>
        <div className="form-grid">
          <AppInput
            label="Título"
            value={form.titulo}
            onChange={(e) => cambiarCampo('titulo', e.target.value)}
            placeholder="Ej: Banner principal móvil"
          />

          <label className="app-field">
            <span>Subir imagen desde PC</span>
            <input type="file" accept="image/*" onChange={cargarDesdePC} />
          </label>

          <AppInput
            label="URL de imagen"
            value={form.url}
            onChange={(e) => cambiarCampo('url', e.target.value)}
            placeholder="https://... o imagen cargada desde PC"
          />

          <label className="app-field">
            <span>Tipo</span>
            <select
              value={form.tipo}
              onChange={(e) => cambiarCampo('tipo', e.target.value)}
            >
              {TIPOS.map((tipo) => (
                <option key={tipo.value} value={tipo.value}>
                  {tipo.label}
                </option>
              ))}
            </select>
          </label>

          {preview ? (
            <div className="media-preview">
              <button type="button" onClick={() => setViewer(preview)}>
                <img src={preview} alt="Vista previa" />
              </button>
              <span>Vista previa</span>
            </div>
          ) : null}

          <div className="form-actions">
            <AppButton onClick={guardar}>Guardar imagen</AppButton>
            <AppButton variant="secondary" onClick={limpiar}>
              Limpiar
            </AppButton>
          </div>
        </div>
      </AppCard>

      <div className="admin-toolbar">
        <strong>{listaFiltrada.length} imagen(es)</strong>

        <select value={filtro} onChange={(e) => setFiltro(e.target.value)}>
          <option value="todos">Todos</option>
          {TIPOS.map((tipo) => (
            <option key={tipo.value} value={tipo.value}>
              {tipo.label}
            </option>
          ))}
        </select>
      </div>

      <section className="media-grid">
        {listaFiltrada.map((item) => (
          <article className="media-card" key={item.id}>
            <button type="button" onClick={() => setViewer(item.url)}>
              <img src={item.url} alt={item.titulo} />
            </button>

            <div>
              <strong>{item.titulo}</strong>
              <span>{item.tipo}</span>
            </div>

            <AppButton variant="danger" onClick={() => removeItem('multimedia', item.id)}>
              Eliminar
            </AppButton>
          </article>
        ))}

        {!listaFiltrada.length ? (
          <div className="empty-state">
            No hay imágenes guardadas en esta categoría.
          </div>
        ) : null}
      </section>

      <ImageViewer image={viewer} open={Boolean(viewer)} onClose={() => setViewer(null)} />
    </main>
  );
}