
import{useElan}from'../../core/context/ElanContext.jsx';
export function ProductionDashboard(){const{ordenes}=useElan();return <main><h1>Dashboard producción</h1><div className="kpis"><div className="kpi"><b>{ordenes.length}</b><span>Órdenes activas</span></div></div></main>}
export function ProductionOrders(){const{ordenes,actualizarEstadoOT,estadosProduccion}=useElan();return <section className="card"><h2>Órdenes de producción</h2>{ordenes.map(o=><div className="line" key={o.id}><b>{o.codigo}</b><select value={o.estado} onChange={e=>actualizarEstadoOT(o.id,e.target.value)}>{estadosProduccion.map(s=><option key={s}>{s}</option>)}</select></div>)}</section>}
export function ProductionSimple({titulo}){return <main><h1>{titulo}</h1><section className="card"><p>Área operativa para inventario, entregas e instalaciones.</p></section></main>}
