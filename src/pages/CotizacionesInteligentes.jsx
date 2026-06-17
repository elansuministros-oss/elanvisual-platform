import { useEffect, useMemo, useState } from 'react';
import { FileText, RefreshCcw, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';

const money = (v) =>
  new Intl.NumberFormat('es-NI', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(Number(v || 0));

export default function CotizacionesInteligentes() {
  const [cotizaciones, setCotizaciones] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(false);

  const cargarCotizaciones = async () => {
    setCargando(true);

    const { data, error } = await supabase
      .from('cotizaciones_inteligentes')
      .select('*')
      .order('creado_en', { ascending: false });

    if (error) {
      console.error(error);
      alert('No se pudieron cargar las cotizaciones.');
      setCargando(false);
      return;
    }

    setCotizaciones(data || []);
    setCargando(false);
  };

  useEffect(() => {
    cargarCotizaciones();
  }, []);

  const listaFiltrada = useMemo(() => {
    const q = busqueda.toLowerCase();

    return cotizaciones.filter((c) =>
      `${c.codigo} ${c.cliente_nombre} ${c.celular} ${c.ubicacion} ${c.estado}`
        .toLowerCase()
        .includes(q)
    );
  }, [cotizaciones, busqueda]);

  return (
    <main className="mm3-page">
      <section className="mm3-hero">
        <span>ELANVISIÓN · CI-08.1</span>
        <h1>Cotizaciones Inteligentes</h1>
        <p>Historial comercial guardado desde el Cotizador Inteligente.</p>
      </section>

      <section className="mm3-card">
        <div className="title">
          <Search size={20} />
          <h2>Buscar cotización</h2>
        </div>

        <input
          placeholder="Buscar por código, cliente, celular, ubicación o estado..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />

        <button className="primary" type="button" onClick={cargarCotizaciones}>
          <RefreshCcw size={18} />
          {cargando ? 'Actualizando...' : 'Actualizar'}
        </button>
      </section>

      <section className="mm3-card">
        <div className="title">
          <FileText size={20} />
          <h2>Listado</h2>
        </div>

        <div className="list">
          {listaFiltrada.length === 0 ? (
            <p className="note">No hay cotizaciones guardadas todavía.</p>
          ) : (
            listaFiltrada.map((c) => (
              <article className="row" key={c.id}>
                <div>
                  <h3>{c.codigo || 'Sin código'}</h3>
                  <p>
                    {c.cliente_nombre || 'Cliente no especificado'} · {c.celular || 'Sin celular'}
                  </p>
                  <span>
                    Estado: {c.estado || 'borrador'} · Precio B: {money(c.precio_b)} · Fecha:{' '}
                    {c.creado_en ? new Date(c.creado_en).toLocaleDateString('es-NI') : 'Sin fecha'}
                  </span>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
