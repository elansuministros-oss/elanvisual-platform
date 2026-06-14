import fs from 'fs';

const ctxPath = 'src/context/AppContext.jsx';
const appPath = 'src/App.jsx';
const invPath = 'src/pages/InventarioInteligente.jsx';

const inventario = `
import React, { useMemo, useState } from 'react';
import { Boxes, ClipboardCheck, Layers3, PlusCircle, Search, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';

const money = (v) =>
  new Intl.NumberFormat('es-NI', { style: 'currency', currency: 'USD' }).format(Number(v || 0));

const num = (v) => Number(v || 0);

const inicial = {
  material: '',
  categoria: 'PVC',
  tipo: 'Lámina completa',
  ancho: '',
  largo: '',
  cantidad: 1,
  unidad: 'm2',
  costoCompra: '',
  proveedorId: '',
  proveedorNombre: '',
  ubicacion: '',
  estado: 'Disponible',
  origen: 'Compra',
  observaciones: '',
};

const categorias = [
  'PVC',
  'Acrílico',
  'Coroplast',
  'Lona',
  'Vinil',
  'Roll Up',
  'Pluma',
  'Counter',
  'Accesorio',
  'Otro',
];

const tipos = [
  'Lámina completa',
  'Retazo',
  'Rollo',
  'Unidad',
  'Accesorio',
];

function area(item) {
  const a = num(item.ancho);
  const l = num(item.largo);
  const c = num(item.cantidad || 1);
  if (a > 0 && l > 0) return a * l * c;
  return c;
}

export default function InventarioInteligente() {
  const {
    usuario,
    proveedores = [],
    inventarioReal = [],
    crearInventarioReal,
    eliminarInventarioReal,
    reservarInventarioReal,
    consumirInventarioReal,
    liberarReservaInventarioReal,
  } = useApp();

  const [form, setForm] = useState(inicial);
  const [busqueda, setBusqueda] = useState('');
  const [filtro, setFiltro] = useState('Todos');
  const [consumo, setConsumo] = useState({ itemId: '', ancho: '', largo: '', cantidad: 1, ot: '', nota: '' });

  const esAdmin = usuario?.rol === 'admin';

  const lista = useMemo(() => {
    const t = busqueda.toLowerCase();
    return inventarioReal.filter((i) => {
      const texto = \`\${i.material} \${i.categoria} \${i.tipo} \${i.proveedorNombre} \${i.ubicacion} \${i.estado}\`.toLowerCase();
      return texto.includes(t) && (filtro === 'Todos' || i.categoria === filtro);
    });
  }, [inventarioReal, busqueda, filtro]);

  const resumen = useMemo(() => {
    return inventarioReal.reduce((acc, item) => {
      acc.items += 1;
      acc.area += area(item);
      acc.valor += num(item.costoDisponible ?? item.costoCompra);
      if (item.estado === 'Disponible') acc.disponibles += 1;
      if (item.estado === 'Reservado') acc.reservados += 1;
      if (item.tipo === 'Retazo') acc.retazos += 1;
      return acc;
    }, { items: 0, area: 0, valor: 0, disponibles: 0, reservados: 0, retazos: 0 });
  }, [inventarioReal]);

  const actualizar = (campo, valor) => setForm((prev) => ({ ...prev, [campo]: valor }));

  const guardar = (e) => {
    e.preventDefault();
    if (!form.material.trim()) return alert('Indicá material.');
    const proveedor = proveedores.find((p) => p.id === form.proveedorId);

    crearInventarioReal({
      ...form,
      proveedorNombre: proveedor?.nombre || form.proveedorNombre || '',
      ancho: num(form.ancho),
      largo: num(form.largo),
      cantidad: num(form.cantidad || 1),
      costoCompra: num(form.costoCompra),
    });

    setForm(inicial);
  };

  const ejecutarReserva = () => {
    if (!consumo.itemId) return alert('Seleccioná inventario.');
    const item = inventarioReal.find((i) => i.id === consumo.itemId);
    if (!item) return;

    reservarInventarioReal({
      id: item.id,
      ancho: num(consumo.ancho),
      largo: num(consumo.largo),
      cantidad: num(consumo.cantidad || 1),
      ot: consumo.ot,
      nota: consumo.nota,
    });

    setConsumo({ itemId: '', ancho: '', largo: '', cantidad: 1, ot: '', nota: '' });
  };

  const ejecutarConsumo = () => {
    if (!consumo.itemId) return alert('Seleccioná inventario.');
    const item = inventarioReal.find((i) => i.id === consumo.itemId);
    if (!item) return;

    consumirInventarioReal({
      id: item.id,
      ancho: num(consumo.ancho),
      largo: num(consumo.largo),
      cantidad: num(consumo.cantidad || 1),
      ot: consumo.ot,
      nota: consumo.nota,
    });

    setConsumo({ itemId: '', ancho: '', largo: '', cantidad: 1, ot: '', nota: '' });
  };

  if (!esAdmin) {
    return (
      <main className="inventario-page">
        <section className="inventario-card lock">
          <Boxes size={42} />
          <h1>Acceso privado</h1>
          <p>Inventario real, retazos y costos internos son solo para administración.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="inventario-page">
      <section className="inventario-hero">
        <span>ELANVISUAL · INVENTARIO REAL</span>
        <h1>Inventario Inteligente</h1>
        <p>Controla compras, láminas completas, retazos, reservas por OT y consumo real.</p>
      </section>

      <section className="inv-stats">
        <div><span>Registros</span><b>{resumen.items}</b></div>
        <div><span>Disponibles</span><b>{resumen.disponibles}</b></div>
        <div><span>Reservados</span><b>{resumen.reservados}</b></div>
        <div><span>Retazos</span><b>{resumen.retazos}</b></div>
        <div><span>Área estimada</span><b>{resumen.area.toFixed(2)} m²</b></div>
        <div><span>Valor interno</span><b>{money(resumen.valor)}</b></div>
      </section>

      <section className="inventario-grid">
        <form className="inventario-card" onSubmit={guardar}>
          <h2><PlusCircle size={20}/> Entrada inventario</h2>

          <label>Material<input value={form.material} onChange={(e)=>actualizar('material', e.target.value)} placeholder="PVC 3mm, acrílico 3mm, roll up..." /></label>

          <div className="two">
            <label>Categoría<select value={form.categoria} onChange={(e)=>actualizar('categoria', e.target.value)}>
              {categorias.map((c)=><option key={c}>{c}</option>)}
            </select></label>

            <label>Tipo<select value={form.tipo} onChange={(e)=>actualizar('tipo', e.target.value)}>
              {tipos.map((t)=><option key={t}>{t}</option>)}
            </select></label>
          </div>

          <div className="three">
            <label>Ancho m<input type="number" step="0.01" value={form.ancho} onChange={(e)=>actualizar('ancho', e.target.value)} /></label>
            <label>Largo m<input type="number" step="0.01" value={form.largo} onChange={(e)=>actualizar('largo', e.target.value)} /></label>
            <label>Cantidad<input type="number" step="0.01" value={form.cantidad} onChange={(e)=>actualizar('cantidad', e.target.value)} /></label>
          </div>

          <div className="two">
            <label>Costo compra USD<input type="number" step="0.01" value={form.costoCompra} onChange={(e)=>actualizar('costoCompra', e.target.value)} /></label>
            <label>Ubicación<input value={form.ubicacion} onChange={(e)=>actualizar('ubicacion', e.target.value)} placeholder="Taller, bodega, proveedor..." /></label>
          </div>

          <label>Proveedor<select value={form.proveedorId} onChange={(e)=>actualizar('proveedorId', e.target.value)}>
            <option value="">Sin proveedor</option>
            {proveedores.map((p)=><option key={p.id} value={p.id}>{p.nombre}</option>)}
          </select></label>

          <label>Observaciones<textarea value={form.observaciones} onChange={(e)=>actualizar('observaciones', e.target.value)} /></label>

          <button className="primary-btn"><PlusCircle size={18}/> Registrar entrada</button>
        </form>

        <section className="inventario-card">
          <h2><ClipboardCheck size={20}/> Reserva / consumo OT</h2>

          <label>Inventario<select value={consumo.itemId} onChange={(e)=>setConsumo({...consumo,itemId:e.target.value})}>
            <option value="">Seleccionar</option>
            {inventarioReal.filter((i)=>i.estado !== 'Consumido').map((i)=><option key={i.id} value={i.id}>{i.material} · {i.tipo} · {i.estado}</option>)}
          </select></label>

          <div className="three">
            <label>Ancho usado<input type="number" step="0.01" value={consumo.ancho} onChange={(e)=>setConsumo({...consumo,ancho:e.target.value})} /></label>
            <label>Largo usado<input type="number" step="0.01" value={consumo.largo} onChange={(e)=>setConsumo({...consumo,largo:e.target.value})} /></label>
            <label>Cantidad<input type="number" step="0.01" value={consumo.cantidad} onChange={(e)=>setConsumo({...consumo,cantidad:e.target.value})} /></label>
          </div>

          <label>OT / Pedido<input value={consumo.ot} onChange={(e)=>setConsumo({...consumo,ot:e.target.value})} placeholder="OT-000123" /></label>
          <label>Nota<textarea value={consumo.nota} onChange={(e)=>setConsumo({...consumo,nota:e.target.value})} /></label>

          <div className="two">
            <button className="secondary-btn" type="button" onClick={ejecutarReserva}>Reservar</button>
            <button className="primary-btn" type="button" onClick={ejecutarConsumo}>Consumir</button>
          </div>
        </section>
      </section>

      <section className="inventario-card">
        <div className="tools">
          <div className="search-box"><Search size={18}/><input value={busqueda} onChange={(e)=>setBusqueda(e.target.value)} placeholder="Buscar material, proveedor, estado..." /></div>
          <select value={filtro} onChange={(e)=>setFiltro(e.target.value)}>
            <option>Todos</option>
            {categorias.map((c)=><option key={c}>{c}</option>)}
          </select>
        </div>
      </section>

      <section className="inventario-list">
        {lista.map((item)=>{
          const a = area(item);
          const costoUnitario = a > 0 ? num(item.costoDisponible ?? item.costoCompra) / a : 0;

          return (
            <article className={\`inventario-card inv-item estado-\${String(item.estado).toLowerCase()}\`} key={item.id}>
              <div className="inv-head">
                <div>
                  <span>{item.categoria} · {item.tipo}</span>
                  <h2>{item.material}</h2>
                  <p>{item.proveedorNombre || 'Sin proveedor'} · {item.ubicacion || 'Sin ubicación'}</p>
                </div>
                <button className="danger-btn mini" onClick={()=>eliminarInventarioReal(item.id)}><Trash2 size={16}/></button>
              </div>

              <div className="badges">
                <span>{item.estado}</span>
                <span>{item.origen}</span>
                {item.otReserva && <span>{item.otReserva}</span>}
              </div>

              <div className="inv-info">
                <p><b>Medida:</b> {item.ancho || 0} x {item.largo || 0} m · Cant. {item.cantidad || 1}</p>
                <p><b>Área disponible:</b> {a.toFixed(2)} m²</p>
                <p><b>Costo disponible:</b> {money(item.costoDisponible ?? item.costoCompra)}</p>
                <p><b>Costo aprox/m²:</b> {money(costoUnitario)}</p>
              </div>

              {item.estado === 'Reservado' && (
                <button className="secondary-btn" type="button" onClick={()=>liberarReservaInventarioReal(item.id)}>
                  Liberar reserva
                </button>
              )}

              {item.historial?.length > 0 && (
                <div className="historial">
                  <strong>Historial</strong>
                  {item.historial.slice(0,5).map((h, idx)=><small key={idx}>{h.fecha?.slice(0,10)} · {h.tipo} · {h.nota}</small>)}
                </div>
              )}
            </article>
          );
        })}
      </section>

      <style>{\`
        .inventario-page{padding:14px;display:grid;gap:14px;background:#f4f6fb;min-height:100vh}
        .inventario-hero,.inventario-card,.inv-stats div{background:#fff;border-radius:24px;padding:18px;box-shadow:0 14px 35px rgba(15,23,42,.08)}
        .inventario-hero span,.inv-head span{font-size:12px;font-weight:950;color:#b48722;text-transform:uppercase}
        .inventario-hero h1{margin:8px 0;font-size:30px;color:#111827}.inventario-hero p{margin:0;color:#64748b;font-weight:800}
        .inv-stats{display:grid;grid-template-columns:repeat(6,1fr);gap:10px}.inv-stats div{display:grid;gap:5px}.inv-stats span{font-size:12px;color:#64748b;font-weight:900}.inv-stats b{font-size:20px;color:#111827}
        .inventario-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;align-items:start}
        .two{display:grid;grid-template-columns:1fr 1fr;gap:10px}.three{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
        label{display:grid;gap:7px;font-weight:900;color:#334155;margin-bottom:12px}
        input,select,textarea{width:100%;border:1px solid #cbd5e1;border-radius:16px;padding:13px;font-size:16px;background:#fff}
        textarea{min-height:90px}.primary-btn,.secondary-btn,.danger-btn{border:0;border-radius:18px;padding:14px;font-weight:950;display:flex;gap:8px;align-items:center;justify-content:center;cursor:pointer}
        .primary-btn{background:#111827;color:#fff}.secondary-btn{background:#fff7ed;color:#9a3412;border:1px solid #fed7aa}.danger-btn{background:#fee2e2;color:#991b1b}.mini{width:46px;height:46px;padding:0}
        .tools{display:grid;grid-template-columns:1fr 220px;gap:10px}.search-box{display:flex;align-items:center;gap:8px}.search-box input{border:0}
        .inventario-list{display:grid;grid-template-columns:repeat(auto-fit,minmax(290px,1fr));gap:14px}
        .inv-head{display:flex;justify-content:space-between;gap:12px}.inv-head h2{margin:4px 0;color:#111827}.inv-head p{margin:0;color:#64748b;font-weight:800}
        .badges{display:flex;flex-wrap:wrap;gap:6px;margin:12px 0}.badges span{font-size:12px;font-weight:950;background:#eef2ff;color:#3730a3;border-radius:999px;padding:7px 10px}
        .inv-info{display:grid;gap:5px}.inv-info p{margin:0;color:#475569;font-weight:800}
        .historial{margin-top:12px;background:#f8fafc;border-radius:16px;padding:12px;display:grid;gap:6px}.historial small{color:#64748b;font-weight:800}
        .lock{text-align:center;margin:40px auto;max-width:420px}
        @media(max-width:900px){.inv-stats,.inventario-grid,.two,.three,.tools{grid-template-columns:1fr}.inventario-page{padding-bottom:90px}}
      \`}</style>
    </main>
  );
}
`;

