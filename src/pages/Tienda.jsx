import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Download,
  MessageCircle,
  PackageSearch,
  Phone,
  Search,
  ShoppingCart,
  Sparkles,
  Upload,
  Wand2,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AI_DESIGN_LIMIT, obtenerPerfilIA } from '../data/aiProductProfiles';

const moneyUSD = (value) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(Number(value || 0));

const texto = (value) => String(value || '').trim();

const slugify = (value) =>
  texto(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const imagenFallback = '/productos/portada-visual.png';

const obtenerImagenCategoria = (categoria = {}) =>
  categoria.imagenDesktop ||
  categoria.imagenRuta ||
  categoria.imagen ||
  categoria.img ||
  categoria.imagenMobile ||
  imagenFallback;

const normalizarWhatsapp = (value) => texto(value).replace(/[^\d+]/g, '');

const obtenerUsoNumero = (whatsapp) => {
  if (!whatsapp) return 0;
  try {
    const data = JSON.parse(localStorage.getItem('elanvisual_ai_design_usage') || '{}');
    return Number(data[whatsapp] || 0);
  } catch {
    return 0;
  }
};

const registrarUsoNumero = (whatsapp) => {
  if (!whatsapp) return 0;
  try {
    const data = JSON.parse(localStorage.getItem('elanvisual_ai_design_usage') || '{}');
    const nuevoUso = Number(data[whatsapp] || 0) + 1;
    data[whatsapp] = nuevoUso;
    localStorage.setItem('elanvisual_ai_design_usage', JSON.stringify(data));
    return nuevoUso;
  } catch {
    return 0;
  }
};

export default function Tienda({ setPage }) {
  const {
    productos = [],
    categoriasHome = [],
    agregar,
    carrito = [],
  } = useApp();

  const [busqueda, setBusqueda] = useState('');
  const [modalAI, setModalAI] = useState(false);
  const [productoAI, setProductoAI] = useState(null);
  const [resultadoAI, setResultadoAI] = useState(null);
  const [formAI, setFormAI] = useState({
    negocio: '',
    whatsapp: '',
    idea: '',
    logoNombre: '',
    lugarNombre: '',
  });

  const slugInicial = (() => {
    const path = window.location.pathname || '/tienda';
    const partes = path.split('/').filter(Boolean);
    return partes[0] === 'tienda' && partes[1] ? partes[1] : '';
  })();

  const [categoriaActiva, setCategoriaActiva] = useState(slugInicial);

  const categoriasOficiales = useMemo(() => {
    return Array.isArray(categoriasHome)
      ? categoriasHome
          .filter((categoria) => categoria?.activo !== false)
          .map((categoria) => ({
            ...categoria,
            id:
              categoria.id ||
              `cat-${slugify(categoria.nombre || categoria.titulo || 'general')}`,
            nombre: texto(categoria.nombre || categoria.titulo || 'Categoria ELANVISUAL'),
            slug:
              categoria.slug ||
              slugify(categoria.nombre || categoria.titulo || categoria.id || 'general'),
            imagen: obtenerImagenCategoria(categoria),
            orden: Number(categoria.orden || 999),
          }))
          .filter((categoria) => categoria.slug)
          .sort((a, b) => Number(a.orden || 999) - Number(b.orden || 999))
      : [];
  }, [categoriasHome]);

  const productosNormalizados = useMemo(() => {
    return productos
      .filter((producto) => producto?.activo !== false)
      .map((producto) => {
        const slugCategoria =
          producto.categoriaSlug ||
          producto.slugCategoria ||
          slugify(texto(producto.categoria) || 'general');

        const categoriaOficial = categoriasOficiales.find(
          (cat) => cat.slug === slugCategoria
        );

        return {
          ...producto,
          id: producto.id || producto.codigo || producto.nombre,
          nombre: texto(producto.nombre) || 'Producto ELANVISUAL',
          descripcion: texto(producto.descripcion) || '',
          categoria: categoriaOficial?.nombre || texto(producto.categoria) || 'General',
          categoriaSlug: categoriaOficial?.slug || slugCategoria,
          categoriaHomeId: categoriaOficial?.id || producto.categoriaHomeId || '',
          imagen: texto(producto.imagen) || texto(producto.url) || imagenFallback,
          precio: Number(producto.precio || producto.precioUSD || producto.precio_usd || 0),
        };
      });
  }, [productos, categoriasOficiales]);

  const categorias = useMemo(() => {
    return categoriasOficiales
      .map((categoria) => {
        const productosCategoria = productosNormalizados.filter(
          (producto) => producto.categoriaSlug === categoria.slug
        );

        return {
          ...categoria,
          cantidad: productosCategoria.length,
        };
      })
      .filter((categoria) => categoria.cantidad > 0);
  }, [categoriasOficiales, productosNormalizados]);

  const productosFiltrados = useMemo(() => {
    const q = busqueda.toLowerCase().trim();

    return productosNormalizados
      .filter((producto) => !categoriaActiva || producto.categoriaSlug === categoriaActiva)
      .filter((producto) => {
        if (!q) return true;

        return `${producto.nombre} ${producto.descripcion} ${producto.categoria} ${
          producto.codigo || ''
        }`
          .toLowerCase()
          .includes(q);
      });
  }, [productosNormalizados, categoriaActiva, busqueda]);

  const modelosAI = useMemo(() => {
    return productosNormalizados.slice(0, 12);
  }, [productosNormalizados]);

  const cantidadCarrito = carrito.reduce(
    (acc, item) => acc + Number(item?.cantidad || 1),
    0
  );

  const abrirCategoria = (slug) => {
    setCategoriaActiva(slug);
    setBusqueda('');
    window.history.pushState({}, '', `/tienda/${slug}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const volverCategorias = () => {
    setCategoriaActiva('');
    setBusqueda('');
    window.history.pushState({}, '', '/tienda');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const abrirAI = (producto = null) => {
    setProductoAI(producto);
    setResultadoAI(null);
    setModalAI(true);
  };

  const cerrarAI = () => {
    setModalAI(false);
    setProductoAI(null);
    setResultadoAI(null);
  };

  const agregarAlCarrito = (producto) => {
    if (typeof agregar === 'function') {
      agregar(producto);
    }
  };

  const actualizarFormAI = (campo, value) => {
    setFormAI((prev) => ({
      ...prev,
      [campo]: value,
    }));
  };

  const generarPropuestaAI = () => {
    const whatsapp = normalizarWhatsapp(formAI.whatsapp);

    if (!productoAI) {
      alert('Selecciona primero un modelo.');
      return;
    }

    if (!whatsapp || whatsapp.length < 8) {
      alert('Ingresa un numero de WhatsApp valido para dar seguimiento.');
      return;
    }

    const usoActual = obtenerUsoNumero(whatsapp);

    if (usoActual >= AI_DESIGN_LIMIT) {
      setResultadoAI({
        bloqueado: true,
        whatsapp,
        usos: usoActual,
      });
      return;
    }

    const nuevoUso = registrarUsoNumero(whatsapp);
    const perfil = obtenerPerfilIA(productoAI);

    const lead = {
      id: `ai-${Date.now()}`,
      estado: 'propuesta_generada',
      seguimiento: ['dia_2', 'dia_7', 'dia_15'],
      producto: productoAI,
      perfil,
      cliente: {
        negocio: formAI.negocio,
        whatsapp,
        idea: formAI.idea,
        logoNombre: formAI.logoNombre,
        lugarNombre: formAI.lugarNombre,
      },
      usos: nuevoUso,
      creadoEn: new Date().toISOString(),
    };

    try {
      const leads = JSON.parse(localStorage.getItem('elanvisual_ai_leads') || '[]');
      leads.unshift(lead);
      localStorage.setItem('elanvisual_ai_leads', JSON.stringify(leads.slice(0, 100)));
    } catch {
      // No bloquear experiencia por error local.
    }

    setResultadoAI(lead);
  };

  const descargarResumenAI = () => {
    if (!resultadoAI || resultadoAI.bloqueado) return;

    const contenido = `
ELANVISUAL — Propuesta IA

Negocio: ${resultadoAI.cliente.negocio || 'No indicado'}
WhatsApp: ${resultadoAI.cliente.whatsapp}
Producto: ${resultadoAI.producto.nombre}
Categoria: ${resultadoAI.producto.categoria}
Precio base: ${resultadoAI.producto.precio > 0 ? moneyUSD(resultadoAI.producto.precio) : 'Consultar'}
Medida base: ${resultadoAI.perfil.medidaBase}
Acabado base: ${resultadoAI.perfil.acabadoBase}

Idea del cliente:
${resultadoAI.cliente.idea || 'No indicada'}

Nota:
Esta es una propuesta conceptual generada por ELAN AI. La digitalizacion final, archivos de produccion, vectorizacion, ajustes tecnicos y preparacion para fabricacion se realizan al confirmar el pedido con ELANVISUAL.
`;

    const blob = new Blob([contenido], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `propuesta-elanvisual-${resultadoAI.id}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const productoBase = productoAI;
  const perfilActivo = productoBase ? obtenerPerfilIA(productoBase) : null;
  const whatsappNormalizado = normalizarWhatsapp(formAI.whatsapp);
  const usoWhatsapp = obtenerUsoNumero(whatsappNormalizado);
  const disponibles = Math.max(AI_DESIGN_LIMIT - usoWhatsapp, 0);

  return (
    <main className="catalog-page">
      <section className="store-ai-banner">
        <div className="store-ai-copy">
          <span className="store-ai-badge">
            <Sparkles size={15} />
            NUEVO
          </span>

          <h1>Diseña tu rótulo</h1>

          <p>
            Elige un modelo, carga tu idea y recibe una propuesta visual basada en
            presupuestos predefinidos de ELANVISUAL.
          </p>

          <button type="button" className="store-ai-button" onClick={() => abrirAI(null)}>
            <Sparkles size={20} />
            Crear mi diseño con IA
            <ArrowRight size={22} />
          </button>
        </div>

        <div className="store-ai-flow" aria-label="Flujo de propuesta con IA">
          <div className="store-ai-step">
            <strong>1. Modelo</strong>
            <p>Selecciona el tipo de rotulo con precio base definido.</p>
          </div>

          <ArrowRight className="store-ai-arrow" size={28} />

          <div className="store-ai-step store-ai-preview">
            <strong>2. Propuesta IA</strong>
            <div className="store-ai-mockup">
              <Sparkles size={24} />
              <span>Render conceptual</span>
            </div>
          </div>

          <ArrowRight className="store-ai-arrow" size={28} />

          <div className="store-ai-step">
            <strong>3. Seguimiento</strong>
            <ul>
              <li><CheckCircle2 size={17} /> WhatsApp obligatorio</li>
              <li><CheckCircle2 size={17} /> Maximo 3 diseños</li>
              <li><CheckCircle2 size={17} /> Seguimiento 2, 7 y 15 dias</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="catalog-tools">
        {categoriaActiva ? (
          <button type="button" className="filter-label" onClick={volverCategorias}>
            <ArrowLeft size={18} />
            Categorias
          </button>
        ) : null}

        {categoriaActiva ? (
          <div className="search-box">
            <Search size={18} />
            <input
              placeholder="Buscar producto dentro de esta categoria..."
              value={busqueda}
              onChange={(event) => setBusqueda(event.target.value)}
            />
          </div>
        ) : null}

        <button type="button" className="filter-label" onClick={() => setPage?.('carrito')}>
          <ShoppingCart size={18} />
          Ver carrito
          {cantidadCarrito > 0 ? ` (${cantidadCarrito})` : ''}
        </button>
      </section>

      {!categoriaActiva && (
        <div className="product-grid">
          {categorias.map((categoria) => (
            <button
              type="button"
              className="product-card"
              key={categoria.slug}
              onClick={() => abrirCategoria(categoria.slug)}
              style={{ textAlign: 'left', cursor: 'pointer' }}
            >
              <div className="product-image-wrap">
                <img
                  className="product-image"
                  src={categoria.imagen || imagenFallback}
                  alt={categoria.nombre}
                  loading="lazy"
                />
              </div>

              <div className="product-body">
                <h3>{categoria.nombre}</h3>
                <p>{categoria.cantidad} producto(s)</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {categoriaActiva && (
        <div className="product-grid">
          {productosFiltrados.map((producto) => (
            <article className="product-card" key={producto.id}>
              <div className="product-image-wrap">
                <img
                  className="product-image"
                  src={producto.imagen}
                  alt={producto.nombre}
                  loading="lazy"
                />
              </div>

              <div className="product-body">
                <h3>{producto.nombre}</h3>

                <strong className="price">
                  {producto.precio > 0 ? `Desde ${moneyUSD(producto.precio)}` : 'Consultar'}
                </strong>

                <button
                  type="button"
                  className="product-main-action"
                  onClick={() => abrirAI(producto)}
                >
                  <PackageSearch size={18} />
                  Personalizar
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {!categoriaActiva && categorias.length === 0 && (
        <section className="panel empty-catalog">
          <p className="note">
            Agrega productos activos y asignales una Categoria Home desde el panel administrativo.
          </p>
        </section>
      )}

      {categoriaActiva && productosFiltrados.length === 0 && (
        <section className="panel empty-catalog">
          <h2>No hay productos disponibles</h2>
          <p className="note">
            Agrega productos activos en esta categoria desde el panel administrativo.
          </p>
        </section>
      )}

      {modalAI && (
        <section className="ai-model-modal" role="dialog" aria-modal="true">
          <div className="ai-model-card">
            <button type="button" className="ai-model-close" onClick={cerrarAI}>
              <X size={22} />
            </button>

            <div className="ai-model-head">
              <span>
                <Wand2 size={18} />
                ELAN AI Designer
              </span>
              <h2>
                {productoBase
                  ? `Personaliza ${productoBase.nombre}`
                  : 'Selecciona un modelo para iniciar'}
              </h2>
              <p>
                La IA trabaja sobre el modelo elegido, mantiene el acabado base y respeta
                el presupuesto inicial registrado.
              </p>
            </div>

            {!productoBase && (
              <div className="ai-model-grid">
                {modelosAI.map((producto) => (
                  <button
                    type="button"
                    key={producto.id}
                    className="ai-model-option"
                    onClick={() => setProductoAI(producto)}
                  >
                    <img src={producto.imagen} alt={producto.nombre} />
                    <strong>{producto.nombre}</strong>
                    <small>
                      {producto.precio > 0 ? `Desde ${moneyUSD(producto.precio)}` : 'Consultar'}
                    </small>
                  </button>
                ))}
              </div>
            )}

            {productoBase && (
              <div className="ai-builder-grid">
                <aside className="ai-selected-model">
                  <img src={productoBase.imagen} alt={productoBase.nombre} />
                  <h3>{productoBase.nombre}</h3>
                  <strong>
                    {productoBase.precio > 0 ? `Desde ${moneyUSD(productoBase.precio)}` : 'Consultar'}
                  </strong>
                  <p>{perfilActivo?.medidaBase}</p>
                  <small>{perfilActivo?.acabadoBase}</small>
                </aside>

                <div className="ai-builder-form">
                  <label>
                    Nombre del negocio
                    <input
                      value={formAI.negocio}
                      onChange={(event) => actualizarFormAI('negocio', event.target.value)}
                      placeholder="Ej. Café Central"
                    />
                  </label>

                  <label>
                    WhatsApp obligatorio
                    <div className="ai-phone-row">
                      <Phone size={18} />
                      <input
                        value={formAI.whatsapp}
                        onChange={(event) => actualizarFormAI('whatsapp', event.target.value)}
                        placeholder="+505 8888 8888"
                      />
                    </div>
                  </label>

                  <div className="ai-usage-pill">
                    Diseños disponibles para este numero: {disponibles} de {AI_DESIGN_LIMIT}
                  </div>

                  <label>
                    Describe tu idea
                    <textarea
                      value={formAI.idea}
                      onChange={(event) => actualizarFormAI('idea', event.target.value)}
                      placeholder="Quiero algo elegante, moderno, con luz calida y acabado premium."
                    />
                  </label>

                  <div className="ai-upload-row">
                    <label>
                      <Upload size={18} />
                      Logo o arte
                      <input
                        type="file"
                        accept=".png,.jpg,.jpeg,.webp,.svg,.pdf,.ai,.eps"
                        onChange={(event) =>
                          actualizarFormAI('logoNombre', event.target.files?.[0]?.name || '')
                        }
                      />
                    </label>

                    <label>
                      <Upload size={18} />
                      Foto del lugar
                      <input
                        type="file"
                        accept=".png,.jpg,.jpeg,.webp"
                        onChange={(event) =>
                          actualizarFormAI('lugarNombre', event.target.files?.[0]?.name || '')
                        }
                      />
                    </label>
                  </div>

                  <button type="button" className="ai-generate-btn" onClick={generarPropuestaAI}>
                    <Sparkles size={20} />
                    Generar propuesta IA
                  </button>

                  {resultadoAI?.bloqueado && (
                    <div className="ai-result-box warning">
                      <h3>Limite alcanzado</h3>
                      <p>
                        Este numero ya utilizo sus 3 propuestas gratuitas. Para continuar,
                        debe contactar a ELANVISUAL para realizar el pedido y la
                        digitalizacion profesional del diseño.
                      </p>
                      <button type="button">
                        <MessageCircle size={18} />
                        Contactar por WhatsApp
                      </button>
                    </div>
                  )}

                  {resultadoAI && !resultadoAI.bloqueado && (
                    <div className="ai-result-box">
                      <h3>Propuesta registrada</h3>
                      <p>
                        Se guardo la solicitud. La propuesta usa el perfil maestro:
                        <strong> {resultadoAI.perfil.nombre}</strong>.
                      </p>
                      <ul>
                        <li>Seguimiento dia 2</li>
                        <li>Seguimiento dia 7</li>
                        <li>Ultimo seguimiento dia 15</li>
                      </ul>
                      <button type="button" onClick={descargarResumenAI}>
                        <Download size={18} />
                        Descargar resumen
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>
      )}
    </main>
  );
}
