import { useMemo, useState } from 'react';
import { useElan } from '../../core/context/ElanContext.jsx';
import { uid } from '../../utils/formatters.js';

import AppCard from '../../components/AppCard.jsx';
import AppInput from '../../components/AppInput.jsx';
import AppButton from '../../components/AppButton.jsx';

export default function Banners() {
  const { state, addItem, removeItem } = useElan();

  const media = useMemo(() => {
    return Array.isArray(state.multimedia)
      ? state.multimedia.filter((item) => item.tipo === 'banner' || item.tipo === 'general')
      : [];
  }, [state.multimedia]);

  const banners = Array.isArray(state.banners) ? state.banners : [];

  const [form, setForm] = useState({
    titulo: '',
    subtitulo: '',
    imagenDesktop: '',
    imagenMobile: '',
    activo: true,
  });

  const cambiarCampo = (campo, valor) => {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  };

  const guardar = () => {
    if (!form.imagenDesktop && !form.imagenMobile) {
      alert('Seleccioná al menos una imagen desktop o mobile.');
      return;
    }

    addItem('banners', {
      id: uid('banner'),
      titulo: form.titulo.trim() || 'Banner sin título',
      subtitulo: form.subtitulo.trim(),
      imagenDesktop: form.imagenDesktop,
      imagenMobile: form.imagenMobile,
      activo: form.activo,
      creado: new Date().toISOString(),
    });

    setForm({
      titulo: '',
      subtitulo: '',
      imagenDesktop: '',
      imagenMobile: '',
      activo: true,
    });
  };

  return (
    <main className="page-shell">
      <div className="page-title">
        <p className="eyebrow">Administrador</p>
        <h1>Banners</h1>
        <p className="muted">
          Selección directa desde Multimedia. Desktop y móvil separados.
        </p>
      </div>

      <AppCard>
        <div className="form-grid">
          <AppInput
            label="Título"
            value={form.titulo}
            onChange={(e) => cambiarCampo('titulo', e.target.value)}
            placeholder="Ej: Rotulación profesional"
          />

          <AppInput
            label="Subtítulo"
            value={form.subtitulo}
            onChange={(e) => cambiarCampo('subtitulo', e.target.value)}
            placeholder="Ej: Fabricación real para negocios"
          />

          <label className="app-field">
            <span>Imagen desktop</span>
            <select
              value={form.imagenDesktop}
              onChange={(e) => cambiarCampo('imagenDesktop', e.target.value)}
            >
              <option value="">Seleccionar imagen desktop</option>
              {media.map((img) => (
                <option key={img.id} value={img.url}>
                  {img.titulo} / {img.tipo}
                </option>
              ))}
            </select>
          </label>

          <label className="app-field">
            <span>Imagen mobile</span>
            <select
              value={form.imagenMobile}
              onChange={(e) => cambiarCampo('imagenMobile', e.target.value)}
            >
              <option value="">Seleccionar imagen mobile</option>
              {media.map((img) => (
                <option key={img.id} value={img.url}>
                  {img.titulo} / {img.tipo}
                </option>
              ))}
            </select>
          </label>

          {form.imagenDesktop || form.imagenMobile ? (
            <div className="banner-live-preview">
              <picture>
                <source
                  media="(max-width: 760px)"
                  srcSet={form.imagenMobile || form.imagenDesktop}
                />
                <img
                  src={form.imagenDesktop || form.imagenMobile}
                  alt={form.titulo || 'Vista previa del banner'}
                />
              </picture>

              <div>
                <strong>{form.titulo || 'Vista previa del banner'}</strong>
                <span>{form.subtitulo || 'Texto secundario opcional'}</span>
              </div>
            </div>
          ) : null}

          <label className="check-row">
            <input
              type="checkbox"
              checked={form.activo}
              onChange={(e) => cambiarCampo('activo', e.target.checked)}
            />
            Banner activo
          </label>

          <AppButton onClick={guardar}>Guardar banner</AppButton>
        </div>
      </AppCard>

      <section className="banner-list">
        {banners.map((banner) => (
          <article className="banner-admin-card" key={banner.id}>
            <div className="banner-preview">
              <picture>
                <source
                  media="(max-width: 760px)"
                  srcSet={banner.imagenMobile || banner.imagenDesktop}
                />
                <img
                  src={banner.imagenDesktop || banner.imagenMobile}
                  alt={banner.titulo || 'Banner'}
                />
              </picture>

              <div className="banner-preview-text">
                <strong>{banner.titulo || 'Banner sin título'}</strong>
                <span>{banner.subtitulo}</span>
              </div>
            </div>

            <div className="banner-meta">
              <span>{banner.activo ? 'Activo' : 'Inactivo'}</span>
              <AppButton variant="danger" onClick={() => removeItem('banners', banner.id)}>
                Eliminar
              </AppButton>
            </div>
          </article>
        ))}

        {!banners.length ? (
          <div className="empty-state">
            Todavía no hay banners guardados.
          </div>
        ) : null}
      </section>
    </main>
  );
}