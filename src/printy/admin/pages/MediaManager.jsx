import React, { useState, useEffect } from "react";
import { getMedia, saveMedia } from "../../data/printyStore";

export default function MediaManager(){

  const [media, setMedia] = useState(getMedia());

  const [form, setForm] = useState({
    nombre:"",
    tipo:"imagen",
    url:"",
    etiqueta:"",
    uso:"general"
  });

  useEffect(()=>{

    const update = () => setMedia(getMedia());

    window.addEventListener("printy-data-updated", update);

    return () => window.removeEventListener("printy-data-updated", update);

  },[]);

  const update = (field, value) => {

    setForm(prev => ({...prev, [field]: value}));

  };

  const add = () => {

    const updated = [

      ...media,

      {
        ...form,
        id: Date.now()
      }

    ];

    setMedia(updated);

    saveMedia(updated);

    setForm({
      nombre:"",
      tipo:"imagen",
      url:"",
      etiqueta:"",
      uso:"general"
    });

  };

  const remove = (id) => {

    const updated = media.filter(m => m.id !== id);

    setMedia(updated);

    saveMedia(updated);

  };

  const renderPreview = (item) => {

    if(item.tipo === "imagen"){
      return <img src={item.url} alt="" style={{width:60}} />;
    }

    if(item.tipo === "video"){
      return <video src={item.url} style={{width:80}} controls />;
    }

    return <span>📄</span>;

  };

  return (

    <div className="media-manager">

      <h2>MEDIA CENTER CMS</h2>

      <div className="form">

        <input
          placeholder="Nombre"
          value={form.nombre}
          onChange={(e)=>update("nombre", e.target.value)}
        />

        <select
          value={form.tipo}
          onChange={(e)=>update("tipo", e.target.value)}
        >

          <option value="imagen">Imagen</option>
          <option value="video">Video</option>
          <option value="documento">Documento</option>

        </select>

        <input
          placeholder="URL o link"
          value={form.url}
          onChange={(e)=>update("url", e.target.value)}
        />

        <input
          placeholder="Etiqueta"
          value={form.etiqueta}
          onChange={(e)=>update("etiqueta", e.target.value)}
        />

        <input
          placeholder="Uso (hero, producto, banner...)"
          value={form.uso}
          onChange={(e)=>update("uso", e.target.value)}
        />

        <button onClick={add}>
          Agregar archivo
        </button>

      </div>

      <div className="list">

        {media.map(item => (

          <div key={item.id} className="item">

            {renderPreview(item)}

            <strong>{item.nombre}</strong>

            <span>{item.tipo}</span>

            <span>{item.uso}</span>

            <button onClick={()=>remove(item.id)}>
              Eliminar
            </button>

          </div>

        ))}

      </div>

    </div>

  );

}
