import { useElan } from '../../core/context/ElanContext.jsx';

import OrdenesTrabajoCRM from '../../CRM/OrdenesTrabajo.jsx';
import ProduccionCRM from '../../CRM/Produccion.jsx';

export function ProductionDashboard() {
  const { ordenes, producciones } = useElan();

  return (
    <main>
      <h1>Dashboard Producción</h1>

      <div className="kpis">
        <div className="kpi">
          <b>{ordenes.length}</b>
          <span>Órdenes activas</span>
        </div>

        <div className="kpi">
          <b>{producciones?.length || 0}</b>
          <span>Producción</span>
        </div>
      </div>
    </main>
  );
}

export function ProductionOrders() {
  return <OrdenesTrabajoCRM />;
}

export function ProductionTracking() {
  return <ProduccionCRM />;
}

export function ProductionSimple({ titulo }) {
  return (
    <main>
      <h1>{titulo}</h1>

      <section className="card">
        <p>
          Área operativa para inventario, fabricación,
          entregas e instalaciones.
        </p>
      </section>
    </main>
  );
}