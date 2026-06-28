import React, { useState, useEffect } from "react";
import { getProductos, saveProductos, getCategorias } from "../../data/printyStore";

export default function ProductoManager(){

  const [lista, setLista] = useState(getProductos());
  const [categorias] = useState(getCategorias());

  const [form, setForm] = useState({
    codigo:"",
    nombre:"",
    slug:"",
    categoria:"",
    descripcion:"",
    precio:"",
    oferta:"",
    imagen:"",
    galeria:[],
    visible:true,
    orden:0
  });

  useEffect(()=>{

    setLista(getProductos());

  },[]);

  const update = (field, value) => {

    setForm(prev => ({...prev, [field]: value}));

  };

  const add = () => {

    const updated = [
      ...lista,
      {
        ...form,
        id: Date.now()
      }
    ];

    setLista(updated);

    saveProductos(updated);

    setForm({
      codigo:"",
      nombre:"",
      slug:"",
      categoria:"",
      descripcion:"",
      precio:"",
      oferta:"",
      imagen:"",
      galeria:[],
      visible:true,
      orden:0
    });

  };

  const remove = (id) => {

    const updated = lista.filter(p => p.id !== id);

    setLista(updated);

    saveProductos(updated);

  };

  return (

    <div className="producto-manager">

      <h2>PRODUCTOS</h2>

      <div className="form">

        <input placeholder="Código" value={form.codigo} onChange={(e)=>update("codigo", e.target.value)} />

        <input placeholder="Nombre" value={form.nombre} onChange={(e)=>update("nombre", e.target.value)} />

        <input placeholder="Slug" value={form.slug} onChange={(e)=>update("slug", e.target.value)} />

        <select value={form.categoria} onChange={(e)=>update("categoria", e.target.value)}>

          <option value="">Seleccionar categoría</option>

          {categorias.map((c,i)=>(

            <option key={i} value={c.nombre}>{c.nombre}</option>

          ))}

        </select>

        <input placeholder="Descripción" value={form.descripcion} onChange={(e)=>update("descripcion", e.target.value)} />

        <input placeholder="Precio" value={form.precio} onChange={(e)=>update("precio", e.target.value)} />

        <input placeholder="Oferta" value={form.oferta} onChange={(e)=>update("oferta", e.target.value)} />

        <input placeholder="Imagen" value={form.imagen} onChange={(e)=>update("imagen", e.target.value)} />

        <button onClick={add}>Agregar producto</button>

      </div>

      <div className="list">

        {lista.map(p => (

          <div key={p.id} className="item">

            <strong>{p.nombre}</strong>

            <span>{p.codigo}</span>

            <span>{p.precio}</span>

            <button onClick={()=>remove(p.id)}>Eliminar</button>

          </div>

        ))}

      </div>

    </div>

  );

}
