import fs from 'fs';

const ctxPath = 'src/context/AppContext.jsx';
const appPath = 'src/App.jsx';
const pedidosPath = 'src/pages/PedidosProduccion.jsx';
const provPath = 'src/pages/ProveedoresCostos.jsx';

/* =========================
   NUEVO MODULO PROVEEDORES
========================= */
fs.writeFileSync(provPath, `
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
      \`\${p.nombre} \${p.categoria} \${p.contacto} \${p.ubicacion}\`.toLowerCase().includes(t)
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

      <style>{\`
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
      \`}</style>
    </main>
  );
}
`.trim() + '\n', 'utf8');

/* =========================
   PATCH APPCONTEXT
========================= */
let ctx = fs.readFileSync(ctxPath, 'utf8');

if (!ctx.includes("elanvisual_proveedores_costos")) {
  ctx = ctx.replace(
    "const [supabaseListo, setSupabaseListo] = useState(false);",
    `const [supabaseListo, setSupabaseListo] = useState(false);
  const [proveedores, setProveedores] = useState(() => leerStorage('elanvisual_proveedores_costos', []));
  const [productosProveedor, setProductosProveedor] = useState(() => leerStorage('elanvisual_productos_proveedor', []));
  const [cotizacionesProveedor, setCotizacionesProveedor] = useState(() => leerStorage('elanvisual_cotizaciones_proveedor', []));`
  );

  ctx = ctx.replace(
    "useEffect(() => guardarStorage('elanvisual_usuarios', usuarios), [usuarios]);",
    `useEffect(() => guardarStorage('elanvisual_usuarios', usuarios), [usuarios]);
  useEffect(() => guardarStorage('elanvisual_proveedores_costos', proveedores), [proveedores]);
  useEffect(() => guardarStorage('elanvisual_productos_proveedor', productosProveedor), [productosProveedor]);
  useEffect(() => guardarStorage('elanvisual_cotizaciones_proveedor', cotizacionesProveedor), [cotizacionesProveedor]);`
  );

  ctx = ctx.replace(
    "const actualizarProducto = (producto) =>",
    `const crearProveedor = (datos) => {
    const nuevo = { ...datos, id: datos.id || \`prov-\${Date.now()}\`, activo: datos.activo !== false, creadoEn: new Date().toISOString() };
    setProveedores((prev) => [nuevo, ...prev]);
    return nuevo;
  };

  const eliminarProveedor = (id) => {
    setProveedores((prev) => prev.filter((p) => p.id !== id));
    setProductosProveedor((prev) => prev.filter((p) => p.proveedorId !== id));
  };

  const crearProductoProveedor = (datos) => {
    const proveedor = proveedores.find((p) => p.id === datos.proveedorId);
    const nuevo = {
      ...datos,
      id: datos.id || \`prov-prod-\${Date.now()}\`,
      proveedorNombre: proveedor?.nombre || '',
      costo: Number(datos.costo || 0),
      creadoEn: new Date().toISOString(),
    };
    setProductosProveedor((prev) => [nuevo, ...prev]);
    return nuevo;
  };

  const eliminarProductoProveedor = (id) => setProductosProveedor((prev) => prev.filter((p) => p.id !== id));

  const crearSolicitudProveedor = (pedido) => {
    const codigo = \`RC-\${String(Date.now()).slice(-6)}\`;
    const solicitud = {
      id: \`rc-\${Date.now()}\`,
      codigo,
      pedidoId: pedido.id,
      numeroPedido: pedido.numeroPedido || pedido.numero || '',
      numeroOT: pedido.numeroOT || pedido.ordenTrabajo?.codigoOT || '',
      cliente: pedido.cliente?.empresa || pedido.cliente?.nombre || pedido.cliente?.contacto || '',
      items: pedido.items || [],
      estado: 'pendiente_respuesta',
      respuestas: [],
      creadoEn: new Date().toISOString(),
    };

    setCotizacionesProveedor((prev) => [solicitud, ...prev]);

    actualizarPedido({
      ...pedido,
      costeoReal: {
        ...(pedido.costeoReal || {}),
        solicitudProveedorId: solicitud.id,
        codigoRecotizacion: codigo,
        estado: 'recotizando',
      },
    });

    return solicitud;
  };

  const registrarRespuestaProveedor = ({ solicitudId, proveedorId, monto, tiempoEntrega, nota }) => {
    let actualizada = null;

    setCotizacionesProveedor((prev) =>
      prev.map((s) => {
        if (s.id !== solicitudId) return s;
        const proveedor = proveedores.find((p) => p.id === proveedorId);
        actualizada = {
          ...s,
          respuestas: [
            ...(s.respuestas || []),
            {
              id: \`resp-\${Date.now()}\`,
              proveedorId,
              proveedorNombre: proveedor?.nombre || '',
              monto: Number(monto || 0),
              tiempoEntrega: tiempoEntrega || '',
              nota: nota || '',
              fecha: new Date().toISOString(),
            },
          ],
        };
        return actualizada;
      })
    );

    return actualizada;
  };

  const asignarProveedorPedido = ({ pedidoId, proveedorId, costoReal, tiempoEntrega, nota }) => {
    const pedido = pedidos.find((p) => p.id === pedidoId);
    if (!pedido) return null;

    const proveedor = proveedores.find((p) => p.id === proveedorId);
    const total = Number(pedido.resumen?.total || pedido.total || 0);
    const costo = Number(costoReal || 0);
    const utilidadReal = Math.max(total - costo, 0);

    const actualizado = {
      ...pedido,
      costos: {
        ...(pedido.costos || {}),
        realProveedor: costo,
      },
      costeoReal: {
        ...(pedido.costeoReal || {}),
        estado: 'proveedor_asignado',
        proveedorId,
        proveedorNombre: proveedor?.nombre || '',
        costoReal: costo,
        tiempoEntrega,
        nota,
        actualizadoEn: new Date().toISOString(),
      },
      utilidad: {
        ...(pedido.utilidad || {}),
        utilidadReal,
      },
    };

    actualizarPedido(actualizado);
    return actualizado;
  };

  const actualizarProducto = (producto) =>`
  );

  ctx = ctx.replace(
    "rolesSistema,\n        supabaseListo,",
    `rolesSistema,
        supabaseListo,

        proveedores,
        productosProveedor,
        cotizacionesProveedor,
        crearProveedor,
        eliminarProveedor,
        crearProductoProveedor,
        eliminarProductoProveedor,
        crearSolicitudProveedor,
        registrarRespuestaProveedor,
        asignarProveedorPedido,`
  );
}

