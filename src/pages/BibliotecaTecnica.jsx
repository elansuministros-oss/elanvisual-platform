import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Edit3, PlusCircle, Search, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { sembrarBibliotecaTecnicaBase } from '../services/sembrarBibliotecaTecnica';

const money = (v) =>
  new Intl.NumberFormat('es-NI', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(Number(v || 0));

const num = (v) => Number(v || 0);

const inicialBiblioteca = {
  nombre: '',
  descripcion: '',
  tipo_trabajo: '',
  compatible_con: '',
  requiere_medidas: true,
  requiere_instalacion: false,
  requiere_postes: false,
  requiere_iluminacion: false,
  una_cara: true,
  doble_cara: false,
  profundidad_cm: 0,
  estado: 'activo',
};

const inicialComponente = {
  biblioteca_id: '',
  nombre: '',
  tipo_componente: 'Material',
  unidad: 'm2',
  formula_calculo: 'area',
  tipo_referencia: 'manual',
  material_id: '',
  combinacion_id: '',
  tecnologia_id: '',
  factor: 1,
  desperdicio_extra: 0,
  requiere_costo: true,
  es_zinc_doblado: false,
  es_estructura: false,
  es_obra_civil: false,
  orden: 0,
  notas: '',
  estado: 'activo',
};

export default function BibliotecaTecnica() {
  const [tab, setTab] = useState('biblioteca');

  const [biblioteca, setBiblioteca] = useState([]);
  const [componentes, setComponentes] = useState([]);
  const [materiales, setMateriales] = useState([]);
  const [combinaciones, setCombinaciones] = useState([]);
  const [tecnologias, setTecnologias] = useState([]);
  const [solicitudes, setSolicitudes] = useState([]);

  const [formBiblioteca, setFormBiblioteca] = useState(inicialBiblioteca);
  const [formComponente, setFormComponente] = useState(inicialComponente);

  const [editBiblioteca, setEditBiblioteca] = useState(null);
  const [editComponente, setEditComponente] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [sembrando, setSembrando] = useState(false);

  const sembrarBaseTecnica = async () => {
    if (!confirm('Cargar recetas constructivas base en Biblioteca Técnica?')) return;

    setSembrando(true);
    try {
      const res = await sembrarBibliotecaTecnicaBase(supabase);
      alert(`Base técnica cargada. Recetas: ${res.recetasCreadas}. Componentes: ${res.componentesCreados}.`);
      await cargarTodo();
    } catch (error) {
      console.error(error);
      alert(`No se pudo cargar la base técnica: ${error?.message || JSON.stringify(error)}`);
    } finally {
      setSembrando(false);
    }
  };

  const cargarTodo = async () => {
    const [bt, bc, mat, com, tec, sol] = await Promise.all([
      supabase.from('biblioteca_tecnica').select('*').order('nombre'),
      supabase.from('biblioteca_componentes').select('*').order('orden'),
      supabase.from('materiales_master').select('*').order('categoria'),
      supabase.from('combinaciones_master').select('*').order('categoria'),
      supabase.from('tecnologias_impresion').select('*').order('nombre'),
      supabase.from('solicitudes_costos').select('*').order('creado_en', { ascending: false }),
    ]);

    if (!bt.error) setBiblioteca(bt.data || []);
    if (!bc.error) setComponentes(bc.data || []);
    if (!mat.error) setMateriales(mat.data || []);
    if (!com.error) setCombinaciones(com.data || []);
    if (!tec.error) setTecnologias(tec.data || []);
    if (!sol.error) setSolicitudes(sol.data || []);
  };

  useEffect(() => {
    cargarTodo();
  }, []);

  const bibliotecaFiltrada = useMemo(() => {
    const q = busqueda.toLowerCase();
    return biblioteca.filter((b) =>
      `${b.nombre} ${b.tipo_trabajo} ${b.descripcion}`.toLowerCase().includes(q)
    );
  }, [biblioteca, busqueda]);

  const componentesActuales = useMemo(
    () => componentes.filter((c) => c.biblioteca_id === formComponente.biblioteca_id),
    [componentes, formComponente.biblioteca_id]
  );

  const limpiarBiblioteca = () => {
    setFormBiblioteca(inicialBiblioteca);
    setEditBiblioteca(null);
  };

  const limpiarComponente = () => {
    setFormComponente(inicialComponente);
    setEditComponente(null);
  };

  const guardarBiblioteca = async (e) => {
    e.preventDefault();

    const payload = {
      ...formBiblioteca,
      compatible_con: String(formBiblioteca.compatible_con || '')
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean),
      profundidad_cm: num(formBiblioteca.profundidad_cm),
      actualizado_en: new Date().toISOString(),
    };

    const res = editBiblioteca
      ? await supabase.from('biblioteca_tecnica').update(payload).eq('id', editBiblioteca)
      : await supabase.from('biblioteca_tecnica').insert(payload);

    if (res.error) return alert('No se pudo guardar biblioteca tecnica.');

    limpiarBiblioteca();
    cargarTodo();
  };

  const guardarComponente = async (e) => {
    e.preventDefault();

    const payload = {
      ...formComponente,
      factor: num(formComponente.factor) || 1,
      desperdicio_extra: num(formComponente.desperdicio_extra),
      orden: num(formComponente.orden),
      material_id: formComponente.material_id || null,
      combinacion_id: formComponente.combinacion_id || null,
      tecnologia_id: formComponente.tecnologia_id || null,
      actualizado_en: new Date().toISOString(),
    };

    const res = editComponente
      ? await supabase.from('biblioteca_componentes').update(payload).eq('id', editComponente)
      : await supabase.from('biblioteca_componentes').insert(payload);

    if (res.error) return alert('No se pudo guardar componente.');

    limpiarComponente();
    cargarTodo();
  };

  const editarBiblioteca = (b) => {
    setFormBiblioteca({
      ...inicialBiblioteca,
      ...b,
      compatible_con: Array.isArray(b.compatible_con) ? b.compatible_con.join(', ') : '',
    });
    setEditBiblioteca(b.id);
    setTab('biblioteca');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const editarComponente = (c) => {
    setFormComponente({
      ...inicialComponente,
      ...c,
      material_id: c.material_id || '',
      combinacion_id: c.combinacion_id || '',
      tecnologia_id: c.tecnologia_id || '',
    });
    setEditComponente(c.id);
    setTab('componentes');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const eliminar = async (tabla, id) => {
    if (!confirm('Eliminar registro?')) return;
    const { error } = await supabase.from(tabla).delete().eq('id', id);
    if (error) return alert('No se pudo eliminar.');
    cargarTodo();
  };

  const materialNombre = (id) => materiales.find((m) => m.id === id)?.nombre || '';
  const combinacionNombre = (id) => combinaciones.find((c) => c.id === id)?.nombre || '';
  const tecnologiaNombre = (id) => tecnologias.find((t) => t.id === id)?.nombre || '';

  return (
    <main className="mm3-page">
      <section className="mm3-hero">
        <span>ELANVISIÓN · CI-02</span>
        <h1>Biblioteca Técnica</h1>
        <p>Recetas constructivas, componentes, fórmulas y solicitudes de costos.</p>
        <button type="button" className="primary" onClick={sembrarBaseTecnica} disabled={sembrando}>
          {sembrando ? 'Cargando base técnica...' : 'Cargar base técnica automática'}
        </button>
      </section>

      <nav className="mm3-tabs">
        <button onClick={() => setTab('biblioteca')} className={tab === 'biblioteca' ? 'active' : ''}>Biblioteca</button>
        <button onClick={() => setTab('componentes')} className={tab === 'componentes' ? 'active' : ''}>Componentes</button>
        <button onClick={() => setTab('tecnologias')} className={tab === 'tecnologias' ? 'active' : ''}>Tecnologías</button>
        <button onClick={() => setTab('solicitudes')} className={tab === 'solicitudes' ? 'active' : ''}>Solicitudes Costos</button>
      </nav>

      {tab === 'biblioteca' && (
        <section className="mm3-grid">
          <form className="mm3-card" onSubmit={guardarBiblioteca}>
            <div className="title"><PlusCircle size={20} /><h2>{editBiblioteca ? 'Editar receta' : 'Nueva receta técnica'}</h2></div>

            <input placeholder="Nombre de receta" value={formBiblioteca.nombre} onChange={(e) => setFormBiblioteca({ ...formBiblioteca, nombre: e.target.value })} required />
            <input placeholder="Tipo trabajo / slug" value={formBiblioteca.tipo_trabajo} onChange={(e) => setFormBiblioteca({ ...formBiblioteca, tipo_trabajo: e.target.value })} required />
            <textarea placeholder="Descripción constructiva" value={formBiblioteca.descripcion || ''} onChange={(e) => setFormBiblioteca({ ...formBiblioteca, descripcion: e.target.value })} />
            <input placeholder="Compatible con, separado por coma" value={formBiblioteca.compatible_con || ''} onChange={(e) => setFormBiblioteca({ ...formBiblioteca, compatible_con: e.target.value })} />

            <div className="two">
              <label><input type="checkbox" checked={formBiblioteca.requiere_instalacion} onChange={(e) => setFormBiblioteca({ ...formBiblioteca, requiere_instalacion: e.target.checked })} /> Instalación</label>
              <label><input type="checkbox" checked={formBiblioteca.requiere_postes} onChange={(e) => setFormBiblioteca({ ...formBiblioteca, requiere_postes: e.target.checked })} /> Postes</label>
            </div>

            <div className="two">
              <label><input type="checkbox" checked={formBiblioteca.requiere_iluminacion} onChange={(e) => setFormBiblioteca({ ...formBiblioteca, requiere_iluminacion: e.target.checked })} /> Iluminación</label>
              <label><input type="checkbox" checked={formBiblioteca.doble_cara} onChange={(e) => setFormBiblioteca({ ...formBiblioteca, doble_cara: e.target.checked })} /> Doble cara</label>
            </div>

            <input type="number" step="0.01" placeholder="Profundidad cm" value={formBiblioteca.profundidad_cm} onChange={(e) => setFormBiblioteca({ ...formBiblioteca, profundidad_cm: e.target.value })} />

            <button className="primary" type="submit"><CheckCircle2 size={18} /> Guardar receta</button>
          </form>

          <section className="mm3-card">
            <div className="title"><Search size={20} /><h2>Recetas existentes</h2></div>
            <input placeholder="Buscar receta..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />

            <div className="list">
              {bibliotecaFiltrada.map((b) => (
                <article className="row" key={b.id}>
                  <div>
                    <h3>{b.nombre}</h3>
                    <p>{b.tipo_trabajo}</p>
                    <span>{b.requiere_instalacion ? 'Con instalación' : 'Producto'} · {b.requiere_iluminacion ? 'Luminoso' : 'Sin iluminación'}</span>
                  </div>
                  <div className="actions">
                    <button onClick={() => editarBiblioteca(b)}><Edit3 size={15} /></button>
                    <button onClick={() => eliminar('biblioteca_tecnica', b.id)}><Trash2 size={15} /></button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </section>
      )}

      {tab === 'componentes' && (
        <section className="mm3-grid">
          <form className="mm3-card" onSubmit={guardarComponente}>
            <div className="title"><PlusCircle size={20} /><h2>{editComponente ? 'Editar componente' : 'Nuevo componente'}</h2></div>

            <select value={formComponente.biblioteca_id} onChange={(e) => setFormComponente({ ...formComponente, biblioteca_id: e.target.value })} required>
              <option value="">Seleccionar receta técnica</option>
              {biblioteca.map((b) => <option key={b.id} value={b.id}>{b.nombre}</option>)}
            </select>

            <input placeholder="Nombre componente" value={formComponente.nombre} onChange={(e) => setFormComponente({ ...formComponente, nombre: e.target.value })} required />

            <div className="two">
              <select value={formComponente.tipo_componente} onChange={(e) => setFormComponente({ ...formComponente, tipo_componente: e.target.value })}>
                <option>Material</option>
                <option>Estructura</option>
                <option>Iluminación</option>
                <option>Mano de obra</option>
                <option>Instalación</option>
                <option>Obra civil</option>
              </select>

              <select value={formComponente.unidad} onChange={(e) => setFormComponente({ ...formComponente, unidad: e.target.value })}>
                <option>m2</option>
                <option>Metro lineal</option>
                <option>Unidad</option>
                <option>Servicio</option>
                <option>Hora</option>
              </select>
            </div>

            <select value={formComponente.formula_calculo} onChange={(e) => setFormComponente({ ...formComponente, formula_calculo: e.target.value })}>
              <option value="area">Área</option>
              <option value="perimetro">Perímetro</option>
              <option value="cantidad">Cantidad</option>
              <option value="manual">Manual</option>
              <option value="area_x_factor">Área × factor</option>
              <option value="perimetro_x_factor">Perímetro × factor</option>
            </select>

            <select value={formComponente.tipo_referencia} onChange={(e) => setFormComponente({ ...formComponente, tipo_referencia: e.target.value })}>
              <option value="manual">Manual</option>
              <option value="material">Material</option>
              <option value="combinacion">Combinación</option>
              <option value="tecnologia">Tecnología</option>
            </select>

            {formComponente.tipo_referencia === 'material' && (
              <select value={formComponente.material_id} onChange={(e) => setFormComponente({ ...formComponente, material_id: e.target.value })}>
                <option value="">Seleccionar material</option>
                {materiales.map((m) => <option key={m.id} value={m.id}>{m.categoria} · {m.nombre} · {money(m.costo_real)}</option>)}
              </select>
            )}

            {formComponente.tipo_referencia === 'combinacion' && (
              <select value={formComponente.combinacion_id} onChange={(e) => setFormComponente({ ...formComponente, combinacion_id: e.target.value })}>
                <option value="">Seleccionar combinación</option>
                {combinaciones.map((c) => <option key={c.id} value={c.id}>{c.categoria} · {c.nombre}</option>)}
              </select>
            )}

            {formComponente.tipo_referencia === 'tecnologia' && (
              <select value={formComponente.tecnologia_id} onChange={(e) => setFormComponente({ ...formComponente, tecnologia_id: e.target.value })}>
                <option value="">Seleccionar tecnología</option>
                {tecnologias.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
              </select>
            )}

            <div className="two">
              <input type="number" step="0.01" placeholder="Factor" value={formComponente.factor} onChange={(e) => setFormComponente({ ...formComponente, factor: e.target.value })} />
              <input type="number" step="0.01" placeholder="Desperdicio extra %" value={formComponente.desperdicio_extra} onChange={(e) => setFormComponente({ ...formComponente, desperdicio_extra: e.target.value })} />
            </div>

            <div className="two">
              <label><input type="checkbox" checked={formComponente.es_zinc_doblado} onChange={(e) => setFormComponente({ ...formComponente, es_zinc_doblado: e.target.checked, unidad: e.target.checked ? 'Metro lineal' : formComponente.unidad, formula_calculo: e.target.checked ? 'perimetro' : formComponente.formula_calculo })} /> Zinc doblado</label>
              <label><input type="checkbox" checked={formComponente.es_estructura} onChange={(e) => setFormComponente({ ...formComponente, es_estructura: e.target.checked })} /> Estructura</label>
            </div>

            <label><input type="checkbox" checked={formComponente.es_obra_civil} onChange={(e) => setFormComponente({ ...formComponente, es_obra_civil: e.target.checked })} /> Obra civil</label>

            <textarea placeholder="Notas técnicas" value={formComponente.notas || ''} onChange={(e) => setFormComponente({ ...formComponente, notas: e.target.value })} />

            <button className="primary" type="submit"><CheckCircle2 size={18} /> Guardar componente</button>
          </form>

          <section className="mm3-card">
            <div className="title"><Search size={20} /><h2>Componentes de receta</h2></div>

            <div className="list">
              {componentesActuales.map((c) => (
                <article className="row" key={c.id}>
                  <div>
                    <h3>{c.nombre}</h3>
                    <p>{c.tipo_componente} · {c.unidad} · {c.formula_calculo}</p>
                    <span>
                      {c.tipo_referencia === 'material' && materialNombre(c.material_id)}
                      {c.tipo_referencia === 'combinacion' && combinacionNombre(c.combinacion_id)}
                      {c.tipo_referencia === 'tecnologia' && tecnologiaNombre(c.tecnologia_id)}
                      {c.tipo_referencia === 'manual' && 'Referencia manual'}
                    </span>
                  </div>
                  <div className="actions">
                    <button onClick={() => editarComponente(c)}><Edit3 size={15} /></button>
                    <button onClick={() => eliminar('biblioteca_componentes', c.id)}><Trash2 size={15} /></button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </section>
      )}

      {tab === 'tecnologias' && (
        <section className="mm3-card">
          <div className="title"><Search size={20} /><h2>Tecnologías registradas</h2></div>
          <div className="list">
            {tecnologias.map((t) => (
              <article className="row" key={t.id}>
                <div>
                  <h3>{t.nombre}</h3>
                  <p>{t.descripcion}</p>
                  <span>Factor utilidad: {Number(t.factor_utilidad || 1).toFixed(2)} · {t.estado}</span>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {tab === 'solicitudes' && (
        <section className="mm3-card">
          <div className="title"><Search size={20} /><h2>Solicitudes de costos</h2></div>
          <div className="list">
            {solicitudes.map((s) => (
              <article className="row" key={s.id}>
                <div>
                  <h3>{s.item_nombre}</h3>
                  <p>{s.descripcion || 'Sin descripción'}</p>
                  <span>{s.estado} · {s.unidad || 'Sin unidad'} · {money(s.costo_validado)}</span>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
