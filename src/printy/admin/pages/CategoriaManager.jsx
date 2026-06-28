import React, { useState, useEffect } from "react";
import { getCategorias, saveCategorias } from "../../data/printyStore";

export default function CategoriaManager(){

  const [lista, setLista] = useState(getCategorias());

  const [form, setForm] = useState({
    nombre:"",
    slug:"",
    imagen:"",
    bannerDesktop:"",
    bannerMobile:"",
    descripcion:"",
    visible:true
  });

  useEffect(()=>{

    setLista(getCategorias());

  },[]);

  const updateForm = (field, value) => {

    setForm(prev => ({...prev, [field]: value}));

  };

  const addCategoria = () => {

    const updated = [
      ...lista,
      {
        ...form,
        id: Date.now(),
        orden: lista.length + 1
      }
    ];

    setLista(updated);

    saveCategorias(updated);

    setForm({
      nombre:"",
      slug:"",
      imagen:"",
      bannerDesktop:"",
      bannerMobile:"",
      descripcion:"",
      visible:true
    });

  };

  const remove = (id) => {

    const updated = lista.filter(c => c.id !== id);

    setLista(updated);

    saveCategorias(updated);

  };

  return (

    <div className="categoria-manager">

      <h2>CATEGORÍAS</h2>

      <div className="form">

        <input placeholder="Nombre" value={form.nombre} onChange={(e)=>updateForm("nombre", e.target.value)} />

        <input placeholder="Slug" value={form.slug} onChange={(e)=>updateForm("slug", e.target.value)} />

        <input placeholder="Imagen" value={form.imagen} onChange={(e)=>updateForm("imagen", e.target.value)} />

        <input placeholder="Banner Desktop" value={form.bannerDesktop} onChange={(e)=>updateForm("bannerDesktop", e.target.value)} />

        <input placeholder="Banner Mobile" value={form.bannerMobile} onChange={(e)=>updateForm("bannerMobile", e.target.value)} />

        <input placeholder="Descripción" value={form.descripcion} onChange={(e)=>updateForm("descripcion", e.target.value)} />

        <button onClick={addCategoria}>Agregar categoría</button>

      </div>

      <div className="list">

        {lista.map(cat => (

          <div key={cat.id} className="item">

            <strong>{cat.nombre}</strong>

            <span>{cat.slug}</span>

            <button onClick={()=>remove(cat.id)}>Eliminar</button>

          </div>

        ))}

      </div>

    </div>

  );

}