fs.writeFileSync(invPath, inventario.trim() + '\n', 'utf8');

let ctx = fs.readFileSync(ctxPath, 'utf8');

if (!ctx.includes("elanvisual_inventario_real")) {
  ctx = ctx.replace(
    "const [cotizacionesProveedor, setCotizacionesProveedor] = useState(() => leerStorage('elanvisual_cotizaciones_proveedor', []));",
    "const [cotizacionesProveedor, setCotizacionesProveedor] = useState(() => leerStorage('elanvisual_cotizaciones_proveedor', []));\n  const [inventarioReal, setInventarioReal] = useState(() => leerStorage('elanvisual_inventario_real', []));"
  );

  ctx = ctx.replace(
    "useEffect(() => guardarStorage('elanvisual_cotizaciones_proveedor', cotizacionesProveedor), [cotizacionesProveedor]);",
    "useEffect(() => guardarStorage('elanvisual_cotizaciones_proveedor', cotizacionesProveedor), [cotizacionesProveedor]);\n  useEffect(() => guardarStorage('elanvisual_inventario_real', inventarioReal), [inventarioReal]);"
  );

  ctx = ctx.replace(
    "const actualizarProducto = (producto) =>",
    `const areaInventario = (item = {}) => {
    const ancho = Number(item.ancho || 0);
    const largo = Number(item.largo || 0);
    const cantidad = Number(item.cantidad || 1);
    if (ancho > 0 && largo > 0) return ancho * largo * cantidad;
    return cantidad;
  };

  const crearInventarioReal = (datos) => {
    const area = areaInventario(datos);
    const nuevo = {
      ...datos,
      id: datos.id || \`inv-\${Date.now()}\`,
      ancho: Number(datos.ancho || 0),
      largo: Number(datos.largo || 0),
      cantidad: Number(datos.cantidad || 1),
      costoCompra: Number(datos.costoCompra || 0),
      costoDisponible: Number(datos.costoCompra || 0),
      estado: datos.estado || 'Disponible',
      creadoEn: new Date().toISOString(),
      historial: [
        {
          tipo: 'entrada',
          fecha: new Date().toISOString(),
          area,
          nota: datos.observaciones || 'Entrada de inventario.',
        },
      ],
    };

    setInventarioReal((prev) => [nuevo, ...prev]);
    return nuevo;
  };

  const eliminarInventarioReal = (id) => setInventarioReal((prev) => prev.filter((i) => i.id !== id));

  const reservarInventarioReal = ({ id, ancho, largo, cantidad = 1, ot = '', nota = '' }) => {
    setInventarioReal((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        return {
          ...item,
          estado: 'Reservado',
          otReserva: ot,
          reserva: { ancho: Number(ancho || 0), largo: Number(largo || 0), cantidad: Number(cantidad || 1), ot, nota },
          historial: [
            ...(item.historial || []),
            { tipo: 'reserva', fecha: new Date().toISOString(), nota: nota || \`Reservado para \${ot || 'OT'}\` },
          ],
        };
      })
    );
  };

  const liberarReservaInventarioReal = (id) => {
    setInventarioReal((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        return {
          ...item,
          estado: 'Disponible',
          otReserva: '',
          reserva: null,
          historial: [
            ...(item.historial || []),
            { tipo: 'liberacion', fecha: new Date().toISOString(), nota: 'Reserva liberada.' },
          ],
        };
      })
    );
  };

  const consumirInventarioReal = ({ id, ancho, largo, cantidad = 1, ot = '', nota = '' }) => {
    setInventarioReal((prev) => {
      const item = prev.find((i) => i.id === id);
      if (!item) return prev;

      const anchoUso = Number(ancho || item.ancho || 0);
      const largoUso = Number(largo || item.largo || 0);
      const cantidadUso = Number(cantidad || 1);
      const areaOriginal = areaInventario(item);
      const areaUsada = anchoUso > 0 && largoUso > 0 ? anchoUso * largoUso * cantidadUso : cantidadUso;
      const proporcion = areaOriginal > 0 ? Math.min(areaUsada / areaOriginal, 1) : 1;
      const costoUsado = Number(item.costoDisponible ?? item.costoCompra ?? 0) * proporcion;
      const areaRestante = Math.max(areaOriginal - areaUsada, 0);
      const costoRestante = Math.max(Number(item.costoDisponible ?? item.costoCompra ?? 0) - costoUsado, 0);

      const consumido = {
        ...item,
        estado: 'Consumido',
        consumidoEn: new Date().toISOString(),
        otConsumo: ot,
        areaConsumida: areaUsada,
        costoConsumido: costoUsado,
        historial: [
          ...(item.historial || []),
          { tipo: 'consumo', fecha: new Date().toISOString(), area: areaUsada, costo: costoUsado, nota: nota || \`Consumido para \${ot || 'OT'}\` },
        ],
      };

      const salida = prev.map((i) => (i.id === id ? consumido : i));

      if (areaRestante > 0.05 && item.ancho > 0 && item.largo > 0) {
        const retazo = {
          ...item,
          id: \`ret-\${Date.now()}\`,
          tipo: 'Retazo',
          cantidad: 1,
          ancho: Number(item.ancho || 0),
          largo: Number((areaRestante / Math.max(Number(item.ancho || 1), 0.01)).toFixed(2)),
          costoCompra: costoRestante,
          costoDisponible: costoRestante,
          estado: 'Disponible',
          origen: \`Retazo de \${item.material}\`,
          otOrigen: ot,
          creadoEn: new Date().toISOString(),
          historial: [
            { tipo: 'retazo', fecha: new Date().toISOString(), area: areaRestante, costo: costoRestante, nota: \`Retazo generado por consumo de \${ot || 'OT'}\` },
          ],
        };
        return [retazo, ...salida];
      }

      return salida;
    });
  };

  const actualizarProducto = (producto) =>`
  );

  ctx = ctx.replace(
    "asignarProveedorPedido,",
    `asignarProveedorPedido,

        inventarioReal,
        crearInventarioReal,
        eliminarInventarioReal,
        reservarInventarioReal,
        consumirInventarioReal,
        liberarReservaInventarioReal,`
  );
}

