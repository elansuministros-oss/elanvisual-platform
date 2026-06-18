import React, { useEffect, useMemo, useState } from 'react';
import { Save, Search, Users, Truck, UserPlus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useApp } from '../context/AppContext';

const limpiar = (v) => String(v || '').trim();

const slug = (v) =>
  limpiar(v)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const normalizarNombre = (v) =>
  limpiar(v)
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (l) => l.toUpperCase());

function extraerDatos(texto, tipo = 'cliente') {
  const t = limpiar(texto);
  const lineas = t.split('\n').map((x) => limpiar(x)).filter(Boolean);

  const email = t.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] || '';

  const telefonos = [...t.matchAll(/(?:\+?505)?[\s-]?[578]\d{3}[\s-]?\d{4}/g)].map((m) =>
    m[0].replace(/[^0-9]/g, '').replace(/^505/, '')
  );

  const cedula =
    t.match(/(?:cedula|cédula|ced)\.?\s*:?\s*([A-Z0-9-]+)/i)?.[1] ||
    t.match(/\b\d{13}[A-Z]\b/i)?.[0] ||
    '';

  const banco =
    /\bbac\b/i.test(t) ? 'BAC' :
    /\bbanpro\b/i.test(t) ? 'BANPRO' :
    /\blafise\b/i.test(t) ? 'LAFISE' :
    /\bbdf\b/i.test(t) ? 'BDF' :
    /\bficohsa\b/i.test(t) ? 'FICOHSA' :
    '';

  const cuenta =
    t.match(/(?:cta|cuenta)\s*(?:bac|banpro|lafise|bdf|ficohsa)?\s*:?\s*([0-9-]{5,})/i)?.[1] ||
    '';

  const moneda =
    /cordoba|córdoba|cordobas|córdobas|nio|c\$/i.test(t) ? 'Córdobas' :
    /dolar|dólar|dolares|dólares|usd|\$/i.test(t) ? 'Dólares' :
    '';

  const nombreVendedor =
    tipo === 'vendedor'
      ? (
          t.match(/(?:vendedor|nombre|usuario)\s*:?\s*([^,\n]+)/i)?.[1] ||
          lineas[0] ||
          ''
        )
      : '';

  const empresa =
    tipo === 'vendedor'
      ? ''
      : (
          t.match(/(?:empresa|cliente|proveedor|negocio)\s*:?\s*([^,\n]+)/i)?.[1] ||
          lineas[0] ||
          t.split(',')[0]?.trim() ||
          ''
        );

  const contacto =
    tipo === 'vendedor'
      ? ''
      : (
          t.match(/(?:atencion|atención|contacto|atiende|con)\s*:?\s*([A-Za-zÁÉÍÓÚáéíóúÑñ ]{3,50})/i)?.[1] ||
          ''
        );

  const direccion =
    t.match(/(?:direccion|dirección|ubicacion|ubicación|dir)\s*:?\s*([^,\n]+)/i)?.[1] || '';

  const ruc = t.match(/(?:ruc)\s*:?\s*([A-Z0-9-]+)/i)?.[1] || '';

  const ciudad =
    ['Managua', 'Granada', 'Masaya', 'Leon', 'León', 'Chinandega', 'Esteli', 'Estelí', 'Matagalpa', 'Jinotega', 'Juigalpa', 'Rivas', 'Carazo', 'Boaco'].find((c) =>
      t.toLowerCase().includes(c.toLowerCase())
    ) || '';

  const categoria =
    t.match(/(?:categoria|categoría|servicio|vende|provee)\s*:?\s*([^,\n]+)/i)?.[1] || '';

  return {
    empresa: limpiar(empresa),
    nombre: normalizarNombre(nombreVendedor || contacto || empresa),
    contacto: tipo === 'vendedor' ? '' : limpiar(contacto),
    whatsapp: telefonos[0] || '',
    telefono: telefonos[0] || '',
    correo: email,
    email,
    ruc,
    cedula: limpiar(cedula).toUpperCase(),
    banco,
    cuenta_bancaria: cuenta,
    moneda,
    direccion: limpiar(direccion),
    ciudad,
    categoria: limpiar(categoria),
    notas: t,
  };
}

