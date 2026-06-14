import React, { useMemo, useState } from 'react';
import { PlusCircle, Save, Search, Truck, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';

const money = (v) =>
  new Intl.NumberFormat('es-NI', { style: 'currency', currency: 'USD' }).format(Number(v || 0));

const inicialProveedor = {
  nombre: '',
  categoria: 'Impresión',
  whatsapp: '',
  contacto: '',
  ubicacion: '',
  tiempoEntrega: '',
  calidad: 5,
  activo: true,
};

const inicialProducto = {
  proveedorId: '',
  nombre: '',
  categoria: 'Impresión',
  unidad: 'm2',
  costo: '',
  tiempoEntrega: '',
};

export default function ProveedoresCostos() {
  const {
    usuario,
    proveedores = [],
    productosProveedor = [],
    crearProveedor,
    eliminarProveedor,
    crearProductoProveedor,
    eliminarProductoProveedor,
  } = useApp();

  const [proveedor, setProveedor] = useState(inicialProveedor);
  const [producto, setProducto] = useState(inicialProducto);
  const [busqueda, setBusqueda] = useState('');

  const esAdmin = usuario?.rol === 'admin';

  const lista = useMemo(() => {
    const t = busqueda.toLowerCase();
    return proveedores.filter((p) =>
      `${p.nombre} ${p.categoria} ${p.contacto} ${p.ubicacion}`.toLowerCase().includes(t)
    );
  }, [proveedores, busqueda]);

  const guardarProveedor = (e) => {
    e.preventDefault();
    if (!proveedor.nombre.trim()) return alert('Indicá nombre del proveedor.');
    crearProveedor(proveedor);
    setProveedor(inicialProveedor);
  };

  const guardarProducto = (e) => {
    e.preventDefault();
    if (!producto.proveedorId) return alert('Seleccioná proveedor.');
    if (!producto.nombre.trim()) return alert('Indicá producto/servicio.');
    crearProductoProveedor(producto);
    setProducto(inicialProducto);
  };

  if (!esAdmin) {
    return (
      <main className="proveedores-page">
        <section className="proveedor-card lock">
          <Truck size={42} />
          <h1>Acceso privado</h1>
          <p>Proveedores, costos reales e inventario son solo para administración.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="proveedores-page">
      <section className="proveedor-hero">
        <span>ELANVISUAL · COSTO REAL</span>
        <h1>Proveedores e Inventario</h1>
        <p>Catálogo privado para recotizar, comparar costos reales y alimentar utilidad real.</p>
      </section>

      <section className="proveedor-grid">
        <form className="proveedor-card" onSubmit={guardarProveedor}>
          <h2>Nuevo proveedor</h2>
          <label>Nombre<input value={proveedor.nombre} onChange={(e)=>setProveedor({...proveedor,nombre:e.target.value})} /></label>
          <label>Categoría<select value={proveedor.categoria} onChange={(e)=>setProveedor({...proveedor,categoria:e.target.value})}>
            <option>Impresión</option><option>Suministros</option><option>Displays</option><option>CNC</option><option>Acrílico/PVC</option><option>Instalación</option>
          </select></label>
          <label>WhatsApp<input value={proveedor.whatsapp} onChange={(e)=>setProveedor({...proveedor,whatsapp:e.target.value})} /></label>
          <label>Contacto<input value={proveedor.contacto} onChange={(e)=>setProveedor({...proveedor,contacto:e.target.value})} /></label>
          <label>Ubicación<input value={proveedor.ubicacion} onChange={(e)=>setProveedor({...proveedor,ubicacion:e.target.value})} /></label>
          <label>Tiempo entrega<input value={proveedor.tiempoEntrega} onChange={(e)=>setProveedor({...proveedor,tiempoEntrega:e.target.value})} /></label>
          <button className="primary-btn"><PlusCircle size={18}/> Crear proveedor</button>
        </form>

        <form className="proveedor-card" onSubmit={guardarProducto}>
          <h2>Producto / costo proveedor</h2>
          <label>Proveedor<select value={producto.proveedorId} onChange={(e)=>setProducto({...producto,proveedorId:e.target.value})}>
            <option value="">Seleccionar</option>
            {proveedores.map((p)=><option key={p.id} value={p.id}>{p.nombre}</option>)}
          </select></label>
          <label>Producto / servicio<input value={producto.nombre} onChange={(e)=>setProducto({...producto,nombre:e.target.value})} placeholder="Roll Up 0.85x2, impresión lona, PVC 3mm..." /></label>
          <label>Categoría<select value={producto.categoria} onChange={(e)=>setProducto({...producto,categoria:e.target.value})}>
            <option>Impresión</option><option>Suministro</option><option>Display</option><option>Lámina</option><option>Corte</option><option>Instalación</option>
          </select></label>
          <label>Unidad<select value={producto.unidad} onChange={(e)=>setProducto({...producto,unidad:e.target.value})}>
            <option>m2</option><option>unidad</option><option>metro lineal</option><option>lámina</option>
          </select></label>
          <label>Costo USD<input type="number" step="0.01" value={producto.costo} onChange={(e)=>setProducto({...producto,costo:e.target.value})} /></label>
          <label>Tiempo entrega<input value={producto.tiempoEntrega} onChange={(e)=>setProducto({...producto,tiempoEntrega:e.target.value})} /></label>
          <button className="primary-btn"><Save size={18}/> Guardar costo</button>
        </form>
      </section>

      <section className="proveedor-card">
        <div className="search-box"><Search size={18}/><input value={busqueda} onChange={(e)=>setBusqueda(e.target.value)} placeholder="Buscar proveedor..." /></div>
      </section>

      <section className="proveedor-list">
        {lista.map((p)=>{
          const productos = productosProveedor.filter((x)=>x.proveedorId===p.id);
          return (
            <article className="proveedor-card" key={p.id}>
              <div className="prov-head">
                <div><span>{p.categoria}</span><h2>{p.nombre}</h2><p>{p.contacto} · {p.whatsapp}</p></div>
                <button className="danger-btn mini" onClick={()=>eliminarProveedor(p.id)}><Trash2 size={16}/></button>
              </div>
              <small>{p.ubicacion} · Entrega: {p.tiempoEntrega || 'Por confirmar'}</small>
              <div className="costos-list">
                {productos.map((x)=>(
                  <div className="costo-row" key={x.id}>
                    <b>{x.nombre}</b>
                    <span>{money(x.costo)} / {x.unidad}</span>
                    <button onClick={()=>eliminarProductoProveedor(x.id)}>Eliminar</button>
                  </div>
                ))}
                {productos.length===0 && <p className="empty-mini">Sin costos registrados.</p>}
              </div>
            </article>
          );
        })}
      </section>

      <style>{`
        .proveedores-page{padding:14px;display:grid;gap:14px;background:#f4f6fb;min-height:100vh}
        .proveedor-hero,.proveedor-card{background:#fff;border-radius:24px;padding:18px;box-shadow:0 14px 35px rgba(15,23,42,.08)}
        .proveedor-hero span,.prov-head span{font-size:12px;font-weight:950;color:#b48722;text-transform:uppercase}
        .proveedor-hero h1{margin:8px 0;font-size:30px;color:#111827}
        .proveedor-hero p,.prov-head p{margin:0;color:#64748b;font-weight:800}
        .proveedor-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}
        label{display:grid;gap:7px;font-weight:900;color:#334155;margin-bottom:12px}
        input,select{width:100%;border:1px solid #cbd5e1;border-radius:16px;padding:13px;font-size:16px}
        .primary-btn,.danger-btn{border:0;border-radius:18px;padding:14px;font-weight:950;display:flex;gap:8px;align-items:center;justify-content:center}
        .primary-btn{background:#111827;color:white}.danger-btn{background:#fee2e2;color:#991b1b}.mini{width:46px;height:46px;padding:0}
        .search-box{display:flex;align-items:center;gap:8px}.search-box input{border:0}
        .proveedor-list{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:14px}
        .prov-head{display:flex;justify-content:space-between;gap:12px}.prov-head h2{margin:4px 0;color:#111827}
        .costos-list{display:grid;gap:8px;margin-top:12px}.costo-row{background:#f8fafc;border:1px solid #e5e7eb;border-radius:16px;padding:12px;display:grid;gap:5px}
        .costo-row span{font-weight:950;color:#065f46}.costo-row button{border:0;background:transparent;color:#991b1b;font-weight:900;text-align:left}
        .empty-mini{color:#64748b;font-weight:800}
        .lock{text-align:center;margin:40px auto;max-width:420px}
        @media(max-width:760px){.proveedor-grid{grid-template-columns:1fr}.proveedores-page{padding-bottom:90px}}
      `}</style>
    </main>
  );
}