fs.writeFileSync(ctxPath, ctx, 'utf8');

/* =========================
   PATCH APP
========================= */
let app = fs.readFileSync(appPath, 'utf8');

if (!app.includes("import ProveedoresCostos")) {
  app = app.replace(
    "import MiCuenta from './pages/MiCuenta';",
    "import MiCuenta from './pages/MiCuenta';\nimport ProveedoresCostos from './pages/ProveedoresCostos';"
  );
}

if (!app.includes("pathInicial.startsWith('/proveedores')")) {
  app = app.replace(
    "if (pathInicial.startsWith('/mi-cuenta')) return 'miCuenta';",
    "if (pathInicial.startsWith('/mi-cuenta')) return 'miCuenta';\n    if (pathInicial.startsWith('/proveedores')) return 'proveedores';"
  );
}

if (!app.includes("proveedores: '/proveedores'")) {
  app = app.replace(
    "miCuenta: '/mi-cuenta',",
    "miCuenta: '/mi-cuenta',\n        proveedores: '/proveedores',"
  );
}

if (!app.includes("page === 'proveedores'")) {
  app = app.replace(
    "{page === 'miCuenta' &&",
    `{page === 'proveedores' &&
        (accesoAdmin ? <ProveedoresCostos /> : <Login setPage={ir} destino="admin" />)}

      {page === 'miCuenta' &&`
  );
}

fs.writeFileSync(appPath, app, 'utf8');

/* =========================
   PATCH PEDIDOS PRODUCCION
========================= */
let pedidos = fs.readFileSync(pedidosPath, 'utf8');

