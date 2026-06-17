import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, FileText, ImagePlus, Sparkles } from 'lucide-react';
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

export default function CotizadorInteligente() {
  const [form, setForm] = useState(inicial);
  const [biblioteca, setBiblioteca] = useState([]);
  const [componentes, setComponentes] = useState([]);
  const [materiales, setMateriales] = useState([]);
  const [tintas, setTintas] = useState([]);
  const [tecnologias, setTecnologias] = useState([]);
  const [analizado, setAnalizado] = useState(false);
  const [bibliotecaSeleccionadaId, setBibliotecaSeleccionadaId] = useState('');

  const cargarTodo = async () => {
    const [bt, bc, mat, tin, tec] = await Promise.all([
      supabase.from('biblioteca_tecnica').select('*').eq('estado', 'activo').order('nombre'),
      supabase.from('biblioteca_componentes').select('*').eq('estado', 'activo').order('orden'),
      supabase.from('materiales_master').select('*').eq('activo', true).order('categoria'),
      supabase.from('tintas_master').select('*').eq('activo', true).order('nombre'),
      supabase.from('tecnologias_impresion').select('*').eq('estado', 'activo').order('nombre'),
    ]);

    if (!bt.error) setBiblioteca(bt.data || []);
    if (!bc.error) setComponentes(bc.data || []);
    if (!mat.error) setMateriales(mat.data || []);
    if (!tin.error) setTintas(tin.data || []);
    if (!tec.error) setTecnologias(tec.data || []);
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
      };
    });
  }, [componentesReceta, medidas, materiales]);

  const tintaSeleccionada = useMemo(() => {
    if (!form.tecnologiaId) return null;
    const tecnologia = tecnologias.find((t) => t.id === form.tecnologiaId);
    if (!tecnologia) return null;
    return tintas.find((t) => String(t.nombre || '').toLowerCase().includes(String(tecnologia.nombre || '').toLowerCase())) || null;
  }, [form.tecnologiaId, tecnologias, tintas]);

  const costoMateriales = useMemo(() => despiece.reduce((acc, item) => acc + num(item.costo), 0), [despiece]);
  const costoTinta = useMemo(() => medidas.area * num(tintaSeleccionada?.costo_m2), [medidas.area, tintaSeleccionada]);
  const costoProduccion = costoMateriales + costoTinta;
  const precios = calcularEscalas(costoProduccion);

  const estadoCotizacion = !bibliotecaSugerida
    ? 'Pendiente validación'
    : componentesReceta.length === 0
      ? 'En revisión administrativa'
      : costoProduccion > 0
        ? 'Cotizable'
        : 'Bloqueado';

  const analizar = () => {
    setAnalizado(true);
    if (tecnologiasCompatibles.length > 0 && !form.tecnologiaId) {
      setForm((prev) => ({ ...prev, tecnologiaId: tecnologiasCompatibles[0].id }));
    }
  };

  return (
    <main className="mm3-page">
      <section className="mm3-hero">
        <span>ELANVISIÓN · CI-03</span>
        <h1>Cotizador Inteligente</h1>
        <p>Descripción libre, medidas exactas, motor constructivo y precios A/B/C.</p>
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

          <button className="primary" type="submit"><CheckCircle2 size={18} /> Analizar y costear</button>
        </form>

        <section className="mm3-card">
          <div className="title"><FileText size={20} /><h2>Resultado comercial</h2></div>

          <div className="result">Estado: <b>{estadoCotizacion}</b></div>
          <div className="result">Área: <b>{medidas.area.toFixed(2)} m²</b></div>
          <div className="result">Perímetro: <b>{medidas.perimetro.toFixed(2)} ml</b></div>

          <div className="result">Receta: <b>{bibliotecaSugerida?.nombre || 'No detectada'}</b></div>
          <div className="result">Costo producción: <b>{money(costoProduccion)}</b></div>

          <article className="row">
            <div>
              <h3>A · Comercial</h3>
              <p>Utilidad 100%</p>
              <span>{money(precios.a)}</span>
            </div>
          </article>

          <article className="row">
            <div>
              <h3>B · Recomendado</h3>
              <p>Utilidad 150%</p>
              <span>{money(precios.b)}</span>
            </div>
          </article>

          <article className="row">
            <div>
              <h3>C · Premium</h3>
              <p>Utilidad 200%</p>
              <span>{money(precios.c)}</span>
            </div>
          </article>
        </section>
      </section>

      {analizado && (
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
                    <span>
                      Cantidad: {item.cantidad.toFixed(2)} · Costo unitario: {money(item.costoUnitario)} · Total: {money(item.costo)}
                    </span>
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
      )}
    </main>
  );
}
