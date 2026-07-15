import React, { useEffect, useMemo, useState } from 'react';
import {
  Building2,
  CheckCircle2,
  FileImage,
  ImagePlus,
  LoaderCircle,
  MapPin,
  MessageCircle,
  Palette,
  Ruler,
  Send,
  Sparkles,
  Upload
} from 'lucide-react';
import {
  loadDesignGallery,
  loadDesignRequestStatus,
  parseWhatsAppDesignContext,
  readDesignFile,
  submitDesignFollowup,
  submitDesignRequest
} from '../services/designPortalService';
import '../styles/design-portal.css';

const PRODUCT_TYPES = [
  { value: 'rotulo', label: 'Rótulo' },
  { value: 'fachada', label: 'Fachada' },
  { value: 'logo', label: 'Logo' },
  { value: 'otro', label: 'Otro' }
];

const FILE_FIELDS = [
  { key: 'logo', label: 'Subir logo', hint: 'PNG, JPG, SVG o PDF', icon: FileImage },
  { key: 'place', label: 'Foto del lugar', hint: 'JPG, PNG o WEBP', icon: Building2 },
  { key: 'reference', label: 'Imagen de referencia', hint: 'Un estilo que te guste', icon: ImagePlus }
];

function UploadCard({ definition, file, onChange }) {
  const Icon = definition.icon;

  return (
    <label className={`design-upload-card ${file ? 'is-ready' : ''}`}>
      <input
        type="file"
        accept=".png,.jpg,.jpeg,.webp,.svg,.pdf"
        onChange={(event) => onChange(definition.key, event.target.files?.[0] || null)}
      />
      <span className="design-upload-icon">
        {file ? <CheckCircle2 size={24} /> : <Icon size={24} />}
      </span>
      <strong>{file?.name || definition.label}</strong>
      <small>{file ? 'Archivo listo' : definition.hint}</small>
      <span className="design-upload-action">
        <Upload size={15} /> {file ? 'Cambiar' : 'Seleccionar'}
      </span>
    </label>
  );
}

