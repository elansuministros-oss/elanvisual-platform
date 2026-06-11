
import CotizadorInterno from'../admin/CotizadorInterno.jsx';import{useElan}from'../../core/context/ElanContext.jsx';
export function VendorDashboard(){const{s}= {s:useElan()};return <main><h1>Panel vendedor</h1><div className="kpis"><div className="kpi"><b>{s.leads.length}</b><span>Leads</span></div><div className="kpi"><b>{s.cotizaciones.length}</b><span>Cotizaciones</span></div><div className="kpi"><b>{s.comisiones.length}</b><span>Comisiones</span></div></div></main>}
export function VendorQR(){return <main><h1>Mi QR único</h1><section className="card"><p>URL asignada:</p><h2>https://elanvisual.com/v/V001</h2><div className="qrbox">V001</div><p>El vendedor puede compartirlo, pero no eliminarlo ni modificarlo.</p></section></main>}
export function VendorCotizador(){return <CotizadorInterno modo="vendedor"/>}
export function VendorSimple({titulo}){return <main><h1>{titulo}</h1><section className="card"><p>Vista limitada del vendedor. No muestra costos, utilidad ni proveedores internos.</p></section></main>}