fs.writeFileSync(ctxPath, ctx, 'utf8');

let app = fs.readFileSync(appPath, 'utf8');

if (!app.includes("import InventarioInteligente")) {
  app = app.replace(
    "import ProveedoresCostos from './pages/ProveedoresCostos';",
    "import ProveedoresCostos from './pages/ProveedoresCostos';\nimport InventarioInteligente from './pages/InventarioInteligente';"
  );
}

if (!app.includes("pathInicial.startsWith('/inventario-real')")) {
  app = app.replace(
    "if (pathInicial.startsWith('/proveedores')) return 'proveedores';",
    "if (pathInicial.startsWith('/proveedores')) return 'proveedores';\n    if (pathInicial.startsWith('/inventario-real')) return 'inventarioReal';"
  );
}

if (!app.includes("inventarioReal: '/inventario-real'")) {
  app = app.replace(
    "proveedores: '/proveedores',",
    "proveedores: '/proveedores',\n        inventarioReal: '/inventario-real',"
  );
}

if (!app.includes("page === 'inventarioReal'")) {
  app = app.replace(
    "{page === 'proveedores' &&",
    `{page === 'inventarioReal' &&
        (accesoAdmin ? <InventarioInteligente /> : <Login setPage={ir} destino="admin" />)}

      {page === 'proveedores' &&`
  );
}

fs.writeFileSync(appPath, app, 'utf8');

console.log('FON-08.2 aplicado: Inventario inteligente, retazos, reservas y consumo real.');
