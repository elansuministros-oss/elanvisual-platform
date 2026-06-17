import React, { useEffect, useMemo, useState } from 'react';
import { Calculator, FileText, Printer, Search, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

const POLITICA = {
  minimo: 2,
  recomendado: 2.5,
  objetivo: 3,
  iva: 0.15,
  anticipo: 0.6,
  descuentos: [0, 5, 10],
};

const money = (v) =>
  new Intl.NumberFormat('es-NI', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(Number(v || 0));

const n = (v) => Number(v || 0);

const limpiar = (v) =>
  String(v || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const costoMaterial = (m) =>
  n(m?.costo_real ?? m?.costo ?? m?.precio ?? m?.precio_unitario ?? m?.costo_unitario ?? m?.costo_m2 ?? 0);

function textoMaterial(m) {
  return limpiar(`${m?.nombre || ''} ${m?.categoria || ''} ${m?.descripcion || ''} ${m?.unidad || ''}`);
}

function buscar(materiales, palabras) {
  const keys = palabras.map(limpiar);
  return materiales.find((m) => keys.some((k) => textoMaterial(m).includes(k)));
}

function inferir(form) {
  const t = limpiar(form.descripcion);
  return {
    impresion: /impres|lona|vinil|banner|micro|uv|solvente|ecosolvente/.test(t),
    lona: /lona|banner|traslucida|13oz|18oz/.test(t),
    vinil: /vinil|microperforado|adhesivo/.test(t),
    pvc: /pvc/.test(t),
    acrilico: /acril/.test(t),
    acm: /acm|alucobond|fachada|fascia/.test(t),
    iluminado: /led|luz|luminos|iluminad|cajillo|cajuela/.test(t),
    estructura: /tubo|poste|estructura|marco|arriba|abajo|metal/.test(t),
    instalacion: /instal|montaje|colocar|fijar/.test(t),
    dobleCara: /doble cara|dos caras/.test(t),
  };
}

function crearLinea({ nombre, tipo, unidad, cantidad, material, costoUnitario }) {
  const costo = costoUnitario ?? costoMaterial(material);
  return {
    id: `linea-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    nombre: material?.nombre || nombre,
    tipo,
    unidad: material?.unidad || unidad,
    cantidad: Math.max(Number(cantidad || 1), 0),
    costoUnitario: Number(costo || 0),
    origen: material ? 'Material Master' : 'Regla interna',
  };
}

function armarLineasAutomaticas(form, materiales, tintas) {
  const ancho = n(form.ancho);
  const alto = n(form.alto);
  const cantidad = n(form.cantidad || 1);
  const area = Math.max(ancho * alto * cantidad, 0);
  const perimetro = Math.max((ancho + alto) * 2 * cantidad, 0);
  const ia = inferir(form);
  const lineas = [];

  const lona = buscar(materiales, ['lona banner', 'lona', 'banner']);
  const vinil = buscar(materiales, ['vinil', 'adhesivo', 'microperforado']);
  const pvc = buscar(materiales, ['pvc']);
  const acrilico = buscar(materiales, ['acrilico']);
  const acm = buscar(materiales, ['acm', 'alucobond']);
  const tubo = buscar(materiales, ['tubo', 'metal', 'poste']);
  const led = buscar(materiales, ['led']);
  const fuente = buscar(materiales, ['fuente']);
  const instalacion = buscar(materiales, ['instalacion', 'mano de obra', 'montaje']);
  const tornillo = buscar(materiales, ['tornillo', 'silicon', 'sellador', 'remache']);
  const tinta = buscar(tintas, ['uv', 'ecosolvente', 'solvente', 'tinta']) || buscar(materiales, ['tinta', 'uv', 'ecosolvente']);

  if (ia.lona) {
    lineas.push(crearLinea({ nombre: 'Lona impresa', tipo: 'Impresión', unidad: 'm2', cantidad: area, material: lona }));
  }

  if (ia.vinil && !ia.lona) {
    lineas.push(crearLinea({ nombre: 'Vinil impreso', tipo: 'Impresión', unidad: 'm2', cantidad: area, material: vinil }));
  }

  if (ia.impresion) {
    lineas.push(crearLinea({ nombre: 'Tinta / impresión', tipo: 'Tinta', unidad: 'm2', cantidad: area, material: tinta }));
  }

  if (ia.pvc) lineas.push(crearLinea({ nombre: 'PVC', tipo: 'Material base', unidad: 'm2', cantidad: area, material: pvc }));
  if (ia.acrilico) lineas.push(crearLinea({ nombre: 'Acrílico', tipo: 'Material base', unidad: 'm2', cantidad: ia.dobleCara ? area * 2 : area, material: acrilico }));
  if (ia.acm) lineas.push(crearLinea({ nombre: 'ACM', tipo: 'Fachada', unidad: 'm2', cantidad: area, material: acm }));

  if (ia.estructura) {
    lineas.push(crearLinea({ nombre: 'Estructura metálica', tipo: 'Estructura', unidad: 'metro lineal', cantidad: perimetro || 1, material: tubo }));
  }

  if (ia.iluminado) {
    lineas.push(crearLinea({ nombre: 'LED', tipo: 'Iluminación', unidad: 'servicio', cantidad: 1, material: led }));
    lineas.push(crearLinea({ nombre: 'Fuente eléctrica', tipo: 'Iluminación', unidad: 'servicio', cantidad: 1, material: fuente }));
  }

  if (ia.instalacion) {
    lineas.push(crearLinea({ nombre: 'Instalación / fijación', tipo: 'Instalación', unidad: 'servicio', cantidad: 1, material: instalacion || tornillo }));
  }

  if (lineas.length === 0) {
    const principal = buscar(materiales, ['lona', 'vinil', 'pvc', 'acrilico', 'acm']) || materiales[0];
    lineas.push(crearLinea({ nombre: 'Material principal detectado', tipo: 'Material', unidad: 'm2', cantidad: area || 1, material: principal }));
  }

  return lineas;
}

export default function CotizadorDirecto() {
  const [materiales, setMateriales] = useState([]);
  const [tintas, setTintas] = useState([]);
  const [mensaje, setMensaje] = useState('');
  const [lineas, setLineas] = useState([]);

  const [form, setForm] = useState({
    cliente: '',
    empresa: '',
    descripcion: '',
    ancho: 1,
    alto: 1,
    cantidad: 1,
    precioElegido: 'recomendado',
    descuento: 0,
  });

  useEffect(() => {
    const cargar = async () => {
      const [mat, tin] = await Promise.all([
        supabase.from('materiales_master').select('*').order('categoria'),
        supabase.from('tintas_master').select('*').order('nombre'),
      ]);

      if (mat.error) setMensaje(`No se pudo cargar Material Master: ${mat.error.message}`);
      setMateriales(mat.data || []);
      setTintas(tin.data || []);
    };

    cargar();
  }, []);

  const actualizar = (campo, valor) => setForm((prev) => ({ ...prev, [campo]: valor }));

  const generar = () => {
    const nuevas = armarLineasAutomaticas(form, materiales, tintas);
    setLineas(nuevas);
    const sinCosto = nuevas.filter((l) => n(l.costoUnitario) <= 0);
    setMensaje(
      sinCosto.length
        ? `Atención: ${sinCosto.length} material(es) no tienen costo cargado en Material Master.`
        : 'Cotización calculada correctamente.'
    );
  };

  const eliminarLinea = (id) => setLineas((prev) => prev.filter((l) => l.id !== id));

  const resumen = useMemo(() => {
    const costo = lineas.reduce((acc, l) => acc + n(l.cantidad) * n(l.costoUnitario), 0);
    const minimo = costo * POLITICA.minimo;
    const recomendado = costo * POLITICA.recomendado;
    const objetivo = costo * POLITICA.objetivo;
    const base = form.precioElegido === 'minimo' ? minimo : form.precioElegido === 'objetivo' ? objetivo : recomendado;
    const descuento = base * (n(form.descuento) / 100);
    const subtotal = base - descuento;
    const iva = subtotal * POLITICA.iva;
    const total = subtotal + iva;
    const anticipo = total * POLITICA.anticipo;
    const saldo = total - anticipo;

    return { costo, minimo, recomendado, objetivo, descuento, subtotal, iva, total, anticipo, saldo };
  }, [lineas, form]);

  const guardar = () => {
    const payload = { id: `cot-dir-${Date.now()}`, fecha: new Date().toISOString(), form, lineas, resumen };
    const actual = JSON.parse(localStorage.getItem('elanvision_cotizaciones_directas') || '[]');
    localStorage.setItem('elanvision_cotizaciones_directas', JSON.stringify([payload, ...actual]));
    setMensaje('Cotización guardada localmente.');
  };

  const imprimir = () => {
    guardar();
    setTimeout(() => window.print(), 150);
  };

  return (
    <main className="cot-directo">
      <section className="cd-hero no-print">
        <span>ELANVISIÓN · Cotizador Directo</span>
        <h1>Cotizador operativo inmediato</h1>
        <p>El vendedor escribe la orden. La IA detecta materiales, proceso, instalación y precios sugeridos.</p>
      </section>

      <section className="cd-grid no-print">
        <form className="cd-card" onSubmit={(e) => { e.preventDefault(); generar(); }}>
          <div className="cd-title"><Search size={20} /><h2>Orden del vendedor</h2></div>

          <input placeholder="Cliente" value={form.cliente} onChange={(e) => actualizar('cliente', e.target.value)} />
          <input placeholder="Empresa" value={form.empresa} onChange={(e) => actualizar('empresa', e.target.value)} />
          <textarea placeholder="Ejemplo: Impresión en lona banner 13oz de 1x2 mts con tubo arriba y abajo e instalación" value={form.descripcion} onChange={(e) => actualizar('descripcion', e.target.value)} />

          <div className="two">
            <input type="number" step="0.01" placeholder="Ancho m" value={form.ancho} onChange={(e) => actualizar('ancho', e.target.value)} />
            <input type="number" step="0.01" placeholder="Alto m" value={form.alto} onChange={(e) => actualizar('alto', e.target.value)} />
          </div>

          <input type="number" step="1" placeholder="Cantidad" value={form.cantidad} onChange={(e) => actualizar('cantidad', e.target.value)} />

          <button className="primary" type="submit"><Calculator size={18} /> Calcular con IA</button>
        </form>

        <section className="cd-card">
          <div className="cd-title"><FileText size={20} /><h2>Precios sugeridos</h2></div>

          <article className="price-row">
            <label><input type="radio" checked={form.precioElegido === 'minimo'} onChange={() => actualizar('precioElegido', 'minimo')} /> Precio mínimo</label>
            <b>{money(resumen.minimo)}</b>
          </article>

          <article className="price-row recommended">
            <label><input type="radio" checked={form.precioElegido === 'recomendado'} onChange={() => actualizar('precioElegido', 'recomendado')} /> Precio recomendado</label>
            <b>{money(resumen.recomendado)}</b>
          </article>

          <article className="price-row">
            <label><input type="radio" checked={form.precioElegido === 'objetivo'} onChange={() => actualizar('precioElegido', 'objetivo')} /> Precio objetivo</label>
            <b>{money(resumen.objetivo)}</b>
          </article>

          <label className="discount">
            Descuento autorizado
            <select value={form.descuento} onChange={(e) => actualizar('descuento', e.target.value)}>
              {POLITICA.descuentos.map((d) => <option key={d} value={d}>{d}%</option>)}
            </select>
          </label>

          <div className="total-box">
            <p><span>Subtotal venta</span><b>{money(resumen.subtotal)}</b></p>
            <p><span>IVA</span><b>{money(resumen.iva)}</b></p>
            <p><span>Total cliente</span><b>{money(resumen.total)}</b></p>
            <p><span>Anticipo 60%</span><b>{money(resumen.anticipo)}</b></p>
            <p><span>Saldo</span><b>{money(resumen.saldo)}</b></p>
          </div>

          <button className="secondary" type="button" onClick={guardar}>Guardar</button>
          <button className="primary" type="button" onClick={imprimir}><Printer size={18} /> Descargar / Imprimir PDF</button>
          {mensaje && <p className="msg">{mensaje}</p>}
        </section>
      </section>

      <section className="cd-card no-print">
        <div className="cd-title"><h2>Materiales detectados por IA</h2></div>

        <div className="lineas">
          {lineas.map((l) => (
            <article className="linea" key={l.id}>
              <strong>{l.nombre}</strong>
              <span>{l.tipo}</span>
              <span>{l.cantidad} {l.unidad}</span>
              <b>{money(n(l.cantidad) * n(l.costoUnitario))}</b>
              <small>{l.origen}</small>
              <button type="button" onClick={() => eliminarLinea(l.id)}><Trash2 size={16} /></button>
            </article>
          ))}
        </div>
      </section>

      <section className="print-area">
        <div className="print-head">
          <h1>Cotización Comercial</h1>
          <p>ELANVISIÓN</p>
        </div>

        <h2>{form.empresa || form.cliente || 'Cliente'}</h2>
        <p>{form.descripcion}</p>

        <h3>Detalle técnico resumido</h3>
        <table>
          <thead><tr><th>Concepto</th><th>Cantidad</th><th>Unidad</th></tr></thead>
          <tbody>
            {lineas.map((l) => (
              <tr key={l.id}><td>{l.nombre}</td><td>{l.cantidad}</td><td>{l.unidad}</td></tr>
            ))}
          </tbody>
        </table>

        <h3>Resumen comercial</h3>
        <p><b>Total:</b> {money(resumen.total)}</p>
        <p><b>Anticipo 60%:</b> {money(resumen.anticipo)}</p>
        <p><b>Saldo:</b> {money(resumen.saldo)}</p>

        <p className="legal">Cotización preliminar sujeta a confirmación de arte final, disponibilidad de materiales, condiciones de instalación y aprobación del cliente.</p>
      </section>

      <style>{`
        .cot-directo{min-height:100vh;background:#f4f6fb;padding:14px;display:grid;gap:14px}
        .cd-hero,.cd-card{background:#fff;border-radius:24px;padding:18px;box-shadow:0 14px 35px rgba(15,23,42,.08)}
        .cd-hero span{font-size:12px;font-weight:950;color:#b48722;text-transform:uppercase}
        .cd-hero h1{margin:8px 0;font-size:32px;color:#111827}
        .cd-hero p{margin:0;color:#64748b;font-weight:750}
        .cd-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;align-items:start}
        .cd-title{display:flex;gap:8px;align-items:center;margin-bottom:12px}.cd-title h2{margin:0;color:#111827}
        input,textarea,select{width:100%;border:1px solid #dbe3ef;border-radius:16px;padding:13px;font-size:16px;margin-bottom:10px}
        textarea{min-height:120px}
        .two{display:grid;grid-template-columns:1fr 1fr;gap:10px}
        .primary,.secondary{width:100%;border:0;border-radius:18px;padding:14px;font-weight:950;font-size:15px;display:flex;align-items:center;justify-content:center;gap:8px;cursor:pointer;margin-top:8px}
        .primary{background:#111827;color:#fff}.secondary{background:#eef2ff;color:#3730a3}
        .price-row{display:flex;justify-content:space-between;gap:10px;align-items:center;border:1px solid #e5e7eb;border-radius:18px;padding:12px;margin-bottom:8px}
        .price-row label{font-weight:950;color:#334155}.price-row input{width:auto;margin:0 6px 0 0}.price-row b{font-size:20px;color:#111827}
        .recommended{background:#f8fafc;border-color:#111827}
        .discount{display:block;font-weight:900;color:#334155;margin-top:12px}
        .total-box{background:#0f172a;color:#fff;border-radius:20px;padding:14px;margin-top:10px}.total-box p{display:flex;justify-content:space-between;margin:6px 0}
        .lineas{display:grid;gap:8px;margin-top:12px}.linea{display:grid;grid-template-columns:1.4fr 1fr .9fr .9fr .8fr 42px;gap:8px;align-items:center;background:#f8fafc;border:1px solid #e5e7eb;border-radius:16px;padding:12px}.linea button{border:0;background:#fee2e2;color:#991b1b;border-radius:12px;height:42px}.msg{font-weight:900;color:#0f766e}
        .print-area{display:none}
        @media(max-width:900px){.cd-grid,.two{grid-template-columns:1fr}.linea{grid-template-columns:1fr}.cot-directo{padding-bottom:90px}}
        @media print{
          .no-print,.cd-hero,.cd-grid,.cd-card{display:none!important}
          .cot-directo{background:#fff;padding:0}
          .print-area{display:block;font-family:Arial,sans-serif;color:#111827;padding:28px}
          .print-head{display:flex;justify-content:space-between;border-bottom:3px solid #111827;margin-bottom:18px}
          table{width:100%;border-collapse:collapse;margin:14px 0}th,td{border:1px solid #d1d5db;padding:8px;text-align:left}
          .legal{margin-top:30px;color:#64748b}
        }
      `}</style>
    </main>
  );
}