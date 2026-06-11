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