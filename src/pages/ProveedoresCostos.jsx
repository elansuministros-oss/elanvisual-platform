import React, { useEffect, useMemo, useState } from 'react';
import { Edit3, PlusCircle, Save, Search, Star, Truck, Trash2, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  obtenerProveedores,
  crearProveedor as crearProveedorHub,
  actualizarProveedor as actualizarProveedorHub,
  eliminarProveedor as eliminarProveedorHub,
} from '../services/supplierHubService';

const money = (v) =>
  new Intl.NumberFormat('es-NI', { style: 'currency', currency: 'USD' }).format(Number(v || 0));

const inicialProveedor = {
  nombre: '',
  razonSocial: '',
  ruc: '',
  contacto: '',
  cargoContacto: '',
  whatsapp: '',
  telefonoAlterno: '',
  correo: '',
  sitioWeb: '',
  direccion: '',
  departamento: '',
  municipio: '',
  zonaCobertura: '',
  ubicacion: '',
  categoria: 'Impresión',
  subcategorias: '',
  aceptaCredito: 'No',
  diasCredito: 0,
  moneda: 'USD',
  tiempoEntrega: '',
  capacidad: '',
  condicionesPago: '',
  observaciones: '',
  calidad: 5,
  cumplimiento: 5,
  precio: 5,
  tiempo: 5,
  preferido: false,
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

const categorias = [
  'Impresión',
  'Suministros',
  'Displays',
  'PVC / Acrílico',
  'CNC / Láser',
  'Instalación',
  'Metal / Estructuras',
  'Electricidad / LED',
  'Transporte',
  'Otro',
];

const departamentos = [
  '',
  'Managua',
  'Chinandega',
  'León',
  'Masaya',
  'Granada',
  'Carazo',
  'Rivas',
  'Estelí',
  'Matagalpa',
  'Jinotega',
  'Boaco',
  'Chontales',
  'Nueva Segovia',
  'Madriz',
  'Río San Juan',
  'RAAN',
  'RAAS',
];

function promedioProveedor(p = {}) {
  const nums = [p.calidad, p.cumplimiento, p.precio, p.tiempo].map((v) => Number(v || 0));
  const total = nums.reduce((a, b) => a + b, 0);
  return total > 0 ? total / nums.length : 0;
}

function normalizarProveedor(datos = {}) {
  return {
    ...inicialProveedor,
    ...datos,
    calidad: Number(datos.calidad || 5),
    cumplimiento: Number(datos.cumplimiento || 5),
    precio: Number(datos.precio || 5),
    tiempo: Number(datos.tiempo || 5),
    diasCredito: Number(datos.diasCredito || 0),
    preferido: datos.preferido === true,
    activo: datos.activo !== false,
  };
}

export default function ProveedoresCostos() {
  const {
    usuario,
    proveedores = [],
    productosProveedor = [],
    crearProveedor,
    actualizarProveedor,
    eliminarProveedor: eliminarProveedorLocal,
    crearProductoProveedor,
    eliminarProductoProveedor,
  } = useApp();

  const [proveedoresHub, setProveedoresHub] = useState([]);
  const [cargandoHub, setCargandoHub] = useState(false);
  const [proveedor, setProveedor] = useState(inicialProveedor);
  const [producto, setProducto] = useState(inicialProducto);
  const [busqueda, setBusqueda] = useState('');
  const [editandoId, setEditandoId] = useState(null);

  const esAdmin = usuario?.rol === 'admin';

  const cargarSupplierHub = async () => {
    setCargandoHub(true);
    try {
      const data = await obtenerProveedores();
      setProveedoresHub(data);
    } catch (error) {
      console.error('Supplier Hub no pudo cargar proveedores:', error);
      setProveedoresHub([]);
    } finally {
      setCargandoHub(false);
    }
  };

  useEffect(() => {
    if (esAdmin) cargarSupplierHub();
  }, [esAdmin]);

  const proveedoresActivos = proveedoresHub.length > 0 ? proveedoresHub : proveedores;

  const lista = useMemo(() => {
    const t = busqueda.toLowerCase();
    return proveedoresActivos.filter((p) =>
      `${p.nombre} ${p.razonSocial || ''} ${p.categoria} ${p.subcategorias || ''} ${p.contacto} ${p.whatsapp} ${p.departamento || ''} ${p.municipio || ''} ${p.zonaCobertura || ''} ${p.ubicacion || ''}`
        .toLowerCase()
        .includes(t)
    );
  }, [proveedoresActivos, busqueda]);

  const actualizarCampo = (campo, valor) => {
    setProveedor((prev) => ({ ...prev, [campo]: valor }));
  };

  const limpiarProveedor = () => {
    setProveedor(inicialProveedor);
    setEditandoId(null);
  };

  const refrescarProveedores = async () => {
    await cargarSupplierHub();
  };

  const editarProveedor = (p) => {
    setProveedor(normalizarProveedor(p));
    setEditandoId(p.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const eliminarProveedor = async (id) => {
    if (!id) return;

    const ok = window.confirm('¿Eliminar este proveedor del Supplier Hub? Esta acción no se puede deshacer.');
    if (!ok) return;

    try {
      await eliminarProveedorHub(id);
      setProveedoresHub((prev) => prev.filter((p) => p.id !== id));
      await refrescarProveedores();

      if (editandoId === id) {
        limpiarProveedor();
      }

      alert('Proveedor eliminado de Supabase.');
    } catch (error) {
      console.error('Error eliminando proveedor en Supabase:', error);

      alert(
        JSON.stringify(
          {
            message: error?.message,
            details: error?.details,
            hint: error?.hint,
            code: error?.code,
          },
          null,
          2
        )
      );
    }
  };
  const guardarProveedor = async (e) => {
    e.preventDefault();
    if (!proveedor.nombre.trim()) return alert('Indicá nombre del proveedor.');

    const datos = normalizarProveedor({
      ...proveedor,
      categoria: proveedor.categoria || 'Impresión | Corte CNC | Producción Digital',
      subcategorias:
        proveedor.subcategorias ||
        'Impresión Digital Gran Formato, Impresión Digital Láser, Corte CNC, Corte PVC, Corte Acrílico, Corte MDF, Corte ACM, Lonas, Vinil Adhesivo, Vinil Microperforado, Roll Up, Material POP, Señalización, Producción Publicitaria, Fabricación de piezas para rotulación',
      observaciones:
        proveedor.observaciones ||
        'Proveedor técnico estratégico para Compras. RUC pendiente. ELAN AI no debe usar precios de proveedor para cotizaciones comerciales; solo para OC cuando exista OT aprobada.',
      activo: proveedor.activo !== false,
    });

    try {
      if (editandoId) {
        await actualizarProveedorHub(editandoId, datos);
        actualizarProveedor?.({ ...datos, id: editandoId });
      } else {
        await crearProveedorHub(datos);
      }

      const actualizados = await obtenerProveedores();
      setProveedoresHub(actualizados);

      setProveedor(inicialProveedor);
      setEditandoId(null);
      alert('Proveedor guardado en Supabase.');
    } catch (error) {
      console.error('Error guardando proveedor en Supabase:', error);
      alert('No se pudo guardar el proveedor en Supabase.');
    }
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
        <span>ELANVISUAL · CRM CENTRAL</span>
        <h1>Proveedores Corporativos</h1>
        <p>Red privada por zona, categoría, costos reales, tiempos de entrega y capacidad operativa.</p>
      </section>

      <section className="proveedor-grid">
        <form className="proveedor-card proveedor-form" onSubmit={guardarProveedor}>
          <div className="form-head">
            <h2>{editandoId ? 'Editar proveedor' : 'Nuevo proveedor'}</h2>
            {editandoId && (
              <button type="button" className="ghost-btn" onClick={limpiarProveedor}>
                <X size={18} />
                Cancelar
              </button>
            )}
          </div>

          <div className="section-title">Información general</div>
          <div className="two">
            <label>Proveedor<input value={proveedor.nombre} onChange={(e)=>actualizarCampo('nombre', e.target.value)} /></label>
            <label>Razón social<input value={proveedor.razonSocial} onChange={(e)=>actualizarCampo('razonSocial', e.target.value)} /></label>
          </div>

          <div className="two">
            <label>RUC<input value={proveedor.ruc} onChange={(e)=>actualizarCampo('ruc', e.target.value)} /></label>
            <label>Categoría principal<select value={proveedor.categoria} onChange={(e)=>actualizarCampo('categoria', e.target.value)}>
              {categorias.map((c)=><option key={c}>{c}</option>)}
            </select></label>
          </div>

          <label>Subcategorías<input value={proveedor.subcategorias} onChange={(e)=>actualizarCampo('subcategorias', e.target.value)} placeholder="Lona, vinil, PVC, roll up, CNC..." /></label>

          <div className="section-title">Contacto</div>
          <div className="two">
            <label>Contacto principal<input value={proveedor.contacto} onChange={(e)=>actualizarCampo('contacto', e.target.value)} /></label>
            <label>Cargo<input value={proveedor.cargoContacto} onChange={(e)=>actualizarCampo('cargoContacto', e.target.value)} /></label>
          </div>

          <div className="two">
            <label>WhatsApp<input value={proveedor.whatsapp} onChange={(e)=>actualizarCampo('whatsapp', e.target.value)} /></label>
            <label>Teléfono alterno<input value={proveedor.telefonoAlterno} onChange={(e)=>actualizarCampo('telefonoAlterno', e.target.value)} /></label>
          </div>

          <div className="two">
            <label>Correo<input value={proveedor.correo} onChange={(e)=>actualizarCampo('correo', e.target.value)} /></label>
            <label>Sitio web<input value={proveedor.sitioWeb} onChange={(e)=>actualizarCampo('sitioWeb', e.target.value)} /></label>
          </div>

          <div className="section-title">Ubicación y cobertura</div>
          <label>Dirección<input value={proveedor.direccion} onChange={(e)=>actualizarCampo('direccion', e.target.value)} /></label>

          <div className="three">
            <label>Departamento<select value={proveedor.departamento} onChange={(e)=>actualizarCampo('departamento', e.target.value)}>
              {departamentos.map((d)=><option key={d}>{d || 'Seleccionar'}</option>)}
            </select></label>
            <label>Municipio<input value={proveedor.municipio} onChange={(e)=>actualizarCampo('municipio', e.target.value)} /></label>
            <label>Zona / cobertura<input value={proveedor.zonaCobertura} onChange={(e)=>actualizarCampo('zonaCobertura', e.target.value)} placeholder="Occidente, Managua, nacional..." /></label>
          </div>

          <label>Ubicación corta<input value={proveedor.ubicacion} onChange={(e)=>actualizarCampo('ubicacion', e.target.value)} placeholder="Referencia rápida" /></label>

          <div className="section-title">Condiciones comerciales</div>
          <div className="three">
            <label>Acepta crédito<select value={proveedor.aceptaCredito} onChange={(e)=>actualizarCampo('aceptaCredito', e.target.value)}>
              <option>No</option>
              <option>Sí</option>
            </select></label>
            <label>Días crédito<input type="number" value={proveedor.diasCredito} onChange={(e)=>actualizarCampo('diasCredito', e.target.value)} /></label>
            <label>Moneda<select value={proveedor.moneda} onChange={(e)=>actualizarCampo('moneda', e.target.value)}>
              <option>USD</option>
              <option>C$</option>
            </select></label>
          </div>

          <div className="two">
            <label>Tiempo promedio entrega<input value={proveedor.tiempoEntrega} onChange={(e)=>actualizarCampo('tiempoEntrega', e.target.value)} /></label>
            <label>Capacidad producción<input value={proveedor.capacidad} onChange={(e)=>actualizarCampo('capacidad', e.target.value)} placeholder="Baja, media, alta, por volumen..." /></label>
          </div>

          <label>Condiciones de pago<textarea value={proveedor.condicionesPago} onChange={(e)=>actualizarCampo('condicionesPago', e.target.value)} /></label>
          <label>Observaciones<textarea value={proveedor.observaciones} onChange={(e)=>actualizarCampo('observaciones', e.target.value)} /></label>

          <div className="section-title">Evaluación</div>
          <div className="four">
            <label>Calidad<input type="number" min="1" max="5" value={proveedor.calidad} onChange={(e)=>actualizarCampo('calidad', e.target.value)} /></label>
            <label>Cumplimiento<input type="number" min="1" max="5" value={proveedor.cumplimiento} onChange={(e)=>actualizarCampo('cumplimiento', e.target.value)} /></label>
            <label>Precio<input type="number" min="1" max="5" value={proveedor.precio} onChange={(e)=>actualizarCampo('precio', e.target.value)} /></label>
            <label>Tiempo<input type="number" min="1" max="5" value={proveedor.tiempo} onChange={(e)=>actualizarCampo('tiempo', e.target.value)} /></label>
          </div>

          <div className="check-row">
            <label><input type="checkbox" checked={proveedor.preferido} onChange={(e)=>actualizarCampo('preferido', e.target.checked)} /> Proveedor preferido</label>
            <label><input type="checkbox" checked={proveedor.activo} onChange={(e)=>actualizarCampo('activo', e.target.checked)} /> Activo</label>
          </div>

          <button className="primary-btn">
            {editandoId ? <Save size={18}/> : <PlusCircle size={18}/>}
            {editandoId ? 'Guardar cambios' : 'Crear proveedor'}
          </button>
        </form>

        <form className="proveedor-card" onSubmit={guardarProducto}>
          <h2>Producto / costo proveedor</h2>

          <label>Proveedor<select value={producto.proveedorId} onChange={(e)=>setProducto({...producto,proveedorId:e.target.value})}>
            <option value="">Seleccionar</option>
            {proveedoresActivos.filter((p)=>p.activo !== false).map((p)=><option key={p.id} value={p.id}>{p.nombre}</option>)}
          </select></label>

          <label>Producto / servicio<input value={producto.nombre} onChange={(e)=>setProducto({...producto,nombre:e.target.value})} placeholder="Roll Up 0.85x2, impresión lona, PVC 3mm..." /></label>

          <label>Categoría<select value={producto.categoria} onChange={(e)=>setProducto({...producto,categoria:e.target.value})}>
            <option>Impresión</option><option>Suministro</option><option>Display</option><option>Lámina</option><option>Corte</option><option>Instalación</option><option>Transporte</option>
          </select></label>

          <label>Unidad<select value={producto.unidad} onChange={(e)=>setProducto({...producto,unidad:e.target.value})}>
            <option>m2</option><option>unidad</option><option>metro lineal</option><option>lámina</option><option>viaje</option>
          </select></label>

          <label>Costo USD<input type="number" step="0.01" value={producto.costo} onChange={(e)=>setProducto({...producto,costo:e.target.value})} /></label>
          <label>Tiempo entrega<input value={producto.tiempoEntrega} onChange={(e)=>setProducto({...producto,tiempoEntrega:e.target.value})} /></label>

          <button className="primary-btn"><Save size={18}/> Guardar costo</button>
        </form>
      </section>

      <section className="proveedor-card"><p className="hub-status">{cargandoHub ? 'Cargando Supplier Hub...' : `Supplier Hub: ${proveedoresHub.length} proveedor(es) desde Supabase`}</p><div className="search-box"><Search size={18}/><input value={busqueda} onChange={(e)=>setBusqueda(e.target.value)} placeholder="Buscar por proveedor, zona, categoría, contacto..." /></div>
      </section>

      <section className="proveedor-list">
        {lista.map((p)=>{
          const productos = productosProveedor.filter((x)=>x.proveedorId===p.id);
          const promedio = promedioProveedor(p).toFixed(1);

          return (
            <article className={`proveedor-card proveedor-item ${p.activo === false ? 'inactive' : ''}`} key={p.id}>
              <div className="prov-head">
                <div>
                  <span>{p.categoria}</span>
                  <h2>{p.nombre}</h2>
                  <p>{p.contacto || 'Sin contacto'} · {p.whatsapp || 'Sin WhatsApp'}</p>
                </div>

                <div className="prov-actions">
                  <button className="edit-btn mini" type="button" onClick={()=>editarProveedor(p)}><Edit3 size={16}/></button>
                  <button className="danger-btn mini" type="button" onClick={()=>eliminarProveedor(p.id)}><Trash2 size={16}/></button>
                </div>
              </div>

              <div className="badges">
                {p.preferido && <span>Preferido</span>}
                <span>{p.activo === false ? 'Inactivo' : 'Activo'}</span>
                <span>{p.departamento || 'Sin departamento'}</span>
                <span>{p.municipio || 'Sin municipio'}</span>
              </div>

              <div className="prov-info">
                <p><b>Zona:</b> {p.zonaCobertura || p.ubicacion || 'No definida'}</p>
                <p><b>Entrega:</b> {p.tiempoEntrega || 'Por confirmar'}</p>
                <p><b>Crédito:</b> {p.aceptaCredito || 'No'} {Number(p.diasCredito || 0) > 0 ? `· ${p.diasCredito} días` : ''}</p>
                <p><b>Correo:</b> {p.correo || 'No registrado'}</p>
                <p><b>Dirección:</b> {p.direccion || 'No registrada'}</p>
              </div>

              <div className="rating-box">
                <Star size={18} />
                <strong>{promedio}/5</strong>
                <small>Calidad {p.calidad} · Cumplimiento {p.cumplimiento} · Precio {p.precio} · Tiempo {p.tiempo}</small>
              </div>

              {p.observaciones && <p className="observacion">{p.observaciones}</p>}

              <div className="costos-list">
                {productos.map((x)=>(
                  <div className="costo-row" key={x.id}>
                    <b>{x.nombre}</b>
                    <span>{money(x.costo)} / {x.unidad}</span>
                    <small>{x.categoria} · Entrega: {x.tiempoEntrega || p.tiempoEntrega || 'Por confirmar'}</small>
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
        .proveedor-grid{display:grid;grid-template-columns:1.25fr .75fr;gap:14px;align-items:start}
        .form-head{display:flex;justify-content:space-between;gap:10px;align-items:center}
        .section-title{margin:18px 0 10px;padding:8px 12px;border-radius:999px;background:#f8fafc;color:#334155;font-weight:950;font-size:12px;text-transform:uppercase}
        .two{display:grid;grid-template-columns:1fr 1fr;gap:10px}
        .three{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
        .four{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
        label{display:grid;gap:7px;font-weight:900;color:#334155;margin-bottom:12px}
        input,select,textarea{width:100%;border:1px solid #cbd5e1;border-radius:16px;padding:13px;font-size:16px;background:#fff}
        textarea{min-height:88px;resize:vertical}
        .check-row{display:flex;gap:14px;flex-wrap:wrap;margin:10px 0}.check-row label{display:flex;align-items:center;gap:8px;margin:0}.check-row input{width:auto}
        .primary-btn,.danger-btn,.edit-btn,.ghost-btn{border:0;border-radius:18px;padding:14px;font-weight:950;display:flex;gap:8px;align-items:center;justify-content:center;cursor:pointer}
        .primary-btn{background:#111827;color:white}.danger-btn{background:#fee2e2;color:#991b1b}.edit-btn{background:#e0f2fe;color:#075985}.ghost-btn{background:#f8fafc;color:#334155}
        .mini{width:46px;height:46px;padding:0}
        .search-box{display:flex;align-items:center;gap:8px}.search-box input{border:0}
        .proveedor-list{display:grid;grid-template-columns:repeat(auto-fit,minmax(310px,1fr));gap:14px}
        .proveedor-item.inactive{opacity:.62}
        .prov-head{display:flex;justify-content:space-between;gap:12px}.prov-head h2{margin:4px 0;color:#111827}.prov-actions{display:flex;gap:8px}
        .badges{display:flex;flex-wrap:wrap;gap:6px;margin:12px 0}.badges span{font-size:12px;font-weight:950;background:#eef2ff;color:#3730a3;border-radius:999px;padding:7px 10px}
        .prov-info{display:grid;gap:5px;margin:12px 0}.prov-info p{margin:0;color:#475569;font-weight:800;font-size:13px}
        .rating-box{display:grid;grid-template-columns:auto auto 1fr;gap:8px;align-items:center;background:#fffbeb;border:1px solid #fde68a;border-radius:16px;padding:10px;color:#92400e}
        .rating-box small{font-weight:800;color:#92400e}
        .observacion{background:#f8fafc;border-left:4px solid #d4af37;border-radius:12px;padding:10px;color:#475569;font-weight:800}
        .costos-list{display:grid;gap:8px;margin-top:12px}.costo-row{background:#f8fafc;border:1px solid #e5e7eb;border-radius:16px;padding:12px;display:grid;gap:5px}
        .costo-row span{font-weight:950;color:#065f46}.costo-row small{color:#64748b;font-weight:800}.costo-row button{border:0;background:transparent;color:#991b1b;font-weight:900;text-align:left}
        .empty-mini{color:#64748b;font-weight:800}.hub-status{margin:0 0 10px;color:#0f766e;font-weight:950}
        .lock{text-align:center;margin:40px auto;max-width:420px}
        @media(max-width:900px){.proveedor-grid,.two,.three,.four{grid-template-columns:1fr}.proveedores-page{padding-bottom:90px}.form-head{align-items:flex-start;flex-direction:column}}
      `}</style>
    </main>
  );
}