if (!pedidos.includes("crearSolicitudProveedor")) {
  pedidos = pedidos.replace(
    "const { usuario, pedidos, actualizarPedido } = useApp();",
    "const { usuario, pedidos, actualizarPedido, proveedores = [], crearSolicitudProveedor, asignarProveedorPedido } = useApp();"
  );

  pedidos = pedidos.replace(
    "const [pedidoActivo, setPedidoActivo] = useState(null);",
    "const [pedidoActivo, setPedidoActivo] = useState(null);\n  const [proveedorId, setProveedorId] = useState('');\n  const [costoReal, setCostoReal] = useState('');\n  const [tiempoEntrega, setTiempoEntrega] = useState('');"
  );

  pedidos = pedidos.replace(
    "const copiarOT = async (pedido) => {",
    `const solicitarRecotizacion = (pedido) => {
    const solicitud = crearSolicitudProveedor?.(pedido);
    alert(\`Solicitud de recotización generada: \${solicitud?.codigo || ''}\`);
  };

  const asignarProveedor = (pedido) => {
    if (!proveedorId) return alert('Seleccioná proveedor.');
    if (!costoReal) return alert('Indicá costo real.');
    const actualizado = asignarProveedorPedido?.({
      pedidoId: pedido.id,
      proveedorId,
      costoReal,
      tiempoEntrega,
      nota: 'Asignado desde Pedidos / OT',
    });
    if (actualizado) {
      setPedidoActivo(actualizado);
      setProveedorId('');
      setCostoReal('');
      setTiempoEntrega('');
      alert('Proveedor asignado y costo real actualizado.');
    }
  };

  const copiarOT = async (pedido) => {`
  );

  pedidos = pedidos.replace(
    `<div className="action-stack">
                <button className="primary-btn" type="button" onClick={() => copiarOT(pedidoActivo)}>`,
    `{usuario?.rol === 'admin' && (
                <div className="costeo-real-box">
                  <h3>Costeo real privado</h3>
                  <p><span>Estado</span><b>{pedidoActivo.costeoReal?.estado || 'Sin costeo'}</b></p>
                  <p><span>Proveedor</span><b>{pedidoActivo.costeoReal?.proveedorNombre || 'No asignado'}</b></p>
                  <p><span>Costo real</span><b>{money(pedidoActivo.costeoReal?.costoReal || pedidoActivo.costos?.realProveedor || 0)}</b></p>

                  <button className="secondary-btn" type="button" onClick={() => solicitarRecotizacion(pedidoActivo)}>
                    Generar recotización proveedor
                  </button>

                  <label>
                    Proveedor
                    <select value={proveedorId} onChange={(e) => setProveedorId(e.target.value)}>
                      <option value="">Seleccionar proveedor</option>
                      {proveedores.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                    </select>
                  </label>

                  <label>
                    Costo real USD
                    <input type="number" step="0.01" value={costoReal} onChange={(e) => setCostoReal(e.target.value)} />
                  </label>

                  <label>
                    Tiempo entrega
                    <input value={tiempoEntrega} onChange={(e) => setTiempoEntrega(e.target.value)} />
                  </label>

                  <button className="primary-btn" type="button" onClick={() => asignarProveedor(pedidoActivo)}>
                    Asignar proveedor y costo real
                  </button>
                </div>
              )}

              <div className="action-stack">
                <button className="primary-btn" type="button" onClick={() => copiarOT(pedidoActivo)}>`
  );

  pedidos = pedidos.replace(
    ".action-stack{display:grid;gap:10px}",
    ".action-stack{display:grid;gap:10px}.costeo-real-box{background:#f8fafc;border:1px solid #cbd5e1;border-radius:20px;padding:14px;margin:16px 0;display:grid;gap:10px}.costeo-real-box h3{margin:0;color:#111827}.costeo-real-box p{display:flex;justify-content:space-between;margin:0;color:#475569;font-weight:800}.costeo-real-box b{color:#111827}.secondary-btn{width:100%;border:0;border-radius:18px;padding:15px;font-weight:950;font-size:16px;background:#fff7ed;color:#9a3412;border:1px solid #fed7aa}"
  );
}

fs.writeFileSync(pedidosPath, pedidos, 'utf8');

console.log('FON-08.0 / 08.5 aplicado: Proveedores, costeo real y recotización privada Admin.');
