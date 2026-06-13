import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useElan } from '../../core/context/ElanContext.jsx';
import CrudTable from '../../components/CrudTable.jsx';
import {
  leerEventosCRM,
  configurarBridge,
} from '../../core/bridge/CentralBridge.js';

import ClientesCRM from '../../CRM/Clientes.jsx';
import InventarioCRM from '../../CRM/Inventario.jsx';
import MaterialesCRM from '../../CRM/Materiales.jsx';
import SeguimientoCRM from '../../CRM/Seguimiento.jsx';
import UsuariosPermisosCRM from '../../CRM/UsuariosPermisos.jsx';
import ConsumoMaterialesCRM from '../../CRM/ConsumoMateriales.jsx';
import ListaCostosCRM from '../../CRM/ListaCostos.jsx';
import FormulasCostoCRM from '../../CRM/FormulasCosto.jsx';
import CotizacionesCRM from '../../CRM/Cotizaciones.jsx';
import PedidosCRM from '../../CRM/Pedidos.jsx';
import OrdenesTrabajoCRM from '../../CRM/OrdenesTrabajo.jsx';
import ProduccionCRM from '../../CRM/Produccion.jsx';
import ComisionesCRM from '../../CRM/Comisiones.jsx';

const STORAGE_KEY = 'elanvisual_state_v2';

function leerEstadoStorage() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

function actualizarBannersStorage(nuevosBanners) {
  const actual = leerEstadoStorage();

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      ...actual,
      banners: nuevosBanners,
    })
  );

  window.dispatchEvent(new Event('elanvisual:banners-updated'));
}

function obtenerImagenMedia(item = {}) {
  return item.imagen || item.imagenMobile || item.imagenDesktop || item.url || item.src || item.archivo || '';
}

function normalizarBanner(banner = {}) {
  const desktop =
    banner.imagenDesktop ||
    banner.desktop ||
    banner.imagen ||
    banner.url ||
    banner.src ||
    '';

  const mobile =
    banner.imagenMobile ||
    banner.mobile ||
    banner.imagen ||
    desktop ||
    '';

  return {
    ...banner,
    id: banner.id || `ban-${Date.now()}`,
    titulo: banner.titulo || '',
    subtitulo: banner.subtitulo || '',
    boton: banner.boton || 'Ver Catálogo',
    enlace: banner.enlace || '/catalogo',
    imagen: desktop || mobile,
    imagenDesktop: desktop,
    imagenMobile: mobile,
    estado: banner.estado || 'Inactivo',
    orden: Number(banner.orden || 1),
  };
}