export default function CapturaInteligente() {
  const { usuario } = useApp();

  const esAdmin = usuario?.rol === 'admin';
  const [tipo, setTipo] = useState('cliente');
  const [texto, setTexto] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [clientes, setClientes] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [vendedores, setVendedores] = useState([]);
  const [editandoId, setEditandoId] = useState(null);

  const datos = useMemo(() => extraerDatos(texto, tipo), [texto, tipo]);

  useEffect(() => {
    if (!esAdmin) {
      setTipo('cliente');
    }
  }, [esAdmin]);

  const cargar = async () => {
    if (!supabase) return;

    const consultas = [
      supabase.from('clientes').select('*').order('created_at', { ascending: false }).limit(50),
    ];

    if (esAdmin) {
      consultas.push(
        supabase.from('proveedores').select('*').order('created_at', { ascending: false }).limit(50),
        supabase.from('vendedores').select('*').order('created_at', { ascending: false }).limit(50)
      );
    }

    const res = await Promise.all(consultas);

    setClientes(res[0]?.data || []);

    if (esAdmin) {
      setProveedores(res[1]?.data || []);
      setVendedores(res[2]?.data || []);
    }
  };

  useEffect(() => {
    cargar();
  }, [esAdmin]);

  const guardar = async () => {
    if (!supabase) return alert('Supabase no está configurado.');
    if (!texto.trim()) return alert('Pegá primero la información.');

    const tipoReal = esAdmin ? tipo : 'cliente';
    const modoEdicion = Boolean(editandoId);

    setMensaje('Guardando...');

    if (tipoReal === 'cliente') {
      const payloadCliente = {
        empresa: datos.empresa || datos.nombre || '',
        nombre: datos.nombre || datos.empresa || '',
        contacto: datos.contacto || datos.nombre || '',
        whatsapp: datos.whatsapp || '',
        telefono: datos.telefono || datos.whatsapp || '',
        correo: datos.correo || datos.email || '',
        email: datos.email || datos.correo || '',
        ruc: datos.ruc || '',
        direccion: datos.direccion || '',
        ciudad: datos.ciudad || '',
        notas: datos.notas || texto,
        estado: 'activo',
      };

      const { error } = modoEdicion
        ? await supabase.from('clientes').update(payloadCliente).eq('id', editandoId)
        : await supabase.from('clientes').insert(payloadCliente);

      if (error) {
        console.error(error);
        setMensaje(`Error guardando cliente: ${error.message}`);
        return;
      }

      setMensaje(modoEdicion ? 'Cliente actualizado en Supabase.' : 'Cliente guardado en Supabase.');
    }

    if (tipoReal === 'proveedor') {
      const payloadProveedor = {
        nombre: datos.nombre || datos.empresa || '',
        razon_social: datos.empresa || datos.nombre || '',
        contacto: datos.contacto || datos.nombre || '',
        whatsapp: datos.whatsapp || '',
        correo: datos.correo || datos.email || '',
        categoria: datos.categoria || '',
        municipio: datos.ciudad || '',
        ubicacion: datos.direccion || '',
        notas: datos.notas || texto,
      };

      const { error } = modoEdicion
        ? await supabase.from('proveedores').update(payloadProveedor).eq('id', editandoId)
        : await supabase.from('proveedores').insert(payloadProveedor);

      if (error) {
        console.error(error);
        setMensaje(`Error guardando proveedor: ${error.message}`);
        return;
      }

      setMensaje(modoEdicion ? 'Proveedor actualizado en Supabase.' : 'Proveedor guardado en Supabase.');
    }

    if (tipoReal === 'vendedor') {
      const base = datos.nombre || `vendedor-${Date.now()}`;

      const payloadVendedor = {
        nombre: datos.nombre || '',
        usuario: slug(base),
        email: datos.email || datos.correo || '',
        whatsapp: datos.whatsapp || '',
        cedula: datos.cedula || '',
        banco: datos.banco || '',
        cuenta_bancaria: datos.cuenta_bancaria || '',
        moneda: datos.moneda || '',
        codigo_vendedor: `VEN-${slug(base).toUpperCase()}`,
        rol: 'ventas',
        activo: true,
        notas: datos.notas || texto,
        data: datos,
      };

      const { error } = modoEdicion
        ? await supabase.from('vendedores').update(payloadVendedor).eq('id', editandoId)
        : await supabase.from('vendedores').insert(payloadVendedor);

      if (error) {
        console.error(error);
        setMensaje(`Error guardando vendedor: ${error.message}`);
        return;
      }

      setMensaje(modoEdicion ? 'Vendedor actualizado en Supabase.' : 'Vendedor guardado en Supabase.');
    }

    setTexto('');
    setEditandoId(null);
    await cargar();
  };

  const editarRegistro = (registro) => {
    setEditandoId(registro.id);
    setTexto(
      registro.notas ||
        registro.data?.notas ||
        [
          registro.empresa || registro.razon_social || registro.nombre || '',
          registro.contacto || registro.nombre || '',
          registro.cedula || '',
          registro.whatsapp || registro.telefono || '',
          registro.correo || registro.email || '',
          registro.banco && registro.cuenta_bancaria ? `Cta ${registro.banco} ${registro.cuenta_bancaria} ${registro.moneda || ''}` : '',
          registro.ruc || '',
          registro.direccion || registro.ubicacion || '',
          registro.ciudad || registro.municipio || '',
          registro.categoria || '',
        ].filter(Boolean).join('\n')
    );
  };

  const eliminarRegistro = async (registro) => {
    if (!supabase) return alert('Supabase no está configurado.');
    const tipoReal = esAdmin ? tipo : 'cliente';
    const tabla = tipoReal === 'cliente' ? 'clientes' : tipoReal === 'proveedor' ? 'proveedores' : 'vendedores';
    const ok = window.confirm('¿Eliminar este registro?');
    if (!ok) return;
    const { error } = await supabase.from(tabla).delete().eq('id', registro.id);
    if (error) return setMensaje('Error eliminando: ' + error.message);
    setMensaje('Registro eliminado.');
    if (editandoId === registro.id) {
      setEditandoId(null);
      setTexto('');
    }
    await cargar();
  };

  const lista = tipo === 'cliente' ? clientes : tipo === 'proveedor' ? proveedores : vendedores;

  const filtrada = lista.filter((x) =>
    JSON.stringify(x || {}).toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <main className="captura-page">
      <section className="captura-hero">
        <span>ELANVISIÓN · Captura Inteligente</span>
        <h1>{esAdmin ? 'Clientes, Proveedores y Vendedores' : 'Captura Inteligente de Clientes'}</h1>
        <p>
          {esAdmin
            ? 'Pegá todo en una sola caja. El sistema separa datos según el tipo seleccionado.'
            : 'Pegá los datos del cliente en una sola caja. El sistema separa empresa, contacto, teléfono, correo, dirección, ciudad y RUC.'}
        </p>
      </section>

      {esAdmin && (
        <section className="tabs">
          <button className={tipo === 'cliente' ? 'active' : ''} onClick={() => setTipo('cliente')}><Users size={18}/> Cliente</button>
          <button className={tipo === 'proveedor' ? 'active' : ''} onClick={() => setTipo('proveedor')}><Truck size={18}/> Proveedor</button>
          <button className={tipo === 'vendedor' ? 'active' : ''} onClick={() => setTipo('vendedor')}><UserPlus size={18}/> Vendedor</button>
        </section>
      )}

      <section className="grid">
        <article className="card">
          <h2>Entrada inteligente</h2>
          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder={
              tipo === 'vendedor'
                ? 'Ejemplo: Jose Alejandro Vargas\nCédula 0013107510023D\nCta BAC 365336536 / córdobas\n84869177\ncorreo@email.com'
                : 'Ejemplo: Cliente Havanas Nights, atención Carlos, celular 88889999, correo ventas@havana.com, dirección Metrocentro Managua, RUC J031...'
            }
          />
          <button type="button" onClick={guardar}>
            <Save size={18}/> {editandoId ? 'Guardar cambios' : 'Guardar'}
          </button>
          {editandoId && <button type="button" className="secondary" onClick={() => { setEditandoId(null); setTexto(''); }}>Cancelar edición</button>}
          {mensaje && <p className="msg">{mensaje}</p>}
        </article>

        <article className="card preview">
          <h2>Vista previa</h2>
          {Object.entries(datos).map(([k, v]) => (
            <p key={k}><b>{k}:</b> {v || '-'}</p>
          ))}
        </article>
      </section>

      <section className="card">
        <div className="search">
          <Search size={18}/>
          <input value={busqueda} onChange={(e)=>setBusqueda(e.target.value)} placeholder={`Buscar ${tipo === 'cliente' ? 'clientes' : tipo === 'proveedor' ? 'proveedores' : 'vendedores'}...`} />
        </div>

        <div className="list">
          {filtrada.map((x) => (
            <article key={x.id}>
              <b>{x.empresa || x.nombre || x.contacto || x.usuario || x.email || 'Registro'}</b>
              <span>{x.whatsapp || x.telefono || x.correo || x.email || 'Sin contacto'}</span>
              {tipo === 'vendedor' && (
                <span>{[x.cedula, x.banco, x.cuenta_bancaria, x.moneda].filter(Boolean).join(' · ') || 'Sin datos bancarios'}</span>
              )}
              <div className="item-actions">
                <button type="button" onClick={() => editarRegistro(x)}>Editar</button>
                <button type="button" onClick={() => eliminarRegistro(x)}>Eliminar</button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <style>{`
        .captura-page{padding:14px;display:grid;gap:14px;background:#f4f6fb;min-height:100vh}
        .captura-hero,.card{background:#fff;border-radius:24px;padding:18px;box-shadow:0 14px 35px rgba(15,23,42,.08)}
        .captura-hero span{font-size:12px;font-weight:950;color:#b48722;text-transform:uppercase}
        .captura-hero h1{margin:8px 0;font-size:30px;color:#111827}
        .captura-hero p{margin:0;color:#64748b;font-weight:800}
        .tabs{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
        .tabs button,.card button{border:0;border-radius:18px;padding:14px;font-weight:950;background:#e5e7eb;color:#111827;display:flex;align-items:center;justify-content:center;gap:8px}
        .tabs button.active,.card button{background:#0f172a;color:#fff}
        .grid{display:grid;grid-template-columns:1.2fr .8fr;gap:14px}
        textarea{width:100%;min-height:260px;border:1px solid #cbd5e1;border-radius:18px;padding:14px;font-size:16px;box-sizing:border-box}
        .card h2{margin:0 0 12px;color:#111827}
        .card p{margin:8px 0;color:#334155}
        .card button.secondary{margin-top:8px;background:#e5e7eb;color:#111827}
        .msg{font-weight:950;color:#047857}
        .search{display:flex;align-items:center;gap:8px;background:#f8fafc;border:1px solid #e5e7eb;border-radius:16px;padding:10px}
        .search input{border:0;background:transparent;outline:0;width:100%;font-size:16px}
        .list{display:grid;gap:8px;margin-top:12px}
        .list article{background:#f8fafc;border:1px solid #e5e7eb;border-radius:16px;padding:12px;display:grid;gap:4px}
        .list b{color:#111827}.list span{color:#64748b;font-weight:800}.item-actions{display:flex;gap:8px;margin-top:8px}.item-actions button{border:0;border-radius:12px;padding:8px 10px;font-weight:900;background:#111827;color:#fff}
        @media(max-width:900px){.grid,.tabs{grid-template-columns:1fr}.captura-page{padding-bottom:90px}}
      `}</style>
    </main>
  );
} 
