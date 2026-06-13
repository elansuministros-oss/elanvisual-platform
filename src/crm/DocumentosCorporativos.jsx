import React, { useEffect, useState } from 'react';

const leer = () => { try { return JSON.parse(localStorage.getItem('elankav_documentos_corporativos') || '[]'); } catch { return []; } };
const guardar = (docs) => localStorage.setItem('elankav_documentos_corporativos', JSON.stringify(docs));

export default function DocumentosCorporativos() {
  const [documentos, setDocumentos] = useState(leer);
  const [form, setForm] = useState({ nombre:'', tipo:'Contrato', unidadNegocio:'Corporativo', enlace:'', notas:'' });
  useEffect(()=>guardar(documentos), [documentos]);
  const agregar = (e) => { e.preventDefault(); if(!form.nombre.trim()) return; setDocumentos(prev=>[{...form,id:`doc-${Date.now()}`,fechaRegistro:new Date().toISOString()},...prev]); setForm({ nombre:'', tipo:'Contrato', unidadNegocio:'Corporativo', enlace:'', notas:'' }); };
  return <div style={{ padding: 20 }}><h2>Documentos Corporativos</h2><p style={{ color: '#6b7280' }}>Registro de contratos, facturas, diseños, DXF, SVG, STL y archivos de proyecto.</p><form onSubmit={agregar} style={{background:'#fff',padding:18,borderRadius:18,boxShadow:'0 10px 24px rgba(15,23,42,.08)',display:'grid',gap:10,gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))'}}><input placeholder="Nombre" value={form.nombre} onChange={e=>setForm({...form,nombre:e.target.value})} /><input placeholder="Tipo" value={form.tipo} onChange={e=>setForm({...form,tipo:e.target.value})} /><input placeholder="Unidad" value={form.unidadNegocio} onChange={e=>setForm({...form,unidadNegocio:e.target.value})} /><input placeholder="Enlace o ruta" value={form.enlace} onChange={e=>setForm({...form,enlace:e.target.value})} /><button>Guardar documento</button></form><div style={{marginTop:18,background:'#fff',padding:18,borderRadius:18}}>{documentos.map(d=><div key={d.id} style={{borderBottom:'1px solid #eef2f7',padding:'10px 0'}}><strong>{d.nombre}</strong><p>{d.tipo} · {d.unidadNegocio}</p>{d.enlace && <small>{d.enlace}</small>}</div>)}</div></div>;
}
