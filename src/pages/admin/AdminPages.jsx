import { useState } from 'react';
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

function actualizarBannersStorage(nuevosBanners) {
  const actual = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      ...actual,
      banners: nuevosBanners,
    })
  );
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
  const { banners, multimedia = [] } = useElan();

  const [lista, setLista] = useState(banners || []);

  const [form, setForm] = useState({
    id: '',
    titulo: '',
    subtitulo: '',
    boton: 'Ver Catálogo',
    enlace: '/catalogo',
    imagen: '',
    estado: 'Activo',
    orden: 1,
  });

  const imagenesBanner = multimedia.filter(
    (m) =>
      m.estado === 'Activo' &&
      (m.categoria === 'Banner' || m.categoria === 'General')
  );

  function sincronizar(nuevaLista) {
    setLista(nuevaLista);
    actualizarBannersStorage(nuevaLista);
  }

  function limpiar() {
    setForm({
      id: '',
      titulo: '',
      subtitulo: '',
      boton: 'Ver Catálogo',
      enlace: '/catalogo',
      imagen: '',
      estado: 'Activo',
      orden: lista.length + 1,
    });
  }

  function guardar() {
    if (!form.titulo.trim()) {
      alert('Escribí el título del banner.');
      return;
    }

    if (!form.imagen.trim()) {
      alert('Seleccioná una imagen desde Multimedia.');
      return;
    }

    const bannerGuardado = {
      ...form,
      titulo: form.titulo.trim(),
      subtitulo: form.subtitulo.trim(),
      boton: form.boton.trim() || 'Ver Catálogo',
      enlace: form.enlace.trim() || '/catalogo',
      imagen: form.imagen.trim(),
      estado: form.estado || 'Activo',
      orden: Number(form.orden || 1),
    };

    const nuevaLista = form.id
      ? lista.map((b) => (b.id === form.id ? bannerGuardado : b))
      : [
          ...lista,
          {
            ...bannerGuardado,
            id: `ban-${Date.now()}`,
          },
        ];

    sincronizar(nuevaLista);
    limpiar();

    alert('Banner guardado. Recargá el Home para verlo aplicado.');
  }

  function editar(banner) {
    setForm({
      id: banner.id || '',
      titulo: banner.titulo || '',
      subtitulo: banner.subtitulo || '',
      boton: banner.boton || 'Ver Catálogo',
      enlace: banner.enlace || '/catalogo',
      imagen: banner.imagen || '',
      estado: banner.estado || 'Activo',
      orden: Number(banner.orden || 1),
    });
  }

  function activar(id) {
    const nuevaLista = lista.map((b) => ({
      ...b,
      estado: b.id === id ? 'Activo' : 'Inactivo',
    }));

    sincronizar(nuevaLista);
    alert('Banner activado. Recargá el Home para verlo.');
  }

  function cambiarEstado(id) {
    const nuevaLista = lista.map((b) =>
      b.id === id
        ? {
            ...b,
            estado: b.estado === 'Activo' ? 'Inactivo' : 'Activo',
          }
        : b
    );

    sincronizar(nuevaLista);
  }

  function eliminar(id) {
    if (!confirm('¿Eliminar este banner?')) return;

    const nuevaLista = lista.filter((b) => b.id !== id);
    sincronizar(nuevaLista);
  }

  const listaOrdenada = lista
    .slice()
    .sort((a, b) => Number(a.orden || 0) - Number(b.orden || 0));

  return (
    <main>
      <h1>Banners principales</h1>

      <section className="card form">
        <h2>{form.id ? 'Editar banner' : 'Nuevo banner'}</h2>

        <input
          placeholder="Título principal"
          value={form.titulo}
          onChange={(e) => setForm({ ...form, titulo: e.target.value })}
        />

        <input
          placeholder="Subtítulo"
          value={form.subtitulo}
          onChange={(e) => setForm({ ...form, subtitulo: e.target.value })}
        />

        <input
          placeholder="Texto del botón"
          value={form.boton}
          onChange={(e) => setForm({ ...form, boton: e.target.value })}
        />

        <input
          placeholder="Enlace del botón. Ej: /catalogo"
          value={form.enlace}
          onChange={(e) => setForm({ ...form, enlace: e.target.value })}
        />

        <label className="card">
          <b>Imagen desde Multimedia</b>

          <select
            value={form.imagen}
            onChange={(e) =>
              setForm({
                ...form,
                imagen: e.target.value,
              })
            }
          >
            <option value="">Seleccionar imagen</option>

            {imagenesBanner.map((m) => (
              <option key={m.id} value={m.imagen}>
                {m.nombre}
              </option>
            ))}
          </select>

          {imagenesBanner.length === 0 && (
            <p>
              No hay imágenes activas en Multimedia con categoría Banner o
              General.
            </p>
          )}
        </label>

        <select
          value={form.estado}
          onChange={(e) => setForm({ ...form, estado: e.target.value })}
        >
          <option>Activo</option>
          <option>Inactivo</option>
        </select>

        <input
          type="number"
          placeholder="Orden"
          value={form.orden}
          onChange={(e) => setForm({ ...form, orden: e.target.value })}
        />

        {form.imagen && (
          <img
            src={form.imagen}
            alt="Vista previa banner"
            style={{
              width: '100%',
              maxHeight: 260,
              objectFit: 'cover',
              borderRadius: 16,
            }}
          />
        )}

        {form.imagen && (
          <section
            style={{
              minHeight: '260px',
              borderRadius: '16px',
              overflow: 'hidden',
              backgroundImage: `linear-gradient(rgba(0,0,0,.55),rgba(0,0,0,.35)),url(${form.imagen})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              padding: '40px',
              color: '#fff',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}
          >
            <span>ELANVISUAL</span>

            <h2>{form.titulo || 'Título del banner'}</h2>

            <p>{form.subtitulo || 'Subtítulo del banner'}</p>

            <div>
              <button type="button">{form.boton || 'Ver catálogo'}</button>
            </div>
          </section>
        )}

        <button type="button" onClick={guardar}>
          Guardar banner
        </button>

        <button type="button" onClick={limpiar}>
          Limpiar
        </button>
      </section>

      <section className="card">
        <h2>Banners registrados</h2>

        {listaOrdenada.length === 0 ? (
          <p>No hay banners registrados.</p>
        ) : (
          listaOrdenada.map((b) => (
            <div className="line" key={b.id}>
              <b>{b.titulo}</b>
              <span>{b.estado}</span>
              <span>Orden {b.orden || 1}</span>

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