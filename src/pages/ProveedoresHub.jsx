import React, { useEffect, useMemo, useState } from 'react';
import { Brain, Building2, CheckCircle2, Database, RefreshCw, Save, Search, Sparkles, Trash2 } from 'lucide-react';
import { listSuppliersV2, createSupplierV2, deleteSupplierV2 } from '../services/suppliers';
import { parseSupplierCapture } from '../services/suppliers/supplierCaptureParser';

const inicial = {
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
  departamento: 'Managua',
  municipio: '',
  zonaCobertura: 'Managua',
  categoria: 'Suministros',
  subcategorias: '',
  observaciones: '',
  activo: true,
};

export default function ProveedoresHub() {
  const [texto, setTexto] = useState('');
  const [form, setForm] = useState(inicial);
  const [proveedores, setProveedores] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState('');

  const cargar = async () => {
    setCargando(true);
    setMensaje('');
    try {
      const data = await listSuppliersV2();
      setProveedores(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error cargando proveedores V2:', error);
      setMensaje('No se pudieron cargar los proveedores.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const analizar = () => {
    const resultado = parseSupplierCapture(texto);
    setForm({ ...inicial, ...resultado });
    setMensaje('Descripción analizada. Revisá la vista previa antes de guardar.');
  };

  const cambiar = (campo, valor) => {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  };

  const guardar = async (e) => {
    e.preventDefault();

    if (!form.nombre.trim()) {
      setMensaje('Indicá el nombre del proveedor.');
      return;
    }

    setGuardando(true);
    setMensaje('');

    try {
      await createSupplierV2(form);
      setTexto('');
      setForm(inicial);
      await cargar();
      setMensaje('Proveedor guardado en Supplier Hub. Ya podés cargar su catálogo en EMC.');
    } catch (error) {
      console.error('Error guardando proveedor V2:', error);
      setMensaje(error?.message || 'No se pudo guardar el proveedor.');
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = async (id) => {
    if (!id) return;
    const ok = window.confirm('¿Eliminar este proveedor del Supplier Hub?');
    if (!ok) return;

    try {
      await deleteSupplierV2(id);
      await cargar();
      setMensaje('Proveedor eliminado.');
    } catch (error) {
      console.error('Error eliminando proveedor V2:', error);
      setMensaje(error?.message || 'No se pudo eliminar el proveedor.');
    }
  };

  const lista = useMemo(() => {
    const q = busqueda.toLowerCase().trim();
    if (!q) return proveedores;

    return proveedores.filter((p) =>
      `${p.nombre} ${p.razonSocial} ${p.categoria} ${p.subcategorias} ${p.whatsapp} ${p.correo} ${p.departamento} ${p.zonaCobertura}`
        .toLowerCase()
        .includes(q)
    );
  }, [proveedores, busqueda]);

  const totalActivos = proveedores.filter((p) => p.activo !== false).length;

  return (
    <main className="supplier-v2">
      <section className="supplier-hero">
        <div>
          <span>ELANKAV · SUPPLIER INTELLIGENCE HUB</span>
          <h1>Captura Inteligente de Proveedores</h1>
          <p>Registrá proveedores desde una descripción simple. Después el catálogo, listas e imágenes se cargan desde EMC.</p>
        </div>
        <button type="button" onClick={cargar} className="supplier-ghost">
          <RefreshCw size={18} />
          Actualizar
        </button>
      </section>

      <section className="supplier-kpis">
        <article><Building2 size={22} /><span>Total</span><strong>{proveedores.length}</strong></article>
        <article><CheckCircle2 size={22} /><span>Activos</span><strong>{totalActivos}</strong></article>
        <article><Database size={22} /><span>Fuente</span><strong>Supabase</strong></article>
      </section>

      <section className="supplier-layout">
        <article className="supplier-card capture">
          <div className="supplier-card-head">
            <div>
              <h2><Brain size={22} /> Captura rápida</h2>
              <p>Pegá lo que sabés del proveedor: qué vende, zona, contacto, WhatsApp, correo, capacidades.</p>
            </div>
          </div>

          <textarea
            className="supplier-big-textarea"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Ejemplo: Scolor vende acrílico, PVC, vinil, lonas, LED y materiales para rotulación. Está en Managua. WhatsApp 8888 8888. Tiene crédito para clientes frecuentes."
          />

          <div className="supplier-actions">
            <button type="button" className="supplier-secondary" onClick={analizar}>
              <Sparkles size={18} />
              Analizar
            </button>
          </div>

          {mensaje && <p className="supplier-message">{mensaje}</p>}
        </article>

        <form className="supplier-card preview" onSubmit={guardar}>
          <h2>Vista previa editable</h2>

          <div className="supplier-two">
            <label>Proveedor<input value={form.nombre} onChange={(e) => cambiar('nombre', e.target.value)} /></label>
            <label>Categoría<input value={form.categoria} onChange={(e) => cambiar('categoria', e.target.value)} /></label>
          </div>

          <label>Capacidades / subcategorías<input value={form.subcategorias} onChange={(e) => cambiar('subcategorias', e.target.value)} /></label>

          <div className="supplier-two">
            <label>WhatsApp<input value={form.whatsapp} onChange={(e) => cambiar('whatsapp', e.target.value)} /></label>
            <label>Correo<input value={form.correo} onChange={(e) => cambiar('correo', e.target.value)} /></label>
          </div>

          <div className="supplier-two">
            <label>Departamento<input value={form.departamento} onChange={(e) => cambiar('departamento', e.target.value)} /></label>
            <label>Zona cobertura<input value={form.zonaCobertura} onChange={(e) => cambiar('zonaCobertura', e.target.value)} /></label>
          </div>

          <label>Dirección<input value={form.direccion} onChange={(e) => cambiar('direccion', e.target.value)} /></label>
          <label>Observaciones<textarea value={form.observaciones} onChange={(e) => cambiar('observaciones', e.target.value)} /></label>

          <button className="supplier-primary" disabled={guardando}>
            <Save size={18} />
            {guardando ? 'Guardando...' : 'Guardar proveedor'}
          </button>
        </form>
      </section>

      <section className="supplier-card">
        <div className="supplier-list-head">
          <h2>Proveedores cargados</h2>
          <div className="supplier-search">
            <Search size={18} />
            <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar proveedor..." />
          </div>
        </div>

        {cargando ? (
          <p className="supplier-empty">Cargando proveedores...</p>
        ) : (
          <div className="supplier-list">
            {lista.map((p) => (
              <article className="supplier-item" key={p.id}>
                <div>
                  <span>{p.categoria || 'Proveedor'}</span>
                  <h3>{p.nombre}</h3>
                  <p>{p.subcategorias || 'Sin capacidades registradas'}</p>
                  <small>{p.zonaCobertura || p.departamento || 'Sin zona'} · {p.whatsapp || 'Sin WhatsApp'} · {p.correo || 'Sin correo'}</small>
                </div>
                <button type="button" onClick={() => eliminar(p.id)} className="supplier-danger">
                  <Trash2 size={17} />
                </button>
              </article>
            ))}

            {lista.length === 0 && <p className="supplier-empty">No hay proveedores para mostrar.</p>}
          </div>
        )}
      </section>

      <style>{`
        .supplier-v2{min-height:100vh;background:#f4f7fb;padding:16px;display:grid;gap:16px;color:#111827}
        .supplier-hero,.supplier-card,.supplier-kpis article{background:#fff;border-radius:26px;padding:20px;box-shadow:0 16px 40px rgba(15,23,42,.08)}
        .supplier-hero{display:flex;justify-content:space-between;gap:14px;align-items:center}
        .supplier-hero span{font-size:12px;font-weight:950;color:#b48722;letter-spacing:.08em}
        .supplier-hero h1{margin:8px 0;font-size:34px;line-height:1.05}
        .supplier-hero p{margin:0;color:#64748b;font-weight:800;max-width:760px}
        .supplier-kpis{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
        .supplier-kpis article{display:grid;gap:6px}.supplier-kpis span{color:#64748b;font-weight:900}.supplier-kpis strong{font-size:24px}
        .supplier-layout{display:grid;grid-template-columns:1fr 1fr;gap:16px;align-items:start}
        .supplier-card h2{margin:0 0 12px;display:flex;gap:8px;align-items:center}
        .supplier-card p{color:#64748b;font-weight:800}
        label{display:grid;gap:7px;font-weight:950;color:#334155;margin-bottom:12px}
        input,textarea{width:100%;border:1px solid #cbd5e1;border-radius:16px;padding:13px;font-size:16px;background:#fff}
        textarea{min-height:90px;resize:vertical}.supplier-big-textarea{min-height:240px;font-size:18px;line-height:1.55}
        .supplier-two{display:grid;grid-template-columns:1fr 1fr;gap:12px}
        .supplier-primary,.supplier-secondary,.supplier-ghost,.supplier-danger{border:0;border-radius:18px;padding:13px 16px;font-weight:950;display:inline-flex;gap:8px;align-items:center;justify-content:center;cursor:pointer}
        .supplier-primary{background:#111827;color:#fff;width:100%}.supplier-secondary{background:#111827;color:#fff}.supplier-ghost{background:#f8fafc;color:#334155}.supplier-danger{background:#fee2e2;color:#991b1b}
        .supplier-message{background:#ecfeff;color:#155e75;border:1px solid #a5f3fc;border-radius:16px;padding:12px;margin-top:12px}
        .supplier-list-head{display:flex;justify-content:space-between;gap:12px;align-items:center}
        .supplier-search{display:flex;align-items:center;gap:8px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:16px;padding:0 12px;min-width:280px}
        .supplier-search input{border:0;background:transparent}
        .supplier-list{display:grid;gap:10px;margin-top:14px}
        .supplier-item{border:1px solid #e5e7eb;background:#f8fafc;border-radius:20px;padding:14px;display:flex;justify-content:space-between;gap:12px;align-items:center}
        .supplier-item span{font-size:12px;font-weight:950;color:#b48722;text-transform:uppercase}
        .supplier-item h3{margin:4px 0;font-size:20px}.supplier-item p{margin:0 0 6px}.supplier-item small{color:#64748b;font-weight:800}
        .supplier-empty{font-weight:900;color:#64748b}
        @media(max-width:900px){.supplier-hero,.supplier-list-head{flex-direction:column;align-items:stretch}.supplier-layout,.supplier-kpis,.supplier-two{grid-template-columns:1fr}.supplier-search{min-width:0}.supplier-hero h1{font-size:28px}}
      `}</style>
    </main>
  );
}
