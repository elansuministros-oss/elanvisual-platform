import React, { useEffect, useMemo, useState } from 'react';
import { Calculator, FileText, PlusCircle, Printer, Search, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

const money = (v) =>
  new Intl.NumberFormat('es-NI', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(Number(v || 0));

const n = (v) => Number(v || 0);
const txt = (v) => String(v || '').toLowerCase();

const costoMaterial = (m) =>
  n(
    m.costo_real ??
      m.costo ??
      m.precio ??
      m.precio_unitario ??
      m.costo_unitario ??
      m.valor ??
      0
  );

function inferirAtributos(form) {
  const base = txt(`${form.descripcion} ${form.tipo}`);

  return {
    ...form,
    conImpresion:
      base.includes('impresion') ||
      base.includes('impresión') ||
      base.includes('lona') ||
      base.includes('vinil') ||
      base.includes('banner'),
    dobleCara:
      base.includes('doble cara') ||
      base.includes('dos caras'),
    iluminado:
      base.includes('led') ||
      base.includes('luminos') ||
      base.includes('iluminado') ||
      base.includes('luz'),
    conPostes:
      base.includes('poste') ||
      base.includes('tubo') ||
      base.includes('estructura') ||
      base.includes('marco'),
    instalacion:
      base.includes('instalacion') ||
      base.includes('instalación') ||
      base.includes('instalar') ||
      base.includes('montaje'),
    iva: true,
  };
}

function detectarKeywords(form) {
  const base = txt(`${form.descripcion} ${form.tipo}`);
  const keys = [];

  if (base.includes('lona')) keys.push('lona');
  if (base.includes('vinil') || formInferido.conImpresion) keys.push('vinil', 'tinta');
  if (base.includes('pvc')) keys.push('pvc');
  if (base.includes('acril') || base.includes('acrí')) keys.push('acril');
  if (base.includes('acm') || base.includes('fachada')) keys.push('acm');
  if (base.includes('led') || base.includes('luminos') || formInferido.iluminado) keys.push('led', 'fuente');
  if (base.includes('tubo') || base.includes('estructura') || formInferido.conPostes) keys.push('tubo', 'metal', 'poste');
  if (formInferido.instalacion) keys.push('instalacion', 'silicon', 'tornillo');

  return [...new Set(keys)];
}

function materialCoincide(material, key) {
  const base = txt(`${material.nombre || ''} ${material.categoria || ''} ${material.descripcion || ''} ${material.unidad || ''}`);
  return base.includes(txt(key));
}

function buscarMaterial(materiales, keys) {
  return materiales.find((m) => keys.some((k) => materialCoincide(m, k)));
}

function crearLinea({ nombre, tipo, unidad, cantidad, material }) {
  const costo = costoMaterial(material);
  return {
    id: `linea-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    nombre: material?.nombre || nombre,
    tipo,
    unidad: material?.unidad || unidad,
    cantidad: Number(cantidad || 1),
    costoUnitario: costo,
    materialId: material?.id || '',
    origen: material ? 'Material Master' : 'Manual',
  };
}

function armarLineasAutomaticas(form, materiales) {
  const area = n(form.ancho) * n(form.alto) * n(form.cantidad || 1);
  const perimetro = (n(form.ancho) + n(form.alto)) * 2 * n(form.cantidad || 1);
  const formInferido = inferirAtributos(form);
  const keys = detectarKeywords(formInferido);
  const lineas = [];

  const lona = buscarMaterial(materiales, ['lona']);
  const vinil = buscarMaterial(materiales, ['vinil']);
  const tinta = buscarMaterial(materiales, ['tinta', 'ecosolvente', 'uv']);
  const pvc = buscarMaterial(materiales, ['pvc']);
  const acrilico = buscarMaterial(materiales, ['acril', 'acrílico']);
  const acm = buscarMaterial(materiales, ['acm', 'alucobond']);
  const led = buscarMaterial(materiales, ['led']);
  const fuente = buscarMaterial(materiales, ['fuente']);
  const tubo = buscarMaterial(materiales, ['tubo', 'metal']);
  const tornillo = buscarMaterial(materiales, ['tornillo', 'remache', 'silicon', 'sellador']);
  const instalacion = buscarMaterial(materiales, ['instalacion', 'instalación', 'mano de obra']);

  if (keys.includes('lona')) {
    lineas.push(crearLinea({ nombre: 'Lona impresa', tipo: 'Impresión', unidad: 'm2', cantidad: area, material: lona }));
  }

  if (keys.includes('vinil') && !keys.includes('lona')) {
    lineas.push(crearLinea({ nombre: 'Vinil impreso / corte', tipo: 'Impresión', unidad: 'm2', cantidad: area, material: vinil }));
  }

  if (formInferido.conImpresion && tinta) {
    lineas.push(crearLinea({ nombre: 'Tinta / impresión', tipo: 'Impresión', unidad: 'm2', cantidad: area, material: tinta }));
  }

  if (keys.includes('pvc')) {
    lineas.push(crearLinea({ nombre: 'PVC', tipo: 'Material base', unidad: 'm2', cantidad: area, material: pvc }));
  }

  if (keys.includes('acril')) {
    lineas.push(crearLinea({ nombre: 'Acrílico', tipo: 'Material base', unidad: 'm2', cantidad: formInferido.dobleCara ? area * 2 : area, material: acrilico }));
  }

  if (keys.includes('acm')) {
    lineas.push(crearLinea({ nombre: 'ACM', tipo: 'Material base', unidad: 'm2', cantidad: area, material: acm }));
  }

  if (formInferido.iluminado) {
    lineas.push(crearLinea({ nombre: 'LED', tipo: 'Iluminación', unidad: 'servicio', cantidad: 1, material: led }));
    lineas.push(crearLinea({ nombre: 'Fuente eléctrica', tipo: 'Iluminación', unidad: 'servicio', cantidad: 1, material: fuente }));
  }

  if (formInferido.conPostes || keys.includes('tubo')) {
    lineas.push(crearLinea({ nombre: 'Estructura / tubo metálico', tipo: 'Estructura', unidad: 'metro lineal', cantidad: perimetro || 1, material: tubo }));
  }

  if (formInferido.instalacion) {
    lineas.push(crearLinea({ nombre: 'Fijación / instalación', tipo: 'Instalación', unidad: 'servicio', cantidad: 1, material: instalacion || tornillo }));
  }

  if (lineas.length === 0) {
    const generico = keys.length > 0 ? buscarMaterial(materiales, keys) : materiales[0];
    lineas.push(crearLinea({ nombre: 'Material principal', tipo: 'Material', unidad: 'm2', cantidad: area || 1, material: generico }));
  }

  return lineas;
}

export default function CotizadorDirecto() {
  const [materiales, setMateriales] = useState([]);
  const [mensaje, setMensaje] = useState('');

  const [form, setForm] = useState({
    cliente: '',
    empresa: '',
    descripcion: '',
    tipo: '',
    ancho: 1,
    alto: 1,
    cantidad: 1,
    conImpresion: true,
    dobleCara: false,
    iluminado: false,
    conPostes: false,
    instalacion: true,
    iva: true,
    margenA: 30,
    margenB: 45,
    margenC: 60,
    precioElegido: 'B',
  });

  const [lineas, setLineas] = useState([]);

  useEffect(() => {
    const cargar = async () => {
      const { data, error } = await supabase.from('materiales_master').select('*').order('categoria');

      if (error) {
        setMensaje(`No se pudo cargar Material Master: ${error.message}`);
        setMateriales([]);
      } else {
        setMateriales(data || []);
      }
    };

    cargar();
  }, []);

  const actualizar = (campo, valor) => setForm((prev) => ({ ...prev, [campo]: valor }));

  const generar = () => {
    const formInferido = inferirAtributos(form);
    const nuevas = armarLineasAutomaticas(formInferido, materiales);
    setForm(formInferido);
    setLineas(nuevas);
  };

  const agregarLinea = () => {
    setLineas((prev) => [
      ...prev,
      {
        id: `manual-${Date.now()}`,
        nombre: 'Línea manual',
        tipo: 'Manual',
        unidad: 'servicio',
        cantidad: 1,
        costoUnitario: 0,
        materialId: '',
        origen: 'Manual',
      },
    ]);
  };

  const actualizarLinea = (id, campo, valor) => {
    setLineas((prev) =>
      prev.map((l) => (l.id === id ? { ...l, [campo]: campo.includes('costo') || campo === 'cantidad' ? Number(valor || 0) : valor } : l))
    );
  };

  const eliminarLinea = (id) => setLineas((prev) => prev.filter((l) => l.id !== id));

  const resumen = useMemo(() => {
    const subtotalCosto = lineas.reduce((acc, l) => acc + n(l.cantidad) * n(l.costoUnitario), 0);
    const precioA = subtotalCosto * (1 + n(form.margenA) / 100);
    const precioB = subtotalCosto * (1 + n(form.margenB) / 100);
    const precioC = subtotalCosto * (1 + n(form.margenC) / 100);
    const baseElegida = form.precioElegido === 'A' ? precioA : form.precioElegido === 'C' ? precioC : precioB;
    const iva = form.iva ? baseElegida * 0.15 : 0;
    const total = baseElegida + iva;
    const anticipo = total * 0.6;
    const saldo = total - anticipo;

    return { subtotalCosto, precioA, precioB, precioC, baseElegida, iva, total, anticipo, saldo };
  }, [lineas, form]);

  const alcance = [
    formInferido.conImpresion && 'Impresión',
    formInferido.dobleCara && 'Doble cara',
    formInferido.iluminado && 'Iluminación',
    formInferido.conPostes && 'Postes / estructura',
    formInferido.instalacion && 'Instalación',
    form.iva && 'IVA',
  ].filter(Boolean);

  const guardar = () => {
    const payload = {
      id: `cot-dir-${Date.now()}`,
      fecha: new Date().toISOString(),
      form,
      lineas,
      resumen,
      alcance,
    };

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
        <p>Busca materiales directamente en Material Master. No depende de Biblioteca Técnica.</p>
      </section>

      <section className="cd-grid no-print">
        <form className="cd-card" onSubmit={(e) => { e.preventDefault(); generar(); }}>
          <div className="cd-title"><Search size={20} /><h2>Orden del vendedor</h2></div>

          <input placeholder="Cliente" value={form.cliente} onChange={(e) => actualizar('cliente', e.target.value)} />
          <input placeholder="Empresa" value={form.empresa} onChange={(e) => actualizar('empresa', e.target.value)} />
          <textarea placeholder="Descripción: ej. impresión en lona 3x1 m con instalación" value={form.descripcion} onChange={(e) => actualizar('descripcion', e.target.value)} />

          <div className="two">
            <input type="number" step="0.01" placeholder="Ancho m" value={form.ancho} onChange={(e) => actualizar('ancho', e.target.value)} />
            <input type="number" step="0.01" placeholder="Alto m" value={form.alto} onChange={(e) => actualizar('alto', e.target.value)} />
          </div>

          <input type="number" step="1" placeholder="Cantidad" value={form.cantidad} onChange={(e) => actualizar('cantidad', e.target.value)} />

          <p className="hint">El sistema detecta impresión, estructura, iluminación, instalación e IVA desde la descripción.</p>

          <button className="primary" type="submit"><Calculator size={18} /> Desmenuzar y calcular</button>
        </form>

        <section className="cd-card">
          <div className="cd-title"><FileText size={20} /><h2>Precios sugeridos</h2></div>

          <div className="three">
            <label>Mínimo %<input type="number" value={form.margenA} onChange={(e) => actualizar('margenA', e.target.value)} /></label>
            <label>Recomendado %<input type="number" value={form.margenB} onChange={(e) => actualizar('margenB', e.target.value)} /></label>
            <label>Objetivo %<input type="number" value={form.margenC} onChange={(e) => actualizar('margenC', e.target.value)} /></label>
          </div>

          <article className="price-row">
            <label><input type="radio" checked={form.precioElegido === 'A'} onChange={() => actualizar('precioElegido', 'A')} /> Precio mínimo</label>
            <b>{money(resumen.precioA)}</b>
          </article>

          <article className="price-row recommended">
            <label><input type="radio" checked={form.precioElegido === 'B'} onChange={() => actualizar('precioElegido', 'B')} /> Precio recomendado</label>
            <b>{money(resumen.precioB)}</b>
          </article>

          <article className="price-row">
            <label><input type="radio" checked={form.precioElegido === 'C'} onChange={() => actualizar('precioElegido', 'C')} /> Precio objetivo</label>
            <b>{money(resumen.precioC)}</b>
          </article>

          <div className="total-box">
            <p><span>Subtotal venta</span><b>{money(resumen.baseElegida)}</b></p>
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
        <div className="cd-title"><PlusCircle size={20} /><h2>Materiales detectados</h2></div>

        <button className="secondary" type="button" onClick={agregarLinea}>Agregar línea manual</button>

        <div className="lineas">
          {lineas.map((l) => (
            <article className="linea" key={l.id}>
              <input value={l.nombre} onChange={(e) => actualizarLinea(l.id, 'nombre', e.target.value)} />
              <input value={l.tipo} onChange={(e) => actualizarLinea(l.id, 'tipo', e.target.value)} />
              <input value={l.unidad} onChange={(e) => actualizarLinea(l.id, 'unidad', e.target.value)} />
              <input type="number" step="0.01" value={l.cantidad} onChange={(e) => actualizarLinea(l.id, 'cantidad', e.target.value)} />
              <input type="number" step="0.01" value={l.costoUnitario} onChange={(e) => actualizarLinea(l.id, 'costoUnitario', e.target.value)} />
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

        <h3>Alcance incluido</h3>
        <ul>{alcance.map((a) => <li key={a}>{a}</li>)}</ul>

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
        input,textarea{width:100%;border:1px solid #dbe3ef;border-radius:16px;padding:13px;font-size:16px;margin-bottom:10px}
        textarea{min-height:90px}
        .two{display:grid;grid-template-columns:1fr 1fr;gap:10px}.three{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
        .checks{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:8px 0}.checks label{font-weight:900;color:#334155}
        .primary,.secondary{width:100%;border:0;border-radius:18px;padding:14px;font-weight:950;font-size:15px;display:flex;align-items:center;justify-content:center;gap:8px;cursor:pointer;margin-top:8px}
        .primary{background:#111827;color:#fff}.secondary{background:#eef2ff;color:#3730a3}
        .price-row{display:flex;justify-content:space-between;gap:10px;align-items:center;border:1px solid #e5e7eb;border-radius:18px;padding:12px;margin-bottom:8px}
        .price-row label{font-weight:950;color:#334155}.price-row input{width:auto;margin:0 6px 0 0}.price-row b{font-size:20px;color:#111827}
        .recommended{background:#f8fafc;border-color:#111827}
        .total-box{background:#0f172a;color:#fff;border-radius:20px;padding:14px;margin-top:10px}.total-box p{display:flex;justify-content:space-between;margin:6px 0}
        .lineas{display:grid;gap:8px;margin-top:12px}.linea{display:grid;grid-template-columns:1.4fr 1fr .8fr .7fr .8fr .8fr .8fr 42px;gap:8px;align-items:center;background:#f8fafc;border:1px solid #e5e7eb;border-radius:16px;padding:10px}.linea input{margin:0}.linea button{border:0;background:#fee2e2;color:#991b1b;border-radius:12px;height:42px}.msg{font-weight:900;color:#0f766e}.hint{background:#f8fafc;border:1px solid #e5e7eb;border-radius:16px;padding:12px;color:#475569;font-weight:850}
        .print-area{display:none}
        @media(max-width:900px){.cd-grid,.two,.three,.checks{grid-template-columns:1fr}.linea{grid-template-columns:1fr}.cot-directo{padding-bottom:90px}}
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
