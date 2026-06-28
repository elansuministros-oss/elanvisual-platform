import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Download,
  PackageSearch,
  Phone,
  Search,
  ShoppingCart,
  Sparkles,
  Upload,
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

const PAISES_WHATSAPP = [
  { codigo: 'NI', nombre: 'Nicaragua', bandera: '🇳🇮', prefijo: '+505' },
  { codigo: 'CR', nombre: 'Costa Rica', bandera: '🇨🇷', prefijo: '+506' },
  { codigo: 'HN', nombre: 'Honduras', bandera: '🇭🇳', prefijo: '+504' },
  { codigo: 'SV', nombre: 'El Salvador', bandera: '🇸🇻', prefijo: '+503' },
  { codigo: 'GT', nombre: 'Guatemala', bandera: '🇬🇹', prefijo: '+502' },
  { codigo: 'PA', nombre: 'Panama', bandera: '🇵🇦', prefijo: '+507' },
  { codigo: 'MX', nombre: 'Mexico', bandera: '🇲🇽', prefijo: '+52' },
  { codigo: 'US', nombre: 'Estados Unidos', bandera: '🇺🇸', prefijo: '+1' },
];

const PAIS_WHATSAPP_DEFAULT = PAISES_WHATSAPP[0];

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
  const [generandoAI, setGenerandoAI] = useState(false);
  const [formAI, setFormAI] = useState({
    negocio: '',
    paisWhatsapp: PAIS_WHATSAPP_DEFAULT.codigo,
    whatsapp: '',
    idea: '',
    logoNombre: '',
    lugarNombre: '',
    logoDataUrl: '',
    lugarDataUrl: '',
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

  const leerArchivoComoDataUrl = (file) => {
    return new Promise((resolve) => {
      if (!file) return resolve('');
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  };

  const generarPropuestaAI = async () => {
    const paisWhatsapp = PAISES_WHATSAPP.find((pais) => pais.codigo === formAI.paisWhatsapp) || PAIS_WHATSAPP_DEFAULT;
    const whatsappLocal = normalizarWhatsapp(formAI.whatsapp).replace(/^\+/, '');
    const whatsapp = paisWhatsapp.prefijo + whatsappLocal;

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

    setGenerandoAI(true);

    let renderBase64 = '';
    let respuestaRender = '';

    try {
      const response = await fetch('https://elankav-core.vercel.app/api/elan-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: 'render-botones',
          whatsapp,
          producto: 'botones',
          modelo: productoAI.codigo || productoAI.slug || productoAI.id || 'boton-transparente',
          cliente: {
            negocio: formAI.negocio,
            whatsapp,
            idea: formAI.idea,
          },
          contexto: {
            medidaBase: perfil.medidaBase || '60 x 60 cm',
            perfilNombre: perfil.nombre,
          },
          archivos_temporales: [
            formAI.logoDataUrl
              ? { nombre: formAI.logoNombre || 'logo', dataUrl: formAI.logoDataUrl }
              : null,
            formAI.lugarDataUrl
              ? { nombre: formAI.lugarNombre || 'foto-lugar', dataUrl: formAI.lugarDataUrl }
              : null,
          ].filter(Boolean),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || 'No se pudo generar el render.');
      }

      renderBase64 = data.render_base64 || '';
      respuestaRender = data.respuesta || '';
    } catch (error) {
      alert(error?.message || 'Error generando render.');
      setGenerandoAI(false);
      return;
    }

    setGenerandoAI(false);

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
      renderBase64,
      respuestaRender,
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
  const paisWhatsappActivo = PAISES_WHATSAPP.find((pais) => pais.codigo === formAI.paisWhatsapp) || PAIS_WHATSAPP_DEFAULT;
  const whatsappLocalActivo = normalizarWhatsapp(formAI.whatsapp).replace(/^\+/, '');
  const whatsappNormalizado = whatsappLocalActivo ? paisWhatsappActivo.prefijo + whatsappLocalActivo : '';
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
        <section className="ai-chat-modal" role="dialog" aria-modal="true">
          <div className="ai-chat-card">
            <button type="button" className="ai-chat-close" onClick={cerrarAI}>
              <X size={22} />
            </button>

            <div className="ai-chat-head">
              <span><Sparkles size={18} /> ELAN AI Botones</span>
              <h2>{productoBase?.nombre || 'Diseña tu botón luminoso'}</h2>
              <p>
                {productoBase?.precio > 0 ? `Desde ${moneyUSD(productoBase.precio)} · ` : ''}
                {perfilActivo?.medidaBase || '60 x 60 cm'}
              </p>
            </div>

            <div className="ai-chat-body">
              <div className="ai-chat-message ai-bot">
                Sube tu logo, escribe tu idea y deja tu WhatsApp. Haré una propuesta basada únicamente en este modelo.
              </div>

              <label className="ai-chat-field ai-chat-phone-field">
                <select
                  className="ai-country-select"
                  value={formAI.paisWhatsapp}
                  onChange={(event) => actualizarFormAI('paisWhatsapp', event.target.value)}
                  aria-label="Pais WhatsApp"
                >
                  {PAISES_WHATSAPP.map((pais) => (
                    <option key={pais.codigo} value={pais.codigo}>
                      {pais.bandera} {pais.prefijo}
                    </option>
                  ))}
                </select>
                <input
                  value={formAI.whatsapp}
                  onChange={(event) => actualizarFormAI('whatsapp', event.target.value)}
                  placeholder="WhatsApp obligatorio"
                  inputMode="tel"
                />
              </label>

              <label className="ai-chat-field">
                <input
                  value={formAI.negocio}
                  onChange={(event) => actualizarFormAI('negocio', event.target.value)}
                  placeholder="Nombre del negocio"
                />
              </label>

              <label className="ai-chat-upload">
                <Upload size={20} />
                {formAI.logoNombre || 'Cargar logo o imagen'}
                <input
                  type="file"
                  accept=".png,.jpg,.jpeg,.webp,.svg,.pdf,.ai,.eps"
                  onChange={(event) =>
                    actualizarFormAI('logoNombre', event.target.files?.[0]?.name || '')
                  }
                />
              </label>

              <textarea
                className="ai-chat-textarea"
                value={formAI.idea}
                onChange={(event) => actualizarFormAI('idea', event.target.value)}
                placeholder="Describe tu idea. Ej: Quiero un botón elegante, dorado espejo, luz cálida y fondo transparente."
              />

              <button type="button" className="ai-chat-generate" onClick={generarPropuestaAI}>
                <Sparkles size={20} />
                Generar render
              </button>

              {resultadoAI?.bloqueado && (
                <div className="ai-chat-result warning">
                  <h3>Límite alcanzado</h3>
                  <p>Este WhatsApp ya usó sus 3 diseños gratuitos. Contacta a ELANVISUAL para pedido y digitalización profesional.</p>
                </div>
              )}

              {resultadoAI && !resultadoAI.bloqueado && (
                <div className="ai-chat-result">
                  <h3>Render solicitado</h3>
                  <p>La solicitud quedó guardada con el maestro ELAN AI Botones.</p>

                  {resultadoAI.renderBase64 ? (
                    <img
                      className="ai-render-preview"
                      src={`data:image/png;base64,${resultadoAI.renderBase64}`}
                      alt="Render generado por ELAN AI"
                    />
                  ) : null}
                  <button type="button" onClick={descargarResumenAI}>
                    <Download size={18} />
                    Descargar resumen
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}












