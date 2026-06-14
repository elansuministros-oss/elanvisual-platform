import { useMemo, useState } from 'react';
import {
  Calculator,
  CheckCircle2,
  Edit3,
  Lock,
  PackagePlus,
  Search,
  Trash2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

const STORAGE_KEY = 'elanvisual_materiales_costos_v1';

const tiposRegistro = [
  'Material Base',
  'Producto Cotizable',
  'Servicio Operativo',
  'Producto Personalizado',
];

const categorias = [
  'Lonas',
  'Viniles Adhesivos',
  'Viniles + Laminación',
  'Viniles Alto Desempeño',
  'Otros Materiales',
  'Láminas Rígidas + Vinil',
  'Portabanner + Impresión',
  'Vinil de Corte',
  'PVC',
  'Acrílicos',
  'Rotulación',
  'Accesorios',
  'Mano de Obra',
  'Transporte',
  'Instalación',
];

const tiposCalculo = [
  { value: 'm2', label: 'm²' },
  { value: 'unidad', label: 'Unidad' },
  { value: 'lineal', label: 'Metro lineal' },
  { value: 'compuesto', label: 'Compuesto' },
  { value: 'personalizado', label: 'Personalizado' },
];

const tintas = ['Sin impresión', 'Solvente', 'UV'];
const protecciones = [
  'Ninguna',
  'Laminado brillante',
  'Laminado mate',
  'Laminante líquido UV',
  'Gráfica de piso',
];

const accesoriosBase = [
  { id: 'ojete', label: 'Ojete', regla: 'perimetro_separacion' },
  { id: 'tuboPVC', label: 'Tubo PVC', regla: 'dos_por_ancho' },
  { id: 'tuboGalvanizado', label: 'Tubo Galvanizado', regla: 'dos_por_ancho' },
  { id: 'bridas', label: 'Bridas', regla: 'perimetro_separacion' },
];

const inicial = {
  descripcion: '',
  tipoRegistro: 'Producto Cotizable',
  categoria: 'Lonas',
  subcategoria: '',
  tipoCalculo: 'm2',
  tinta: 'Solvente',
  proteccion: 'Ninguna',
  permiteMedidas: true,
  instalable: false,
  productoEstandar: true,
  anchoFijo: '',
  altoFijo: '',
  precioBase: '',
  iva: 15,
  tarifaA: '',
  tarifaB: '',
  tarifaC: '',
  tarifaD: '',
  descuentoMaximo: 20,
  accesoriosPermitidos: [],
  separacionOjetes: 0.5,
  separacionBridas: 0.5,
  activo: true,
  notas: '',
};

const money = (v) =>
  new Intl.NumberFormat('es-NI', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(Number(v || 0));

const num = (v) => Number(v || 0);

function leerMateriales() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function guardarMateriales(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export default function MaterialesCostos() {
  const { usuario } = useApp();
  const [materiales, setMateriales] = useState(leerMateriales);
  const [form, setForm] = useState(inicial);
  const [editando, setEditando] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [filtro, setFiltro] = useState('Todos');

  const esAdmin = usuario?.rol === 'admin';

  const calculo = useMemo(() => {
    const precio = num(form.precioBase);
    const ivaValor = precio * (num(form.iva) / 100);
    const totalConIva = precio + ivaValor;
    return { ivaValor, totalConIva };
  }, [form]);

  const lista = useMemo(() => {
    return materiales.filter((m) => {
      const texto = `${m.descripcion} ${m.categoria} ${m.subcategoria} ${m.tipoRegistro}`.toLowerCase();
      const coincideTexto = texto.includes(busqueda.toLowerCase());
      const coincideCategoria = filtro === 'Todos' || m.categoria === filtro;
      return coincideTexto && coincideCategoria;
    });
  }, [materiales, busqueda, filtro]);

  const actualizar = (campo, valor) => {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  };

  const toggleAccesorio = (id) => {
    setForm((prev) => {
      const existe = prev.accesoriosPermitidos.includes(id);
      return {
        ...prev,
        accesoriosPermitidos: existe
          ? prev.accesoriosPermitidos.filter((a) => a !== id)
          : [...prev.accesoriosPermitidos, id],
      };
    });
  };

  const guardar = (e) => {
    e.preventDefault();

    const registro = {
      ...form,
      id: editando || `mat-${Date.now()}`,
      anchoFijo: num(form.anchoFijo),
      altoFijo: num(form.altoFijo),
      precioBase: num(form.precioBase),
      iva: num(form.iva),
      tarifaA: num(form.tarifaA),
      tarifaB: num(form.tarifaB),
      tarifaC: num(form.tarifaC),
      tarifaD: num(form.tarifaD),
      descuentoMaximo: Math.min(20, num(form.descuentoMaximo)),
      separacionOjetes: num(form.separacionOjetes) || 0.5,
      separacionBridas: num(form.separacionBridas) || 0.5,
      totalConIva: calculo.totalConIva,
      actualizado: new Date().toISOString(),
    };

    const nuevaLista = editando
      ? materiales.map((m) => (m.id === editando ? registro : m))
      : [registro, ...materiales];

    setMateriales(nuevaLista);
    guardarMateriales(nuevaLista);
    setForm(inicial);
    setEditando(null);
  };

  const editar = (m) => {
    setForm({ ...inicial, ...m });
    setEditando(m.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const eliminar = (id) => {
    const nuevaLista = materiales.filter((m) => m.id !== id);
    setMateriales(nuevaLista);
    guardarMateriales(nuevaLista);
  };

  if (!esAdmin) {
    return (
      <main className="materiales-page">
        <section className="materiales-lock">
          <Lock size={42} />
          <h1>Acceso restringido</h1>
          <p>Materiales y Costos es exclusivo para administración.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="materiales-page">
      <section className="materiales-hero">
        <span>ELANVISUAL · Administración</span>
        <h1>Material Master V2</h1>
        <p>
          Catálogo maestro para productos cotizables, servicios operativos,
          accesorios automáticos, tarifas A/B/C/D e instalación.
        </p>
      </section>

      <section className="materiales-grid">
        <form className="materiales-card" onSubmit={guardar}>
          <div className="card-title">
            <PackagePlus size={22} />
            <h2>{editando ? 'Editar registro' : 'Agregar registro'}</h2>
          </div>

          <label>
            Descripción
            <input
              value={form.descripcion}
              onChange={(e) => actualizar('descripcion', e.target.value)}
              required
              placeholder="Lona Banner 13 oz"
            />
          </label>

          <div className="two">
            <label>
              Tipo registro
              <select value={form.tipoRegistro} onChange={(e) => actualizar('tipoRegistro', e.target.value)}>
                {tiposRegistro.map((t) => <option key={t}>{t}</option>)}
              </select>
            </label>

            <label>
              Categoría
              <select value={form.categoria} onChange={(e) => actualizar('categoria', e.target.value)}>
                {categorias.map((c) => <option key={c}>{c}</option>)}
              </select>
            </label>
          </div>

          <div className="two">
            <label>
              Subcategoría
              <input
                value={form.subcategoria}
                onChange={(e) => actualizar('subcategoria', e.target.value)}
                placeholder="Banner 13 oz, brillante, roll up..."
              />
            </label>

            <label>
              Tipo cálculo
              <select value={form.tipoCalculo} onChange={(e) => actualizar('tipoCalculo', e.target.value)}>
                {tiposCalculo.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </label>
          </div>

          <div className="two">
            <label>
              Tinta
              <select value={form.tinta} onChange={(e) => actualizar('tinta', e.target.value)}>
                {tintas.map((t) => <option key={t}>{t}</option>)}
              </select>
            </label>

            <label>
              Protección
              <select value={form.proteccion} onChange={(e) => actualizar('proteccion', e.target.value)}>
                {protecciones.map((p) => <option key={p}>{p}</option>)}
              </select>
            </label>
          </div>

          <div className="checks">
            <label>
              <input
                type="checkbox"
                checked={form.permiteMedidas}
                onChange={(e) => actualizar('permiteMedidas', e.target.checked)}
              />
              Permite medidas
            </label>

            <label>
              <input
                type="checkbox"
                checked={form.instalable}
                onChange={(e) => actualizar('instalable', e.target.checked)}
              />
              Instalable
            </label>

            <label>
              <input
                type="checkbox"
                checked={form.productoEstandar}
                onChange={(e) => actualizar('productoEstandar', e.target.checked)}
              />
              Producto estándar
            </label>
          </div>

          <div className="two">
            <label>
              Ancho fijo
              <input type="number" step="0.01" value={form.anchoFijo} onChange={(e) => actualizar('anchoFijo', e.target.value)} />
            </label>
            <label>
              Alto fijo
              <input type="number" step="0.01" value={form.altoFijo} onChange={(e) => actualizar('altoFijo', e.target.value)} />
            </label>
          </div>

          <div className="two">
            <label>
              Precio base interno
              <input type="number" step="0.01" value={form.precioBase} onChange={(e) => actualizar('precioBase', e.target.value)} />
            </label>
            <label>
              IVA %
              <input type="number" step="0.01" value={form.iva} onChange={(e) => actualizar('iva', e.target.value)} />
            </label>
          </div>

          <div className="tarifas">
            <label>Tarifa A<input type="number" step="0.01" value={form.tarifaA} onChange={(e) => actualizar('tarifaA', e.target.value)} /></label>
            <label>Tarifa B<input type="number" step="0.01" value={form.tarifaB} onChange={(e) => actualizar('tarifaB', e.target.value)} /></label>
            <label>Tarifa C<input type="number" step="0.01" value={form.tarifaC} onChange={(e) => actualizar('tarifaC', e.target.value)} /></label>
            <label>Tarifa D<input type="number" step="0.01" value={form.tarifaD} onChange={(e) => actualizar('tarifaD', e.target.value)} /></label>
          </div>

          <label>
            Descuento máximo libre %
            <input
              type="number"
              step="1"
              max="20"
              value={form.descuentoMaximo}
              onChange={(e) => actualizar('descuentoMaximo', Math.min(20, num(e.target.value)))}
            />
          </label>

          <div className="auto-box">
            <strong>Accesorios disponibles</strong>
            {accesoriosBase.map((a) => (
              <label key={a.id}>
                <input
                  type="checkbox"
                  checked={form.accesoriosPermitidos.includes(a.id)}
                  onChange={() => toggleAccesorio(a.id)}
                />
                {a.label}
              </label>
            ))}
          </div>

          <div className="two">
            <label>
              Separación ojetes / m
              <input type="number" step="0.01" value={form.separacionOjetes} onChange={(e) => actualizar('separacionOjetes', e.target.value)} />
            </label>
            <label>
              Separación bridas / m
              <input type="number" step="0.01" value={form.separacionBridas} onChange={(e) => actualizar('separacionBridas', e.target.value)} />
            </label>
          </div>

          <label>
            Notas internas
            <textarea
              value={form.notas}
              onChange={(e) => actualizar('notas', e.target.value)}
              placeholder="Reglas, proveedor, observaciones de producción..."
            />
          </label>

          <div className="cost-box">
            <strong><Calculator size={18} /> Resumen interno</strong>
            <p>Total con IVA: <b>{money(calculo.totalConIva)}</b></p>
            <p>Reglas: tubo = 2 × ancho / ojete y bridas por perímetro.</p>
          </div>

          <button className="primary-btn" type="submit">
            <CheckCircle2 size={18} />
            {editando ? 'Guardar cambios' : 'Guardar registro'}
          </button>
        </form>

        <section className="materiales-card">
          <div className="card-title">
            <Search size={22} />
            <h2>Registros</h2>
          </div>

          <div className="two">
            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar..."
            />
            <select value={filtro} onChange={(e) => setFiltro(e.target.value)}>
              <option>Todos</option>
              {categorias.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>

          <div className="materiales-list">
            {lista.map((m) => (
              <article className="material-row" key={m.id}>
                <div>
                  <h3>{m.descripcion}</h3>
                  <p>{m.tipoRegistro} · {m.categoria} · {m.subcategoria || 'Sin subcategoría'}</p>
                  <p>{m.tinta} · {m.proteccion}</p>
                  <div className="price-tags">
                    <span>A {money(m.tarifaA)}</span>
                    <span>B {money(m.tarifaB)}</span>
                    <span>C {money(m.tarifaC)}</span>
                    <span>D {money(m.tarifaD)}</span>
                  </div>
                  {m.accesoriosPermitidos?.length > 0 && (
                    <small>
                      Accesorios: {m.accesoriosPermitidos.join(', ')}
                    </small>
                  )}
                </div>

                <div className="row-actions">
                  <button type="button" onClick={() => editar(m)}><Edit3 size={16} /></button>
                  <button type="button" onClick={() => eliminar(m.id)}><Trash2 size={16} /></button>
                </div>
              </article>
            ))}

            {lista.length === 0 && (
              <div className="empty">No hay registros todavía.</div>
            )}
          </div>
        </section>
      </section>

      <style>{`
        .materiales-page{padding:22px;display:grid;gap:18px;background:#f4f6fb;min-height:100vh}
        .materiales-hero,.materiales-card,.materiales-lock{background:#fff;border-radius:24px;padding:22px;box-shadow:0 14px 35px rgba(15,23,42,.08)}
        .materiales-hero span{font-size:12px;font-weight:900;color:#b48722;text-transform:uppercase}
        .materiales-hero h1{margin:8px 0;font-size:32px;color:#111827}
        .materiales-hero p{margin:0;color:#64748b;line-height:1.5}
        .materiales-grid{display:grid;grid-template-columns:1fr 1fr;gap:18px;align-items:start}
        .card-title{display:flex;gap:10px;align-items:center;margin-bottom:16px}
        .card-title h2{margin:0;font-size:20px}
        label{display:grid;gap:7px;font-weight:800;color:#334155;margin-bottom:12px}
        input,select,textarea{width:100%;border:1px solid #dbe3ef;border-radius:16px;padding:13px 14px;font-size:15px;background:#fff}
        textarea{min-height:82px;resize:vertical}
        .two{display:grid;grid-template-columns:1fr 1fr;gap:12px}
        .tarifas{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
        .checks,.auto-box{background:#f8fafc;border:1px solid #e5e7eb;border-radius:18px;padding:14px;margin-bottom:14px}
        .checks label,.auto-box label{display:flex;align-items:center;gap:10px;margin:8px 0}
        .checks input,.auto-box input{width:auto}
        .auto-box strong{display:block;margin-bottom:8px}
        .cost-box{background:#0f172a;color:#fff;border-radius:18px;padding:16px;display:grid;gap:7px;margin:14px 0}
        .cost-box strong{display:flex;align-items:center;gap:8px}
        .cost-box p{margin:0;color:#dbeafe}
        .primary-btn{width:100%;border:0;border-radius:18px;padding:15px;background:#111827;color:#fff;font-weight:900;font-size:16px;display:flex;align-items:center;justify-content:center;gap:8px}
        .materiales-list{display:grid;gap:12px;margin-top:14px}
        .material-row{border:1px solid #e5e7eb;border-radius:18px;padding:14px;display:flex;justify-content:space-between;gap:14px;background:#f8fafc}
        .material-row h3{margin:0 0 4px;font-size:16px;color:#111827}
        .material-row p{margin:0 0 4px;color:#64748b;font-size:13px}
        .material-row small{display:block;margin-top:8px;color:#475569;font-weight:800}
        .price-tags{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}
        .price-tags span{background:#fff;border:1px solid #e5e7eb;border-radius:999px;padding:6px 9px;font-size:12px;font-weight:900}
        .row-actions{display:flex;gap:8px}
        .row-actions button{width:38px;height:38px;border:0;border-radius:12px;background:#111827;color:#fff}
        .empty{padding:24px;text-align:center;color:#64748b;border:1px dashed #cbd5e1;border-radius:18px}
        .materiales-lock{text-align:center;margin:40px auto;max-width:420px}
        @media(max-width:850px){
          .materiales-page{padding:14px}
          .materiales-grid,.two,.tarifas{grid-template-columns:1fr}
          .materiales-hero h1{font-size:27px}
          .material-row{flex-direction:column}
          .row-actions button{width:100%}
        }
      `}</style>
    </main>
  );
}