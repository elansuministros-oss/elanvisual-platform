import { useEffect, useState } from 'react';
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

const formStyles = {
  grid: {
    display: 'grid',
    gap: '18px',
  },
  field: {
    display: 'grid',
    gap: '8px',
  },
  label: {
    fontWeight: 700,
    fontSize: '14px',
    color: '#172033',
  },
  row: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '18px',
  },
  actions: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px',
    marginTop: '6px',
  },
  bannerItem: {
    display: 'grid',
    gridTemplateColumns: '1fr auto',
    gap: '14px',
    alignItems: 'center',
    padding: '16px',
    border: '1px solid #e6e9ef',
    borderRadius: '16px',
    marginBottom: '14px',
    background: '#fff',
  },
  bannerMeta: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px',
    marginTop: '6px',
    fontSize: '13px',
    color: '#667085',
  },
  bannerActions: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px',
  },
};

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

function normalizarBanner(banner = {}) {
  const desktop =
    banner.imagenDesktop ||
    banner.desktop ||
    banner.imagen ||
    banner.url ||
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

function obtenerImagenMedia(item = {}) {
  return item.imagen || item.url || item.src || item.archivo || '';
}

export function Dashboard() {
  const s = useElan();

  const materialesCriticos = (s.inventario || []).filter(
    (item) => Number(item.existencia || 0) <= Number(item.stockMinimo || 0)
  ).length;

  return (
    <main>
      <h1>Dashboard ELANVISUAL</h1>

      <div className="kpis">
        {[
          ['Productos', s.productos.length],
          ['Clientes', s.clientes?.length || 0],
          ['Leads', s.leads.length],
          ['Cotizaciones', s.cotizaciones.length],
          ['Pedidos', s.pedidos.length],
          ['OT', s.ordenes.length],
          ['Producción', s.producciones?.length || 0],
          ['Inventario', s.inventario?.length || 0],
          ['Materiales críticos', materialesCriticos],
          ['Comisiones', s.comisiones.length],
          [
            'Pagos pendientes',
            s.pagos.filter((p) => p.estado === 'Pendiente').length,
          ],
        ].map((x) => (
          <div className="kpi" key={x[0]}>
            <b>{x[1]}</b>
            <span>{x[0]}</span>
          </div>
        ))}
      </div>
    </main>
  );
}

export function Clientes() {
  return <ClientesCRM />;
}

export function Inventario() {
  return <InventarioCRM />;
}

export function Materiales() {
  return <MaterialesCRM />;
}

export function SeguimientoAdmin() {
  return <SeguimientoCRM />;
}

export function UsuariosPermisos() {
  return <UsuariosPermisosCRM />;
}

export function ConsumoMateriales() {
  return <ConsumoMaterialesCRM />;
}

export function ListaCostos() {
  return <ListaCostosCRM />;
}

export function FormulasCosto() {
  return <FormulasCostoCRM />;
}

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

export function Cotizaciones() {
  return <CotizacionesCRM />;
}

export function Pedidos() {
  return <PedidosCRM />;
}

export function Ordenes() {
  return <OrdenesTrabajoCRM />;
}

export function OrdenesTrabajo() {
  return <OrdenesTrabajoCRM />;
}

export function Produccion() {
  return <ProduccionCRM />;
}

export function Comisiones() {
  return <ComisionesCRM />;
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

  const [lista, setLista] = useState(
    (baseBanners || []).map(normalizarBanner)
  );

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

  const imagenesDesktop = multimedia.filter((m) => {
    const categoria = m.categoria || '';
    return (
      m.estado === 'Activo' &&
      ['Banner Desktop', 'Banner', 'General'].includes(categoria) &&
      obtenerImagenMedia(m)
    );
  });

  const imagenesMobile = multimedia.filter((m) => {
    const categoria = m.categoria || '';
    return (
      m.estado === 'Activo' &&
      ['Banner Mobile', 'Banner', 'General'].includes(categoria) &&
      obtenerImagenMedia(m)
    );
  });

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

    if (
      !form.imagenDesktop.trim() &&
      !form.imagenMobile.trim() &&
      !form.imagen.trim()
    ) {
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

    alert('Banner activado como único principal.');
  }

  function cambiarEstado(id) {
    const banner = lista.find((b) => b.id === id);
    if (!banner) return;

    if (banner.estado !== 'Activo') {
      activar(id);
      return;
    }

    const nuevaLista = lista.map((b) =>
      b.id === id ? { ...b, estado: 'Inactivo' } : b
    );

    sincronizar(nuevaLista);
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
    <main>
      <h1>Banners principales</h1>

      <section className="card form" style={formStyles.grid}>
        <h2>{form.id ? 'Editar banner' : 'Nuevo banner'}</h2>

        <div style={formStyles.field}>
          <label style={formStyles.label}>Título principal</label>
          <input
            placeholder="Ej: Todo para la imagen de tu negocio"
            value={form.titulo}
            onChange={(e) => setForm({ ...form, titulo: e.target.value })}
          />
        </div>

        <div style={formStyles.field}>
          <label style={formStyles.label}>Subtítulo</label>
          <input
            placeholder="Ej: Rotulación, impresión digital y soluciones visuales"
            value={form.subtitulo}
            onChange={(e) => setForm({ ...form, subtitulo: e.target.value })}
          />
        </div>

        <div style={formStyles.row}>
          <div style={formStyles.field}>
            <label style={formStyles.label}>Texto del botón</label>
            <input
              placeholder="Ej: Ver Catálogo"
              value={form.boton}
              onChange={(e) => setForm({ ...form, boton: e.target.value })}
            />
          </div>

          <div style={formStyles.field}>
            <label style={formStyles.label}>Enlace del botón</label>
            <input
              placeholder="Ej: /catalogo"
              value={form.enlace}
              onChange={(e) => setForm({ ...form, enlace: e.target.value })}
            />
          </div>
        </div>

        <div style={formStyles.row}>
          <div style={formStyles.field}>
            <label style={formStyles.label}>Imagen Desktop</label>
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

            {imagenesDesktop.length === 0 && (
              <p>
                No hay imágenes activas en Multimedia con categoría Banner
                Desktop, Banner o General.
              </p>
            )}
          </div>

          <div style={formStyles.field}>
            <label style={formStyles.label}>Imagen Mobile</label>
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

            {imagenesMobile.length === 0 && (
              <p>
                No hay imágenes activas en Multimedia con categoría Banner
                Mobile, Banner o General.
              </p>
            )}
          </div>
        </div>

        <div style={formStyles.row}>
          <div style={formStyles.field}>
            <label style={formStyles.label}>Estado</label>
            <select
              value={form.estado}
              onChange={(e) => setForm({ ...form, estado: e.target.value })}
            >
              <option>Activo</option>
              <option>Inactivo</option>
            </select>
          </div>

          <div style={formStyles.field}>
            <label style={formStyles.label}>Orden</label>
            <input
              type="number"
              placeholder="Orden"
              value={form.orden}
              onChange={(e) => setForm({ ...form, orden: e.target.value })}
            />
          </div>
        </div>

        {previewDesktop && (
          <div style={formStyles.field}>
            <label style={formStyles.label}>Vista Desktop</label>
            <img
              src={previewDesktop}
              alt="Vista previa desktop"
              style={{
                width: '100%',
                maxHeight: 280,
                objectFit: 'cover',
                borderRadius: 16,
                border: '1px solid #e6e9ef',
              }}
            />
          </div>
        )}

        {previewMobile && (
          <div style={formStyles.field}>
            <label style={formStyles.label}>Vista Mobile</label>
            <img
              src={previewMobile}
              alt="Vista previa mobile"
              style={{
                width: '100%',
                maxWidth: 390,
                maxHeight: 520,
                objectFit: 'cover',
                borderRadius: 16,
                border: '1px solid #e6e9ef',
              }}
            />
          </div>
        )}

        <div style={formStyles.actions}>
          <button type="button" onClick={guardar}>
            Guardar banner
          </button>

          <button type="button" onClick={limpiar}>
            Limpiar
          </button>
        </div>
      </section>

      <section className="card">
        <h2>Banners registrados</h2>

        {listaOrdenada.length === 0 ? (
          <p>No hay banners registrados.</p>
        ) : (
          listaOrdenada.map((b) => (
            <div style={formStyles.bannerItem} key={b.id}>
              <div>
                <b>{b.titulo}</b>

                {b.subtitulo && <p>{b.subtitulo}</p>}

                <div style={formStyles.bannerMeta}>
                  <span>Estado: {b.estado}</span>
                  <span>Orden: {b.orden || 1}</span>
                  <span>Botón: {b.boton}</span>
                </div>
              </div>

              <div style={formStyles.bannerActions}>
                <button type="button" onClick={() => editar(b)}>
                  Editar
                </button>

                <button type="button" onClick={() => activar(b.id)}>
                  Activar único
                </button>

                <button type="button" onClick={() => cambiarEstado(b.id)}>
                  {b.estado === 'Activo' ? 'Desactivar' : 'Activar'}
                </button>

                <button type="button" onClick={() => eliminar(b.id)}>
                  Eliminar
                </button>
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