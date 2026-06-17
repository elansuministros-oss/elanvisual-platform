import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, FileText, ImagePlus, Printer, Sparkles, Wrench } from 'lucide-react';
import { supabase } from '../lib/supabase';

const money = (v) =>
  new Intl.NumberFormat('es-NI', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(Number(v || 0));

const num = (v) => Number(v || 0);

const inicial = {
  clienteNombre: '',
  celular: '',
  ubicacion: '',
  descripcion: '',
  ancho: '',
  alto: '',
  cantidad: 1,
  instalacion: true,
  iva: true,
  tecnologiaId: '',
};

function calcularMedidas({ ancho, alto, cantidad }) {
  const a = num(ancho);
  const h = num(alto);
  const c = Math.max(num(cantidad), 1);

  return {
    ancho: a,
    alto: h,
    cantidad: c,
    area: a * h * c,
    perimetro: (a + h) * 2 * c,
  };
}

function calcularCantidadPorFormula(formula, medidas, factor = 1, desperdicio = 0) {
  const f = num(factor) || 1;
  const d = 1 + num(desperdicio) / 100;

  if (formula === 'area') return medidas.area * f * d;
  if (formula === 'perimetro') return medidas.perimetro * f * d;
  if (formula === 'cantidad') return medidas.cantidad * f * d;
  if (formula === 'area_x_factor') return medidas.area * f * d;
  if (formula === 'perimetro_x_factor') return medidas.perimetro * f * d;

  return f * d;
}

function calcularEscalas(costo) {
  return {
    a: costo * 2,
    b: costo * 2.5,
    c: costo * 3,
  };
}

function interpretarSolicitud(texto) {
  const t = String(texto || '').toLowerCase();

  if (t.includes('totem') || t.includes('tótem')) return 'totem';
  if (t.includes('poste')) return 'totem';
  if (t.includes('jala') || t.includes('bandera')) return 'jalavista';
  if (t.includes('vehicular') || t.includes('carro') || t.includes('camioneta')) return 'rotulacion_vehicular';
  if (t.includes('luminoso') && t.includes('lona')) return 'rotulo_luminoso_lona';
  if (t.includes('luminoso') && t.includes('acril')) return 'rotulo_luminoso_acrilico';
  if (t.includes('letra') && t.includes('cajuela')) return 'letras_cajuela';
  if (t.includes('letra')) return 'letras_3d';
  if (t.includes('micro')) return 'microperforado';
  if (t.includes('vinil')) return 'vinil_vitrina';
  if (t.includes('banner') || t.includes('roll')) return 'banner_rollup';

  return '';
}

function seleccionarReglaConstructiva(reglas, medidas, tipoTrabajo) {
  const candidatas = reglas.filter((r) => {
    const tipoOk = !r.tipo_trabajo || r.tipo_trabajo === tipoTrabajo;
    const anchoOk = medidas.ancho >= num(r.ancho_min) && medidas.ancho <= num(r.ancho_max);
    const altoOk = medidas.alto >= num(r.alto_min) && medidas.alto <= num(r.alto_max);
    const areaOk = medidas.area >= num(r.area_min) && medidas.area <= num(r.area_max);
    return tipoOk && anchoOk && altoOk && areaOk;
  });

  return candidatas[0] || null;
}

function calcularPostes(regla, medidas) {
  if (!regla?.requiere_poste) return 0;
  const base = Math.ceil(medidas.ancho / Math.max(num(regla.separacion_postes_m), 1));
  return Math.max(base, num(regla.postes_min));
}

function construirObraCivil(postes) {
  if (postes <= 0) return [];

  return [
    { nombre: 'Concreto', unidad: 'm3', cantidad: postes * 0.08 },
    { nombre: 'Arena', unidad: 'm3', cantidad: postes * 0.04 },
    { nombre: 'Piedrín', unidad: 'm3', cantidad: postes * 0.04 },
    { nombre: 'Varilla', unidad: 'unidad', cantidad: postes * 2 },
    { nombre: 'Excavación', unidad: 'servicio', cantidad: postes },
  ];
}

function buscarCosto(materiales, nombre) {
  const q = String(nombre || '').toLowerCase();
  return materiales.find((m) =>
    `${m.nombre} ${m.categoria} ${m.unidad_compra}`.toLowerCase().includes(q)
  );
}

function fechaHoraCotizacion() {
  const ahora = new Date();
  const vence = new Date(ahora);
  vence.setDate(vence.getDate() + 8);

  return {
    fecha: ahora.toLocaleDateString('es-NI'),
    hora: ahora.toLocaleTimeString('es-NI', { hour: '2-digit', minute: '2-digit' }),
    vence: vence.toLocaleDateString('es-NI'),
  };
}

export default function CotizadorInteligente() {
  const [form, setForm] = useState(inicial);
  const [biblioteca, setBiblioteca] = useState([]);
  const [componentes, setComponentes] = useState([]);
  const [materiales, setMateriales] = useState([]);
  const [tintas, setTintas] = useState([]);
  const [tecnologias, setTecnologias] = useState([]);
  const [reglas, setReglas] = useState([]);
  const [analizado, setAnalizado] = useState(false);
  const [bibliotecaSeleccionadaId, setBibliotecaSeleccionadaId] = useState('');
  const [fechaPdf, setFechaPdf] = useState(fechaHoraCotizacion());
  const [adjuntos, setAdjuntos] = useState({
    logo: '',
    diseno: '',
    fotoLocal: '',
    referencia: '',
  });

  const [montaje, setMontaje] = useState({
    logoX: 50,
    logoY: 35,
    logoW: 42,
  });

  const cargarAdjunto = (tipo, file) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setAdjuntos((prev) => ({ ...prev, [tipo]: url }));
  };

  const imagenPrincipal = adjuntos.fotoLocal || adjuntos.referencia || adjuntos.diseno || adjuntos.logo || '';
  const tieneFotomontaje = Boolean(adjuntos.fotoLocal && adjuntos.logo);

  const cargarTodo = async () => {
    const [bt, bc, mat, tin, tec, reg] = await Promise.all([
      supabase.from('biblioteca_tecnica').select('*').eq('estado', 'activo').order('nombre'),
      supabase.from('biblioteca_componentes').select('*').eq('estado', 'activo').order('orden'),
      supabase.from('materiales_master').select('*').eq('activo', true).order('categoria'),
      supabase.from('tintas_master').select('*').eq('activo', true).order('nombre'),
      supabase.from('tecnologias_impresion').select('*').eq('estado', 'activo').order('nombre'),
      supabase.from('reglas_constructivas').select('*').eq('activo', true).order('area_min'),
    ]);

    if (!bt.error) setBiblioteca(bt.data || []);
    if (!bc.error) setComponentes(bc.data || []);
    if (!mat.error) setMateriales(mat.data || []);
    if (!tin.error) setTintas(tin.data || []);
    if (!tec.error) setTecnologias(tec.data || []);
    if (!reg.error) setReglas(reg.data || []);
  };

  useEffect(() => {
    cargarTodo();
  }, []);

  const medidas = useMemo(() => calcularMedidas(form), [form]);
  const tipoDetectado = useMemo(() => interpretarSolicitud(form.descripcion), [form.descripcion]);

  const bibliotecaSugerida = useMemo(() => {
    if (bibliotecaSeleccionadaId) return biblioteca.find((b) => b.id === bibliotecaSeleccionadaId) || null;
    if (!tipoDetectado) return null;

    return (
      biblioteca.find((b) => b.tipo_trabajo === tipoDetectado) ||
      biblioteca.find((b) => String(b.nombre || '').toLowerCase().includes(tipoDetectado.replaceAll('_', ' '))) ||
      null
    );
  }, [biblioteca, bibliotecaSeleccionadaId, tipoDetectado]);

  const reglaConstructiva = useMemo(
    () => seleccionarReglaConstructiva(reglas, medidas, bibliotecaSugerida?.tipo_trabajo || tipoDetectado),
    [reglas, medidas, bibliotecaSugerida, tipoDetectado]
  );

  const postes = useMemo(() => calcularPostes(reglaConstructiva, medidas), [reglaConstructiva, medidas]);

  const refuerzos = useMemo(() => {
    if (!reglaConstructiva?.requiere_refuerzo) return 0;
    return Math.ceil(medidas.ancho / Math.max(num(reglaConstructiva.separacion_refuerzo_m), 0.5));
  }, [reglaConstructiva, medidas]);

  const obraCivil = useMemo(() => construirObraCivil(postes), [postes]);

  const componentesReceta = useMemo(() => {
    if (!bibliotecaSugerida?.id) return [];
    return componentes.filter((c) => c.biblioteca_id === bibliotecaSugerida.id);
  }, [componentes, bibliotecaSugerida]);

  const tecnologiasCompatibles = useMemo(() => {
    if (!bibliotecaSugerida) return tecnologias;

    const compat = Array.isArray(bibliotecaSugerida.compatible_con)
      ? bibliotecaSugerida.compatible_con.map((x) => String(x).toLowerCase())
      : [];

    if (compat.length === 0) return tecnologias;

    return tecnologias.filter((t) => {
      const tc = Array.isArray(t.compatible_con) ? t.compatible_con.map((x) => String(x).toLowerCase()) : [];
      return tc.some((x) => compat.includes(x));
    });
  }, [bibliotecaSugerida, tecnologias]);

  const despiece = useMemo(() => {
    return componentesReceta.map((c) => {
      const cantidad = calcularCantidadPorFormula(c.formula_calculo, medidas, c.factor, c.desperdicio_extra);
      const material = materiales.find((m) => m.id === c.material_id);
      const costoUnitario = num(material?.costo_real);
      const costo = cantidad * costoUnitario;

      return {
        ...c,
        cantidad,
        material,
        costoUnitario,
        costo,
        faltaCosto: c.requiere_costo !== false && costoUnitario <= 0,
      };
    });
  }, [componentesReceta, medidas, materiales]);

  const estructuraCalculada = useMemo(() => {
    if (!reglaConstructiva) return [];

    const principal = buscarCosto(materiales, reglaConstructiva.tubo_principal);
    const secundario = buscarCosto(materiales, reglaConstructiva.tubo_secundario);

    const mlPrincipal = medidas.perimetro;
    const mlSecundario = refuerzos * medidas.alto;

    return [
      {
        nombre: reglaConstructiva.tubo_principal || 'Tubo principal',
        unidad: 'Metro lineal',
        cantidad: mlPrincipal,
        material: principal,
        costoUnitario: num(principal?.costo_real),
        costo: mlPrincipal * num(principal?.costo_real),
      },
      {
        nombre: reglaConstructiva.tubo_secundario || 'Tubo secundario',
        unidad: 'Metro lineal',
        cantidad: mlSecundario,
        material: secundario,
        costoUnitario: num(secundario?.costo_real),
        costo: mlSecundario * num(secundario?.costo_real),
      },
    ].filter((x) => x.cantidad > 0);
  }, [reglaConstructiva, materiales, medidas, refuerzos]);

  const obraCivilCosteada = useMemo(() => {
    return obraCivil.map((item) => {
      const material = buscarCosto(materiales, item.nombre);
      const costoUnitario = num(material?.costo_real);
      return {
        ...item,
        material,
        costoUnitario,
        costo: item.cantidad * costoUnitario,
        faltaCosto: costoUnitario <= 0,
      };
    });
  }, [obraCivil, materiales]);

  const tintaSeleccionada = useMemo(() => {
    if (!form.tecnologiaId) return null;
    const tecnologia = tecnologias.find((t) => t.id === form.tecnologiaId);
    if (!tecnologia) return null;
    return tintas.find((t) => String(t.nombre || '').toLowerCase().includes(String(tecnologia.nombre || '').toLowerCase())) || null;
  }, [form.tecnologiaId, tecnologias, tintas]);

  const costoMateriales = useMemo(() => despiece.reduce((acc, item) => acc + num(item.costo), 0), [despiece]);
  const costoEstructura = useMemo(() => estructuraCalculada.reduce((acc, item) => acc + num(item.costo), 0), [estructuraCalculada]);
  const costoObraCivil = useMemo(() => obraCivilCosteada.reduce((acc, item) => acc + num(item.costo), 0), [obraCivilCosteada]);
  const costoTinta = useMemo(() => medidas.area * num(tintaSeleccionada?.costo_m2), [medidas.area, tintaSeleccionada]);

  const costoProduccion = costoMateriales + costoEstructura + costoObraCivil + costoTinta;
  const precios = calcularEscalas(costoProduccion);

  const faltantes = useMemo(() => {
    const f = [];

    despiece.forEach((i) => {
      if (i.faltaCosto) f.push({ item_nombre: i.nombre, descripcion: 'Componente de biblioteca sin costo validado.', unidad: i.unidad });
    });

    estructuraCalculada.forEach((i) => {
      if (num(i.costoUnitario) <= 0) f.push({ item_nombre: i.nombre, descripcion: 'Material estructural sin costo validado.', unidad: i.unidad });
    });

    obraCivilCosteada.forEach((i) => {
      if (i.faltaCosto) f.push({ item_nombre: i.nombre, descripcion: 'Obra civil sin costo validado.', unidad: i.unidad });
    });

    if (form.tecnologiaId && !tintaSeleccionada) {
      f.push({ item_nombre: 'Tinta tecnología seleccionada', descripcion: 'No existe tinta compatible registrada.', unidad: 'm2' });
    }

    return f;
  }, [despiece, estructuraCalculada, obraCivilCosteada, form.tecnologiaId, tintaSeleccionada]);

  const estadoCotizacion = !bibliotecaSugerida
    ? 'Pendiente validación'
    : componentesReceta.length === 0
      ? 'En revisión administrativa'
      : faltantes.length > 0
        ? 'Bloqueado'
        : costoProduccion > 0
          ? 'Cotizable'
          : 'Bloqueado';

  const crearSolicitudesFaltantes = async () => {
    if (faltantes.length === 0) return;

    const payload = faltantes.map((f) => ({
      origen: 'cotizador_inteligente',
      item_nombre: f.item_nombre,
      descripcion: f.descripcion,
      unidad: f.unidad,
      cantidad_referencia: medidas.area || medidas.perimetro || medidas.cantidad,
      estado: 'pendiente_validacion',
      prioridad: 'alta',
      moneda: 'USD',
    }));

    await supabase.from('solicitudes_costos').insert(payload);
  };

  const imprimirPDF = () => {
    setFechaPdf(fechaHoraCotizacion());
    setTimeout(() => window.print(), 150);
  };

  const analizar = async () => {
    setAnalizado(true);

    if (tecnologiasCompatibles.length > 0 && !form.tecnologiaId) {
      setForm((prev) => ({ ...prev, tecnologiaId: tecnologiasCompatibles[0].id }));
    }

    await crearSolicitudesFaltantes();
  };

  return (
    <main className="mm3-page">
      <section className="mm3-hero">
        <span>ELANVISIÓN · CI-05</span>
        <h1>Cotizador Inteligente</h1>
        <p>Motor comercial, constructivo, estructura, obra civil, precios A/B/C y PDF profesional.</p>
      </section>

      <section className="mm3-grid">
        <form className="mm3-card" onSubmit={(e) => { e.preventDefault(); analizar(); }}>
          <div className="title"><Sparkles size={20} /><h2>Solicitud del cliente</h2></div>

          <input placeholder="Nombre cliente" value={form.clienteNombre} onChange={(e) => setForm({ ...form, clienteNombre: e.target.value })} />
          <input placeholder="Celular" value={form.celular} onChange={(e) => setForm({ ...form, celular: e.target.value })} />
          <input placeholder="Ubicación" value={form.ubicacion} onChange={(e) => setForm({ ...form, ubicacion: e.target.value })} />

          <textarea
            placeholder="Descripción libre del trabajo"
            value={form.descripcion}
            onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
            required
          />

          <div className="two">
            <input type="number" step="0.01" placeholder="Ancho m" value={form.ancho} onChange={(e) => setForm({ ...form, ancho: e.target.value })} required />
            <input type="number" step="0.01" placeholder="Alto m" value={form.alto} onChange={(e) => setForm({ ...form, alto: e.target.value })} required />
          </div>

          <input type="number" step="1" placeholder="Cantidad" value={form.cantidad} onChange={(e) => setForm({ ...form, cantidad: e.target.value })} />

          <div className="two">
            <label><input type="checkbox" checked={form.instalacion} onChange={(e) => setForm({ ...form, instalacion: e.target.checked })} /> Instalación</label>
            <label><input type="checkbox" checked={form.iva} onChange={(e) => setForm({ ...form, iva: e.target.checked })} /> IVA</label>
          </div>

          <select value={bibliotecaSeleccionadaId} onChange={(e) => setBibliotecaSeleccionadaId(e.target.value)}>
            <option value="">Receta sugerida por IA</option>
            {biblioteca.map((b) => <option key={b.id} value={b.id}>{b.nombre}</option>)}
          </select>

          <select value={form.tecnologiaId} onChange={(e) => setForm({ ...form, tecnologiaId: e.target.value })}>
            <option value="">Tecnología compatible</option>
            {tecnologiasCompatibles.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
          </select>

          <section className="mm3-card">
            <div className="title"><ImagePlus size={20} /><h2>Adjuntos comerciales</h2></div>

            <label>Logo del cliente</label>
            <input type="file" accept="image/*" onChange={(e) => cargarAdjunto('logo', e.target.files?.[0])} />

            <label>Diseño / arte recibido</label>
            <input type="file" accept="image/*" onChange={(e) => cargarAdjunto('diseno', e.target.files?.[0])} />

            <label>Foto del local</label>
            <input type="file" accept="image/*" onChange={(e) => cargarAdjunto('fotoLocal', e.target.files?.[0])} />

            <label>Imagen referencia</label>
            <input type="file" accept="image/*" onChange={(e) => cargarAdjunto('referencia', e.target.files?.[0])} />

            {imagenPrincipal && (
              <div className="pdf-preview-box">
                {tieneFotomontaje ? (
                  <div className="montaje-box">
                    <img className="montaje-fondo" src={adjuntos.fotoLocal} alt="Foto local" />
                    <img
                      className="montaje-logo"
                      src={adjuntos.logo}
                      alt="Logo cliente"
                      style={{
                        left: `${montaje.logoX}%`,
                        top: `${montaje.logoY}%`,
                        width: `${montaje.logoW}%`,
                      }}
                    />
                  </div>
                ) : (
                  <img src={imagenPrincipal} alt="Vista comercial preliminar" />
                )}
              </div>
            )}

            {tieneFotomontaje && (
              <section className="mm3-card">
                <div className="title"><ImagePlus size={20} /><h2>Ajuste de fotomontaje</h2></div>

                <label>Posición horizontal</label>
                <input type="range" min="0" max="100" value={montaje.logoX} onChange={(e) => setMontaje({ ...montaje, logoX: Number(e.target.value) })} />

                <label>Posición vertical</label>
                <input type="range" min="0" max="100" value={montaje.logoY} onChange={(e) => setMontaje({ ...montaje, logoY: Number(e.target.value) })} />

                <label>Tamaño del logo</label>
                <input type="range" min="10" max="90" value={montaje.logoW} onChange={(e) => setMontaje({ ...montaje, logoW: Number(e.target.value) })} />
              </section>
            )}
          </section>

          <button className="primary" type="submit"><CheckCircle2 size={18} /> Analizar y costear</button>

          {analizado && (
            <button className="primary" type="button" onClick={imprimirPDF}>
              <Printer size={18} /> Generar PDF ELANVISIÓN
            </button>
          )}
        </form>

        <section className="mm3-card">
          <div className="title"><FileText size={20} /><h2>Resultado comercial</h2></div>

          <div className="result">Estado: <b>{estadoCotizacion}</b></div>
          <div className="result">Área: <b>{medidas.area.toFixed(2)} m²</b></div>
          <div className="result">Perímetro: <b>{medidas.perimetro.toFixed(2)} ml</b></div>
          <div className="result">Receta: <b>{bibliotecaSugerida?.nombre || 'No detectada'}</b></div>
          <div className="result">Regla estructural: <b>{reglaConstructiva?.nombre || 'Sin regla'}</b></div>
          <div className="result">Costo producción: <b>{money(costoProduccion)}</b></div>

          <article className="row"><div><h3>A · Comercial</h3><p>Utilidad 100%</p><span>{money(precios.a)}</span></div></article>
          <article className="row"><div><h3>B · Recomendado</h3><p>Utilidad 150%</p><span>{money(precios.b)}</span></div></article>
          <article className="row"><div><h3>C · Premium</h3><p>Utilidad 200%</p><span>{money(precios.c)}</span></div></article>
        </section>
      </section>

      {analizado && (
        <>
          <section className="mm3-card">
            <div className="title"><Wrench size={20} /><h2>Motor constructivo</h2></div>

            <div className="list">
              <article className="row">
                <div>
                  <h3>Estructura</h3>
                  <p>
                    Principal: {reglaConstructiva?.tubo_principal || 'No definido'} ·
                    Secundario: {reglaConstructiva?.tubo_secundario || 'No definido'} ·
                    Chapa: {reglaConstructiva?.chapa || 'No definida'}
                  </p>
                  <span>
                    Profundidad: {num(reglaConstructiva?.profundidad_cm)} cm ·
                    Refuerzos: {refuerzos} ·
                    Postes: {postes}
                  </span>
                </div>
              </article>

              {estructuraCalculada.map((item) => (
                <article className="row" key={item.nombre}>
                  <div>
                    <h3>{item.nombre}</h3>
                    <p>{item.unidad}</p>
                    <span>Cantidad: {item.cantidad.toFixed(2)} · Unitario: {money(item.costoUnitario)} · Total: {money(item.costo)}</span>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="mm3-card">
            <div className="title"><ImagePlus size={20} /><h2>Despiece preliminar</h2></div>

            <div className="list">
              {despiece.length === 0 ? (
                <p className="note">No hay componentes cargados para esta receta. Administrá la Biblioteca Técnica.</p>
              ) : (
                despiece.map((item) => (
                  <article className="row" key={item.id}>
                    <div>
                      <h3>{item.nombre}</h3>
                      <p>{item.tipo_componente} · {item.formula_calculo} · {item.unidad}</p>
                      <span>Cantidad: {item.cantidad.toFixed(2)} · Unitario: {money(item.costoUnitario)} · Total: {money(item.costo)}</span>
                    </div>
                  </article>
                ))
              )}

              {tintaSeleccionada && (
                <article className="row">
                  <div>
                    <h3>Tinta {tintaSeleccionada.nombre}</h3>
                    <p>Área × costo m²</p>
                    <span>{medidas.area.toFixed(2)} m² · {money(tintaSeleccionada.costo_m2)} · Total: {money(costoTinta)}</span>
                  </div>
                </article>
              )}
            </div>
          </section>

          {postes > 0 && (
            <section className="mm3-card">
              <div className="title"><Wrench size={20} /><h2>Obra civil</h2></div>
              <div className="list">
                {obraCivilCosteada.map((item) => (
                  <article className="row" key={item.nombre}>
                    <div>
                      <h3>{item.nombre}</h3>
                      <p>{item.unidad}</p>
                      <span>Cantidad: {item.cantidad.toFixed(2)} · Unitario: {money(item.costoUnitario)} · Total: {money(item.costo)}</span>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {faltantes.length > 0 && (
            <section className="mm3-card">
              <div className="title"><FileText size={20} /><h2>Costos faltantes</h2></div>
              <p className="note">Se crearán solicitudes automáticas para administración. La cotización queda bloqueada hasta validar costos.</p>
              <div className="list">
                {faltantes.map((f, idx) => (
                  <article className="row" key={`${f.item_nombre}-${idx}`}>
                    <div>
                      <h3>{f.item_nombre}</h3>
                      <p>{f.descripcion}</p>
                      <span>{f.unidad}</span>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}
        </>
      )}
          {analizado && (
        <section className="cotizacion-print">
          <div className="pdf-page">
            <header className="pdf-header">
              <div>
                <span>ELANVISIÓN</span>
                <h1>Cotización Comercial</h1>
                <p>Rótulos · Impresión · Estructuras · Producción visual</p>
              </div>
              <div className="pdf-meta">
                <strong>Fecha: {fechaPdf.fecha}</strong>
                <strong>Hora: {fechaPdf.hora}</strong>
                <strong>Validez: 8 días</strong>
                <strong>Vence: {fechaPdf.vence}</strong>
              </div>
            </header>

            <section className="pdf-client">
              <h2>Cliente</h2>
              <p><b>Nombre:</b> {form.clienteNombre || 'Cliente no especificado'}</p>
              <p><b>Celular:</b> {form.celular || 'No especificado'}</p>
              <p><b>Ubicación:</b> {form.ubicacion || 'No especificada'}</p>
            </section>

            <section className="pdf-image-box">
              {tieneFotomontaje ? (
                <div className="montaje-box print-montaje">
                  <img className="montaje-fondo" src={adjuntos.fotoLocal} alt="Foto local" />
                  <img
                    className="montaje-logo"
                    src={adjuntos.logo}
                    alt="Logo cliente"
                    style={{
                      left: `${montaje.logoX}%`,
                      top: `${montaje.logoY}%`,
                      width: `${montaje.logoW}%`,
                    }}
                  />
                </div>
              ) : imagenPrincipal ? (
                <img src={imagenPrincipal} alt="Vista comercial preliminar" />
              ) : (
                <div>
                  <h2>Vista comercial preliminar</h2>
                  <p>Render / referencia / fotomontaje pendiente de integración CI-06.</p>
                </div>
              )}
            </section>

            <section className="pdf-summary">
              <h2>Solicitud</h2>
              <p>{form.descripcion}</p>
              <p><b>Medidas:</b> {medidas.ancho.toFixed(2)} m × {medidas.alto.toFixed(2)} m · Cantidad: {medidas.cantidad}</p>
              <p><b>Área:</b> {medidas.area.toFixed(2)} m² · <b>Perímetro:</b> {medidas.perimetro.toFixed(2)} ml</p>
              <p><b>Receta:</b> {bibliotecaSugerida?.nombre || 'Pendiente validación'}</p>
            </section>

            <section className="pdf-table">
              <h2>Opciones comerciales</h2>
              <table>
                <thead>
                  <tr>
                    <th>Opción</th>
                    <th>Descripción</th>
                    <th>Total USD</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>A</td>
                    <td>Comercial</td>
                    <td>{money(precios.a)}</td>
                  </tr>
                  <tr>
                    <td>B</td>
                    <td>Recomendado</td>
                    <td>{money(precios.b)}</td>
                  </tr>
                  <tr>
                    <td>C</td>
                    <td>Premium</td>
                    <td>{money(precios.c)}</td>
                  </tr>
                </tbody>
              </table>
            </section>

            <section className="pdf-blocks">
              <div>
                <h3>Incluye</h3>
                <p>Producción según receta técnica, materiales costeados, estructura calculada y revisión comercial.</p>
              </div>
              <div>
                <h3>No incluye</h3>
                <p>Cambios de diseño no aprobados, obra civil adicional no calculada, permisos municipales o trabajos fuera de alcance.</p>
              </div>
              <div>
                <h3>Beneficios</h3>
                <p>Precio calculado con costos reales, margen protegido, validación técnica y opción de producción profesional.</p>
              </div>
              <div>
                <h3>Tiempo estimado</h3>
                <p>Sujeto a validación final de diseño, materiales disponibles y aprobación de anticipo.</p>
              </div>
            </section>

            <footer className="pdf-footer">
              <p>Esta cotización es una propuesta comercial preliminar. Arte final, producción y montaje se confirman después de aprobación.</p>
              <strong>ELANVISIÓN · Comunicación visual profesional</strong>
            </footer>
          </div>
        </section>
      )}

      <style>{`
        .cotizacion-print {
          display: none;
        }

        .pdf-preview-box {
          margin-top: 12px;
          border-radius: 16px;
          overflow: hidden;
          border: 1px solid #e5e7eb;
          background: #111827;
        }

        .pdf-preview-box img {
          width: 100%;
          max-height: 320px;
          object-fit: contain;
          display: block;
          background: #111827;
        }

        .montaje-box {
          position: relative;
          width: 100%;
          min-height: 260px;
          background: #111827;
          overflow: hidden;
        }

        .montaje-fondo {
          width: 100%;
          height: 100%;
          max-height: 420px;
          object-fit: contain;
          display: block;
        }

        .montaje-logo {
          position: absolute;
          transform: translate(-50%, -50%);
          max-height: 45%;
          object-fit: contain;
          filter: drop-shadow(0 8px 12px rgba(0,0,0,.35));
        }

        @media print {
          body * {
            visibility: hidden !important;
          }

          .cotizacion-print,
          .cotizacion-print * {
            visibility: visible !important;
          }

          .cotizacion-print {
            display: block !important;
            position: absolute;
            inset: 0;
            background: white;
            color: #111827;
            font-family: Arial, sans-serif;
          }

          .pdf-page {
            width: 100%;
            min-height: 100vh;
            padding: 28px;
            box-sizing: border-box;
          }

          .pdf-header {
            display: flex;
            justify-content: space-between;
            gap: 20px;
            border-bottom: 3px solid #111827;
            padding-bottom: 16px;
            margin-bottom: 18px;
          }

          .pdf-header span {
            font-size: 12px;
            letter-spacing: 2px;
            font-weight: 800;
          }

          .pdf-header h1 {
            margin: 4px 0;
            font-size: 30px;
          }

          .pdf-meta {
            display: grid;
            gap: 4px;
            text-align: right;
            font-size: 12px;
          }

          .pdf-client,
          .pdf-summary,
          .pdf-table,
          .pdf-blocks,
          .pdf-image-box {
            border: 1px solid #e5e7eb;
            border-radius: 16px;
            padding: 14px;
            margin-bottom: 14px;
          }

          .pdf-image-box {
            min-height: 280px;
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
            background: #f3f4f6;
            overflow: hidden;
          }

          .pdf-image-box img {
            width: 100%;
            max-height: 360px;
            object-fit: contain;
            display: block;
          }

          .print-montaje {
            width: 100%;
            min-height: 320px;
            background: #f3f4f6;
          }

          .print-montaje .montaje-fondo {
            max-height: 360px;
          }

          .pdf-table table {
            width: 100%;
            border-collapse: collapse;
          }

          .pdf-table th,
          .pdf-table td {
            border-bottom: 1px solid #e5e7eb;
            padding: 10px;
            text-align: left;
          }

          .pdf-table th {
            background: #111827;
            color: white;
          }

          .pdf-blocks {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
          }

          .pdf-blocks div {
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            padding: 10px;
          }

          .pdf-footer {
            margin-top: 20px;
            border-top: 2px solid #111827;
            padding-top: 12px;
            font-size: 12px;
          }

          @page {
            size: portrait;
            margin: 10mm;
          }
        }
      `}</style>
    </main>
  );
}