export function Dashboard() {
  const s = useElan();

  const materialesCriticos = (s.inventario || []).filter(
    (item) => Number(item.existencia || 0) <= Number(item.stockMinimo || 0)
  ).length;

  const kpis = [
    ['📦', 'Productos', s.productos?.length || 0, '/admin/productos'],
    ['👥', 'Clientes', s.clientes?.length || 0, '/admin/clientes'],
    ['🧾', 'Cotizaciones', s.cotizaciones?.length || 0, '/admin/cotizaciones'],
    ['🛒', 'Pedidos', s.pedidos?.length || 0, '/admin/pedidos'],
    ['🏭', 'Producción', s.producciones?.length || 0, '/admin/produccion'],
    ['📦', 'Inventario', s.inventario?.length || 0, '/admin/inventario'],
    ['⚠️', 'Materiales críticos', materialesCriticos, '/admin/inventario'],
    ['💳', 'Pagos pendientes', (s.pagos || []).filter((p) => p.estado === 'Pendiente').length, '/admin/pagos'],
  ];

  const accesos = [
    ['📦', 'Productos', '/admin/productos'],
    ['👥', 'Clientes', '/admin/clientes'],
    ['🧾', 'Cotizaciones', '/admin/cotizaciones'],
    ['🛒', 'Pedidos', '/admin/pedidos'],
    ['🏭', 'Producción', '/admin/produccion'],
    ['🖼️', 'Multimedia', '/admin/multimedia'],
  ];

  return (
    <main className="mobile-dashboard">
      <style>{`
        .mobile-dashboard {
          display: grid;
          gap: 22px;
        }

        .dash-hero {
          padding: 22px;
          border-radius: 28px;
          background: linear-gradient(145deg, #101826, #1f2d44);
          color: #fff;
          box-shadow: 0 16px 36px rgba(0,0,0,.25);
        }

        .dash-hero h1 {
          margin: 0 0 8px;
          font-size: 34px;
          line-height: 1.05;
        }

        .dash-hero p {
          margin: 0;
          color: #cbd5e1;
          font-size: 19px;
          font-weight: 700;
        }

        .dash-kpis {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 16px;
        }

        .dash-kpi {
          min-height: 132px;
          padding: 18px;
          border-radius: 24px;
          background: #ffffff;
          color: #172033;
          text-decoration: none;
          display: grid;
          align-content: center;
          gap: 8px;
          box-shadow: 0 10px 26px rgba(15,23,42,.10);
          border: 1px solid rgba(15,23,42,.08);
        }

        .dash-kpi-icon {
          font-size: 30px;
        }

        .dash-kpi b {
          font-size: 34px;
          line-height: 1;
        }

        .dash-kpi span {
          font-size: 16px;
          font-weight: 900;
          color: #475467;
        }

        .dash-section {
          padding: 20px;
          border-radius: 28px;
          background: #ffffff;
          box-shadow: 0 10px 26px rgba(15,23,42,.10);
          border: 1px solid rgba(15,23,42,.08);
        }

        .dash-section h2 {
          margin: 0 0 16px;
          font-size: 26px;
        }

        .dash-shortcuts {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
        }

        .dash-shortcut {
          min-height: 120px;
          padding: 16px;
          border-radius: 22px;
          background: #101826;
          color: #ffffff;
          text-decoration: none;
          display: grid;
          place-items: center;
          text-align: center;
          gap: 8px;
          font-size: 18px;
          font-weight: 900;
        }

        .dash-shortcut strong {
          font-size: 34px;
        }

        @media (max-width: 760px) {
          .mobile-dashboard {
            gap: 18px;
          }

          .dash-hero {
            padding: 22px;
            border-radius: 26px;
          }

          .dash-hero h1 {
            font-size: 32px !important;
          }

          .dash-hero p {
            font-size: 19px;
          }

          .dash-kpis {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 14px;
          }

          .dash-kpi {
            min-height: 132px;
            border-radius: 22px;
          }

          .dash-kpi b {
            font-size: 36px;
          }

          .dash-kpi span {
            font-size: 17px;
          }

          .dash-shortcuts {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .dash-shortcut {
            min-height: 118px;
            font-size: 18px;
          }
        }
      `}</style>

      <section className="dash-hero">
        <h1>¡Buenos días! 👋</h1>
        <p>Resumen general de ELANVISUAL para trabajo operativo en campo.</p>
      </section>

      <section className="dash-kpis">
        {kpis.map(([icono, label, valor, link]) => (
          <Link className="dash-kpi" to={link} key={label}>
            <div className="dash-kpi-icon">{icono}</div>
            <b>{valor}</b>
            <span>{label}</span>
          </Link>
        ))}
      </section>

      <section className="dash-section">
        <h2>Accesos rápidos</h2>
        <div className="dash-shortcuts">
          {accesos.map(([icono, label, link]) => (
            <Link className="dash-shortcut" to={link} key={label}>
              <strong>{icono}</strong>
              {label}
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}

export function Clientes() { return <ClientesCRM />; }
export function Inventario() { return <InventarioCRM />; }
export function Materiales() { return <MaterialesCRM />; }
export function SeguimientoAdmin() { return <SeguimientoCRM />; }
export function UsuariosPermisos() { return <UsuariosPermisosCRM />; }
export function ConsumoMateriales() { return <ConsumoMaterialesCRM />; }
export function ListaCostos() { return <ListaCostosCRM />; }
export function FormulasCosto() { return <FormulasCostoCRM />; }
export function Cotizaciones() { return <CotizacionesCRM />; }
export function Pedidos() { return <PedidosCRM />; }
export function Ordenes() { return <OrdenesTrabajoCRM />; }
export function OrdenesTrabajo() { return <OrdenesTrabajoCRM />; }
export function Produccion() { return <ProduccionCRM />; }
export function Comisiones() { return <ComisionesCRM />; }

export function Productos() {
  const { productos } = useElan();

  return (
    <CrudTable
      title="Productos"
      rows={productos}
      fields={[
        { key: 'categoria', label: 'Categoría' },
        { key: 'subcategoria', label: 'Subcategoría' },
        { key: 'nombre', label: 'Producto' },
        { key: 'tipo', label: 'Tipo' },
        { key: 'precioVenta', label: 'Precio' },
      ]}
    />
  );
}

export function Categorias() {
  const { categorias } = useElan();

  return (
    <CrudTable
      title="Categorías"
      rows={categorias}
      fields={[
        { key: 'nombre', label: 'Categoría' },
        { key: 'subcategorias', label: 'Subcategorías' },
        { key: 'estado', label: 'Estado' },
      ]}
    />
  );
}

export function Proveedores() {
  const { proveedores } = useElan();

  return (
    <CrudTable
      title="Proveedores"
      rows={proveedores}
      fields={[
        { key: 'nombre', label: 'Nombre' },
        { key: 'tipo', label: 'Tipo' },
        { key: 'productosAsociados', label: 'Productos' },
        { key: 'estado', label: 'Estado' },
      ]}
    />
  );
}

export function Vendedores() {
  const { vendedores } = useElan();

  return (
    <CrudTable
      title="Vendedores"
      rows={vendedores}
      fields={[
        { key: 'nombre', label: 'Nombre' },
        { key: 'codigo', label: 'Código' },
        { key: 'comision', label: 'Comisión %' },
        { key: 'estado', label: 'Estado' },
      ]}
    />
  );
}

export function Leads() {
  const { leads } = useElan();

  return (
    <CrudTable
      title="Leads"
      rows={leads}
      fields={[
        { key: 'codigo', label: 'Código' },
        { key: 'cliente', label: 'Cliente' },
        { key: 'producto', label: 'Producto' },
        { key: 'estado', label: 'Estado' },
        { key: 'fecha', label: 'Fecha' },
      ]}
    />
  );
}

export function Pagos() {
  const { pagos, validarPago } = useElan();

  return (
    <section className="card">
      <h2>Validación de pagos</h2>

      {pagos.length === 0 ? (
        <p>No hay pagos registrados.</p>
      ) : (
        pagos.map((p) => (
          <div className="line" key={p.id}>
            <b>{p.codigo || p.id}</b>
            <span>C$ {Number(p.monto || 0).toFixed(2)}</span>
            <span>{p.estado}</span>

            {p.estado !== 'Validado' && (
              <button onClick={() => validarPago(p)}>Validar pago</button>
            )}
          </div>
        ))
      )}
    </section>
  );
}

export function Banners() {
  const {
    banners = [],
    multimedia = [],
    guardarBanner,
    eliminarBanner,
    activarBanner,
  } = useElan();

  const bannersStorage = leerEstadoStorage().banners || [];
  const baseBanners = banners.length ? banners : bannersStorage;

  const [lista, setLista] = useState((baseBanners || []).map(normalizarBanner));

  const [form, setForm] = useState({
    id: '',
    titulo: '',
    subtitulo: '',
    boton: 'Ver Catálogo',
    enlace: '/catalogo',
    imagen: '',
    imagenDesktop: '',
    imagenMobile: '',
    estado: 'Activo',
    orden: 1,
  });

  useEffect(() => {
    const fuente = banners.length ? banners : leerEstadoStorage().banners || [];
    setLista((fuente || []).map(normalizarBanner));
  }, [banners]);

  const imagenesDesktop = useMemo(
    () =>
      multimedia.filter((m) => {
        const categoria = m.categoria || '';
        return (
          m.estado === 'Activo' &&
          ['Banner Desktop', 'Banner', 'General'].includes(categoria) &&
          obtenerImagenMedia(m)
        );
      }),
    [multimedia]
  );

  const imagenesMobile = useMemo(
    () =>
      multimedia.filter((m) => {
        const categoria = m.categoria || '';
        return (
          m.estado === 'Activo' &&
          ['Banner Mobile', 'Banner', 'General'].includes(categoria) &&
          obtenerImagenMedia(m)
        );
      }),
    [multimedia]
  );

  function sincronizar(nuevaLista) {
    const normalizada = nuevaLista
      .map(normalizarBanner)
      .sort((a, b) => Number(a.orden || 0) - Number(b.orden || 0));

    setLista(normalizada);
    actualizarBannersStorage(normalizada);
  }

  function limpiar() {
    setForm({
      id: '',
      titulo: '',
      subtitulo: '',
      boton: 'Ver Catálogo',
      enlace: '/catalogo',
      imagen: '',
      imagenDesktop: '',
      imagenMobile: '',
      estado: 'Activo',
      orden: lista.length + 1,
    });
  }

  function guardar() {
    if (!form.titulo.trim()) {
      alert('Escribí el título del banner.');
      return;
    }

    if (!form.imagenDesktop && !form.imagenMobile && !form.imagen) {
      alert('Seleccioná imagen Desktop y Mobile desde Multimedia.');
      return;
    }

    const desktop = form.imagenDesktop || form.imagen || form.imagenMobile || '';
    const mobile = form.imagenMobile || desktop;

    const bannerGuardado = normalizarBanner({
      ...form,
      id: form.id || `ban-${Date.now()}`,
      titulo: form.titulo.trim(),
      subtitulo: form.subtitulo.trim(),
      boton: form.boton.trim() || 'Ver Catálogo',
      enlace: form.enlace.trim() || '/catalogo',
      imagen: desktop,
      imagenDesktop: desktop,
      imagenMobile: mobile,
      estado: form.estado || 'Activo',
      orden: Number(form.orden || lista.length + 1),
    });

    let nuevaLista = form.id
      ? lista.map((b) => (b.id === form.id ? bannerGuardado : b))
      : [...lista, bannerGuardado];

    if (bannerGuardado.estado === 'Activo') {
      nuevaLista = nuevaLista.map((b) => ({
        ...b,
        estado: b.id === bannerGuardado.id ? 'Activo' : 'Inactivo',
      }));
    }

    sincronizar(nuevaLista);

    if (typeof guardarBanner === 'function') {
      guardarBanner(bannerGuardado);
    }

    limpiar();
    alert('Banner guardado correctamente.');
  }

  function editar(banner) {
    const b = normalizarBanner(banner);
    setForm({
      id: b.id,
      titulo: b.titulo,
      subtitulo: b.subtitulo,
      boton: b.boton,
      enlace: b.enlace,
      imagen: b.imagen,
      imagenDesktop: b.imagenDesktop,
      imagenMobile: b.imagenMobile,
      estado: b.estado,
      orden: Number(b.orden || 1),
    });
  }

  function activar(id) {
    const nuevaLista = lista.map((b) => ({
      ...b,
      estado: b.id === id ? 'Activo' : 'Inactivo',
    }));

    sincronizar(nuevaLista);

    if (typeof activarBanner === 'function') {
      activarBanner(id);
    }
  }

  function eliminar(id) {
    if (!confirm('¿Eliminar este banner?')) return;

    const nuevaLista = lista.filter((b) => b.id !== id);
    sincronizar(nuevaLista);

    if (typeof eliminarBanner === 'function') {
      eliminarBanner(id);
    }
  }

  const listaOrdenada = lista
    .slice()
    .sort((a, b) => Number(a.orden || 0) - Number(b.orden || 0));

  const previewDesktop = form.imagenDesktop || form.imagen;
  const previewMobile = form.imagenMobile || form.imagenDesktop || form.imagen;

  return (
    <main className="banner-admin">
      <style>{`
        .banner-admin {
          display: grid;
          gap: 20px;
        }

        .banner-form {
          display: grid;
          gap: 16px;
        }

        .banner-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .banner-field {
          display: grid;
          gap: 8px;
        }

        .banner-field label {
          font-weight: 900;
        }

        .banner-actions {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .banner-preview {
          display: grid;
          gap: 10px;
        }

        .banner-preview img {
          width: 100%;
          border-radius: 18px;
          border: 1px solid #e6e9ef;
          object-fit: cover;
        }

        .banner-preview-mobile img {
          max-width: 390px;
          max-height: 520px;
        }

        .banner-item {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 14px;
          padding: 16px;
          border-radius: 18px;
          border: 1px solid #e6e9ef;
          background: #fff;
          margin-bottom: 14px;
        }

        .banner-item-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        @media (max-width: 760px) {
          .banner-grid,
          .banner-item {
            grid-template-columns: 1fr;
          }

          .banner-actions,
          .banner-item-actions {
            flex-direction: column;
          }

          .banner-actions button,
          .banner-item-actions button {
            width: 100%;
          }

          .banner-preview-mobile img {
            max-width: 100%;
            max-height: none;
          }
        }
      `}</style>

      <h1>Banners principales</h1>

      <section className="card banner-form">
        <h2>{form.id ? 'Editar banner' : 'Nuevo banner'}</h2>

        <div className="banner-field">
          <label>Título principal</label>
          <input
            placeholder="Ej: Todo para la imagen de tu negocio"
            value={form.titulo}
            onChange={(e) => setForm({ ...form, titulo: e.target.value })}
          />
        </div>

        <div className="banner-field">
          <label>Subtítulo</label>
          <input
            placeholder="Ej: Rotulación, impresión digital y soluciones visuales"
            value={form.subtitulo}
            onChange={(e) => setForm({ ...form, subtitulo: e.target.value })}
          />
        </div>

        <div className="banner-grid">
          <div className="banner-field">
            <label>Texto del botón</label>
            <input
              value={form.boton}
              onChange={(e) => setForm({ ...form, boton: e.target.value })}
            />
          </div>

          <div className="banner-field">
            <label>Enlace</label>
            <input
              value={form.enlace}
              onChange={(e) => setForm({ ...form, enlace: e.target.value })}
            />
          </div>
        </div>

        <div className="banner-grid">
          <div className="banner-field">
            <label>Imagen Desktop</label>
            <select
              value={form.imagenDesktop}
              onChange={(e) =>
                setForm({
                  ...form,
                  imagenDesktop: e.target.value,
                  imagen: e.target.value || form.imagen,
                })
              }
            >
              <option value="">Seleccionar imagen desktop</option>
              {imagenesDesktop.map((m) => (
                <option key={m.id} value={obtenerImagenMedia(m)}>
                  {m.nombre || m.titulo || m.id}
                </option>
              ))}
            </select>
          </div>

          <div className="banner-field">
            <label>Imagen Mobile</label>
            <select
              value={form.imagenMobile}
              onChange={(e) =>
                setForm({
                  ...form,
                  imagenMobile: e.target.value,
                })
              }
            >
              <option value="">Seleccionar imagen mobile</option>
              {imagenesMobile.map((m) => (
                <option key={m.id} value={obtenerImagenMedia(m)}>
                  {m.nombre || m.titulo || m.id}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="banner-grid">
          <div className="banner-field">
            <label>Estado</label>
            <select
              value={form.estado}
              onChange={(e) => setForm({ ...form, estado: e.target.value })}
            >
              <option>Activo</option>
              <option>Inactivo</option>
            </select>
          </div>

          <div className="banner-field">
            <label>Orden</label>
            <input
              type="number"
              value={form.orden}
              onChange={(e) => setForm({ ...form, orden: e.target.value })}
            />
          </div>
        </div>

        {previewDesktop && (
          <div className="banner-preview">
            <label>Vista Desktop</label>
            <img src={previewDesktop} alt="Vista previa desktop" />
          </div>
        )}

        {previewMobile && (
          <div className="banner-preview banner-preview-mobile">
            <label>Vista Mobile</label>
            <img src={previewMobile} alt="Vista previa mobile" />
          </div>
        )}

        <div className="banner-actions">
          <button type="button" onClick={guardar}>Guardar banner</button>
          <button type="button" onClick={limpiar}>Limpiar</button>
        </div>
      </section>

      <section className="card">
        <h2>Banners registrados</h2>

        {listaOrdenada.length === 0 ? (
          <p>No hay banners registrados.</p>
        ) : (
          listaOrdenada.map((b) => (
            <div className="banner-item" key={b.id}>
              <div>
                <b>{b.titulo}</b>
                {b.subtitulo && <p>{b.subtitulo}</p>}
                <p>Estado: {b.estado} · Orden: {b.orden || 1}</p>
              </div>

              <div className="banner-item-actions">
                <button type="button" onClick={() => editar(b)}>Editar</button>
                <button type="button" onClick={() => activar(b.id)}>Activar único</button>
                <button type="button" onClick={() => eliminar(b.id)}>Eliminar</button>
              </div>
            </div>
          ))
        )}
      </section>
    </main>
  );
}

export function SimpleAdmin({ titulo }) {
  return (
    <main>
      <h1>{titulo}</h1>
      <section className="card">
        <p>
          Módulo operativo inicial. Listo para conectar formularios avanzados
          desde administración sin cambiar arquitectura.
        </p>
      </section>
    </main>
  );
}

export function Configuracion() {
  const { bancos } = useElan();

  return (
    <CrudTable
      title="Datos bancarios"
      rows={bancos}
      fields={[
        { key: 'banco', label: 'Banco' },
        { key: 'titular', label: 'Titular' },
        { key: 'numero', label: 'Cuenta' },
        { key: 'moneda', label: 'Moneda' },
        { key: 'estado', label: 'Estado' },
      ]}
    />
  );
}

export function CRM() {
  const [modo, setModo] = useState(
    localStorage.getItem('elanvisual_bridge_mode') || 'local'
  );

  const [endpoint, setEndpoint] = useState(
    localStorage.getItem('elanvisual_bridge_endpoint') || ''
  );

  const eventos = leerEventosCRM();

  return (
    <main>
      <h1>CRM Central Bridge</h1>

      <section className="card form">
        <select value={modo} onChange={(e) => setModo(e.target.value)}>
          <option>local</option>
          <option>api</option>
        </select>

        <input
          placeholder="Endpoint API futuro"
          value={endpoint}
          onChange={(e) => setEndpoint(e.target.value)}
        />

        <button onClick={() => configurarBridge({ modo, endpoint })}>
          Guardar bridge
        </button>
      </section>

      <section className="card">
        <h2>Eventos emitidos</h2>

        {eventos.length === 0 ? (
          <p>No hay eventos registrados.</p>
        ) : (
          eventos.map((e, i) => (
            <p key={i}>
              {e.fecha} · {e.nombre}
            </p>
          ))
        )}
      </section>
    </main>
  );
}