export default function DisenoPortal() {
  const context = useMemo(() => parseWhatsAppDesignContext(), []);
  const [form, setForm] = useState({
    customerName: '',
    businessName: '',
    whatsapp: context.whatsapp,
    requestType: context.requestType,
    environment: 'exterior',
    widthCm: '',
    heightCm: '',
    logoMode: context.requestType === 'logo' ? 'needs-design' : 'has-logo',
    designNotes: ''
  });
  const [files, setFiles] = useState({ logo: null, place: null, reference: null });
  const [gallery, setGallery] = useState([]);
  const [galleryState, setGalleryState] = useState('loading');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);
  const [resultStatus, setResultStatus] = useState(null);
  const [followupMode, setFollowupMode] = useState('');
  const [followupSubmitting, setFollowupSubmitting] = useState(false);
  const [followupError, setFollowupError] = useState('');
  const [followupFile, setFollowupFile] = useState(null);
  const [followupForm, setFollowupForm] = useState({
    instructions: '',
    requestType: 'rotulo',
    environment: 'exterior',
    widthCm: '',
    heightCm: ''
  });

  useEffect(() => {
    let active = true;

    loadDesignGallery()
      .then(items => {
        if (!active) return;
        setGallery(items);
        setGalleryState('ready');
      })
      .catch(() => {
        if (active) setGalleryState('unavailable');
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!success?.requestCode || !success?.accessToken) return undefined;
    let active = true;
    let timer;

    const poll = async () => {
      try {
        const result = await loadDesignRequestStatus({
          requestCode: success.requestCode,
          accessToken: success.accessToken
        });
        if (!active) return;
        setResultStatus(result);
        if (
          result.status !== 'failed' &&
          (!result.ready || result.deliveryPending === true)
        ) {
          timer = window.setTimeout(poll, 4000);
        }
      } catch {
        if (active) timer = window.setTimeout(poll, 7000);
      }
    };

    void poll();
    return () => {
      active = false;
      if (timer) window.clearTimeout(timer);
    };
  }, [success]);

  const update = (key, value) => {
    setForm(current => ({
      ...current,
      [key]: value,
      ...(key === 'requestType' && value === 'logo'
        ? { logoMode: 'needs-design' }
        : {})
    }));
    setError('');
  };

  const handleSubmit = async event => {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const preparedFiles = [];

      for (const [kind, file] of Object.entries(files)) {
        if (!file) continue;
        const prepared = await readDesignFile(file);
        preparedFiles.push({ kind, ...prepared });
      }

      const data = await submitDesignRequest({
        source: context.source,
        externalUserId: context.externalUserId || form.whatsapp,
        conversationRef: context.conversationRef || null,
        customer: {
          name: form.customerName,
          businessName: form.businessName,
          whatsapp: form.whatsapp
        },
        project: {
          requestType: form.requestType,
          installationEnvironment: form.requestType === 'logo' ? null : form.environment,
          widthCm: form.widthCm || null,
          heightCm: form.heightCm || null,
          hasLogo: form.logoMode === 'has-logo',
          needsLogoDesign: form.logoMode === 'needs-design',
          designNotes: form.designNotes
        },
        files: preparedFiles
      });

      setSuccess(data.result);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (submitError) {
      setError(submitError?.message || 'No fue posible enviar la solicitud.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFollowupSubmit = async event => {
    event.preventDefault();
    setFollowupError('');
    setFollowupSubmitting(true);

    try {
      const preparedFiles = [];
      if (followupFile) {
        const prepared = await readDesignFile(followupFile);
        preparedFiles.push({ kind: 'place', ...prepared });
      }
      const data = await submitDesignFollowup({
        requestCode: success.requestCode,
        accessToken: success.accessToken,
        action: followupMode,
        instructions: followupForm.instructions,
        project: followupMode === 'render'
          ? {
              requestType: followupForm.requestType,
              installationEnvironment: followupForm.environment,
              widthCm: followupForm.widthCm || null,
              heightCm: followupForm.heightCm || null
            }
          : {},
        files: preparedFiles
      });

      setResultStatus({
        ...data.result,
        ready: false,
        deliveryPending: false
      });
      setFollowupMode('');
      setFollowupFile(null);
      setFollowupForm(current => ({ ...current, instructions: '' }));
      setSuccess(current => ({ ...current, followupNonce: Date.now() }));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (followupSubmitError) {
      setFollowupError(
        followupSubmitError?.message || 'No fue posible continuar la solicitud.'
      );
    } finally {
      setFollowupSubmitting(false);
    }
  };

  if (success) {
    const ready = resultStatus?.ready === true && resultStatus?.imageUrl;
    const failed = resultStatus?.status === 'failed';
    return (
      <main className="design-portal-page">
        <section className="design-success-card">
          <span className="design-success-icon"><CheckCircle2 size={38} /></span>
          <p className="design-eyebrow">{ready ? 'Propuesta generada' : 'Solicitud recibida'}</p>
          <h1>{ready ? 'Tu propuesta visual está lista' : 'ELAN IA está preparando tu diseño'}</h1>
          <p>
            Guardá este código: <strong>{success.requestCode}</strong>.
            {ready
              ? resultStatus.deliveredToWhatsApp
                ? ' También la enviamos a tu WhatsApp para continuar con los ajustes.'
                : ' Podés revisar la imagen aquí y continuar por WhatsApp.'
              : failed
                ? ' No fue posible completar esta generación. Continuaremos la revisión por WhatsApp.'
                : ' Esta pantalla se actualizará automáticamente cuando la imagen esté lista.'}
          </p>
          {ready && (
            <>
              <img
                className="design-result-image"
                src={resultStatus.imageUrl}
                alt={`Propuesta visual ${success.requestCode}`}
              />
              {resultStatus.deliveryPending && (
                <div className="design-generation-status" role="status">
                  <LoaderCircle className="spin" size={22} />
                  Enviando también a tu WhatsApp…
                </div>
              )}
              <p className="design-version-label">
                Versión {resultStatus.revisionNumber || 1} · {
                  resultStatus.workflowStage === 'render'
                    ? 'Render hiperrealista'
                    : resultStatus.workflowStage === 'revision'
                      ? 'Propuesta ajustada'
                      : 'Concepto inicial'
                }
              </p>
              <div className="design-followup-actions">
                <button
                  type="button"
                  onClick={() => {
                    setFollowupMode('revision');
                    setFollowupError('');
                  }}
                >
                  <Palette size={18} /> Solicitar cambios
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFollowupMode('render');
                    setFollowupError('');
                  }}
                >
                  <Sparkles size={18} /> Crear render hiperrealista
                </button>
              </div>
              {followupMode && (
                <form className="design-followup-form" onSubmit={handleFollowupSubmit}>
                  <h2>
                    {followupMode === 'render'
                      ? 'Convertir este diseño en un render'
                      : 'Preparar una nueva versión'}
                  </h2>
                  {followupMode === 'render' && (
                    <>
                      <div className="design-followup-grid">
                        <label>
                          <span>Aplicación</span>
                          <select
                            value={followupForm.requestType}
                            onChange={event => setFollowupForm(current => ({ ...current, requestType: event.target.value }))}
                          >
                            <option value="rotulo">Rótulo</option>
                            <option value="fachada">Fachada</option>
                          </select>
                        </label>
                        <label>
                          <span>Instalación</span>
                          <select
                            value={followupForm.environment}
                            onChange={event => setFollowupForm(current => ({ ...current, environment: event.target.value }))}
                          >
                            <option value="exterior">Exterior</option>
                            <option value="interior">Interior</option>
                          </select>
                        </label>
                        <label>
                          <span>Ancho aproximado (cm)</span>
                          <input
                            type="number"
                            min="1"
                            inputMode="decimal"
                            value={followupForm.widthCm}
                            onChange={event => setFollowupForm(current => ({ ...current, widthCm: event.target.value }))}
                          />
                        </label>
                        <label>
                          <span>Alto aproximado (cm)</span>
                          <input
                            type="number"
                            min="1"
                            inputMode="decimal"
                            value={followupForm.heightCm}
                            onChange={event => setFollowupForm(current => ({ ...current, heightCm: event.target.value }))}
                          />
                        </label>
                      </div>
                      <label className="design-followup-file">
                        <span>Foto del lugar (opcional)</span>
                        <input
                          type="file"
                          accept=".png,.jpg,.jpeg,.webp"
                          onChange={event => setFollowupFile(event.target.files?.[0] || null)}
                        />
                        <small>{followupFile?.name || 'Ayuda a crear un montaje más realista.'}</small>
                      </label>
                    </>
                  )}
                  <label>
                    <span>
                      {followupMode === 'render'
                        ? '¿Cómo debe verse instalado?'
                        : '¿Qué querés cambiar?'}
                    </span>
                    <textarea
                      required
                      maxLength={4000}
                      value={followupForm.instructions}
                      onChange={event => setFollowupForm(current => ({ ...current, instructions: event.target.value }))}
                      placeholder={followupMode === 'render'
                        ? 'Ej. Sobre pared blanca, de noche y con iluminación cálida.'
                        : 'Ej. Cambiar el fondo rosado por azul oscuro y quitar los corazones.'}
                    />
                  </label>
                  {followupError && <div className="design-form-error" role="alert">{followupError}</div>}
                  <div className="design-followup-form-actions">
                    <button type="button" onClick={() => setFollowupMode('')}>Cancelar</button>
                    <button type="submit" disabled={followupSubmitting}>
                      {followupSubmitting
                        ? <LoaderCircle className="spin" size={18} />
                        : <Send size={18} />}
                      {followupSubmitting
                        ? 'Enviando…'
                        : followupMode === 'render'
                          ? 'Generar render'
                          : 'Generar nueva versión'}
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
          {!ready && !failed && (
            <div className="design-generation-status" role="status">
              <LoaderCircle className="spin" size={22} />
              {resultStatus?.status === 'designing'
                ? 'Generando la imagen…'
                : 'Solicitud en cola…'}
            </div>
          )}
          <a
            className="design-primary-button"
            href={`https://wa.me/${String(success.whatsapp || '').replace(/\D/g, '')}`}
          >
            <MessageCircle size={20} /> Volver a WhatsApp
          </a>
        </section>
      </main>
    );
  }

  return (
    <main className="design-portal-page">
      <section className="design-portal-hero">
        <div>
          <p className="design-eyebrow"><Sparkles size={17} /> ELAN IA · Diseño visual</p>
          <h1>Contanos cómo debe verse tu proyecto</h1>
          <p>
            Completá los datos una sola vez. ELAN IA generará la propuesta y podrás continuar por WhatsApp.
          </p>
        </div>
        {context.source === 'whatsapp' && (
          <div className="design-whatsapp-badge">
            <MessageCircle size={19} /> Solicitud iniciada desde WhatsApp
          </div>
        )}
      </section>

      <div className="design-portal-layout">
        <form className="design-form" onSubmit={handleSubmit}>
          <div className="design-progress" aria-label="Proceso de solicitud">
            <span className="active"><b>1</b> Datos</span>
            <i />
            <span><b>2</b> Proyecto</span>
            <i />
            <span><b>3</b> Archivos</span>
          </div>

          <section className="design-form-section">
            <div className="design-section-heading">
              <MessageCircle size={21} />
              <div><h2>Datos de contacto</h2><p>Para identificar tu solicitud en WhatsApp.</p></div>
            </div>
            <div className="design-fields two-columns">
              <label>
                <span>Nombre del cliente</span>
                <input required value={form.customerName} onChange={e => update('customerName', e.target.value)} placeholder="Tu nombre" />
              </label>
              <label>
                <span>Nombre del negocio</span>
                <input required value={form.businessName} onChange={e => update('businessName', e.target.value)} placeholder="Ej. Gimnasio Reyna" />
              </label>
              <label className="full-width">
                <span>WhatsApp</span>
                <div className="design-input-with-icon">
                  <MessageCircle size={18} />
                  <input required inputMode="tel" value={form.whatsapp} onChange={e => update('whatsapp', e.target.value)} placeholder="505 8888 8888" readOnly={Boolean(context.whatsapp)} />
                </div>
              </label>
            </div>
          </section>

          <section className="design-form-section">
            <div className="design-section-heading">
              <Palette size={21} />
              <div><h2>Tu proyecto</h2><p>Elegí el tipo y las especificaciones principales.</p></div>
            </div>

            <fieldset className="design-choice-group">
              <legend>¿Qué necesitás?</legend>
              <div className="design-product-choices">
                {PRODUCT_TYPES.map(item => (
                  <label key={item.value} className={form.requestType === item.value ? 'selected' : ''}>
                    <input type="radio" name="requestType" value={item.value} checked={form.requestType === item.value} onChange={() => update('requestType', item.value)} />
                    {item.label}
                  </label>
                ))}
              </div>
            </fieldset>

            {form.requestType !== 'logo' && (
              <fieldset className="design-choice-group">
                <legend>¿Dónde se instalará?</legend>
                <div className="design-environment-choices">
                  {['interior', 'exterior'].map(value => (
                    <label key={value} className={form.environment === value ? 'selected' : ''}>
                      <input type="radio" name="environment" checked={form.environment === value} onChange={() => update('environment', value)} />
                      <MapPin size={17} /> {value === 'interior' ? 'Interior' : 'Exterior'}
                    </label>
                  ))}
                </div>
              </fieldset>
            )}

            <fieldset className="design-choice-group">
              <legend>Logo</legend>
              <div className="design-logo-choices">
                <label className={form.logoMode === 'has-logo' ? 'selected' : ''}>
                  <input type="radio" name="logoMode" checked={form.logoMode === 'has-logo'} onChange={() => update('logoMode', 'has-logo')} />
                  Ya tengo logo
                </label>
                <label className={form.logoMode === 'needs-design' ? 'selected' : ''}>
                  <input type="radio" name="logoMode" checked={form.logoMode === 'needs-design'} onChange={() => update('logoMode', 'needs-design')} />
                  Necesito crear mi logo
                </label>
              </div>
            </fieldset>

            {form.requestType !== 'logo' && (
              <div className="design-fields two-columns design-measurements">
                <label>
                  <span><Ruler size={16} /> Ancho aproximado</span>
                  <div className="design-unit-input"><input type="number" min="1" inputMode="decimal" value={form.widthCm} onChange={e => update('widthCm', e.target.value)} placeholder="120" /><b>cm</b></div>
                </label>
                <label>
                  <span><Ruler size={16} /> Alto aproximado</span>
                  <div className="design-unit-input"><input type="number" min="1" inputMode="decimal" value={form.heightCm} onChange={e => update('heightCm', e.target.value)} placeholder="80" /><b>cm</b></div>
                </label>
              </div>
            )}
          </section>

          <section className="design-form-section">
            <div className="design-section-heading">
              <ImagePlus size={21} />
              <div><h2>Archivos y referencias</h2><p>Podés adjuntar hasta tres archivos de 8 MB cada uno.</p></div>
            </div>
            <div className="design-upload-grid">
              {FILE_FIELDS.map(definition => (
                <UploadCard key={definition.key} definition={definition} file={files[definition.key]} onChange={(key, file) => setFiles(current => ({ ...current, [key]: file }))} />
              ))}
            </div>
            <label className="design-notes-field">
              <span>Indicaciones del diseño</span>
              <textarea value={form.designNotes} onChange={e => update('designNotes', e.target.value)} placeholder="Texto que debe llevar, colores, estilo, iluminación y cualquier detalle importante." maxLength={6000} />
              <small>{form.designNotes.length}/6000</small>
            </label>
          </section>

          {error && <div className="design-form-error" role="alert">{error}</div>}

          <div className="design-submit-bar">
            <button className="design-primary-button" type="submit" disabled={submitting}>
              {submitting ? <LoaderCircle className="spin" size={21} /> : <Send size={20} />}
              {submitting ? 'Enviando solicitud…' : 'Enviar solicitud de diseño'}
            </button>
            <p><Sparkles size={16} /> La propuesta se generará al enviar la solicitud</p>
          </div>
        </form>

        <aside className="design-gallery-panel" id="disenos-realizados">
          <div className="design-gallery-heading">
            <p className="design-eyebrow"><Sparkles size={15} /> Inspiración</p>
            <h2>Diseños realizados por ELAN IA</h2>
            <p>Propuestas autorizadas para mostrar como referencia.</p>
          </div>

          {galleryState === 'loading' && <p className="design-gallery-note">Cargando diseños…</p>}
          {galleryState === 'unavailable' && <p className="design-gallery-note">La galería estará disponible pronto.</p>}
          {galleryState === 'ready' && gallery.length === 0 && <p className="design-gallery-note">Los primeros diseños aprobados aparecerán aquí.</p>}

          <div className="design-gallery-grid">
            {gallery.map(item => (
              <article key={item.id} className="design-gallery-card">
                <img src={item.thumbnailUrl || item.imageUrl} alt={item.title} loading="lazy" />
                <div><span>{item.category}</span><h3>{item.title}</h3>{item.description && <p>{item.description}</p>}</div>
              </article>
            ))}
          </div>
        </aside>
      </div>
    </main>
  );
}
