import React, { useState, useEffect } from "react";
import { getMegaMenu, saveMegaMenu } from "../../data/printyStore";

export default function MegaMenuManager(){

  const [menu, setMenu] = useState(getMegaMenu());

  useEffect(()=>{

    setMenu(getMegaMenu());

  },[]);

  const update = (field, value) => {

    const updated = { ...menu, [field]: value };

    setMenu(updated);

    saveMegaMenu(updated);

  };

  return (

    <div className="mega-menu-manager">

      <h2>MEGA MENÚ</h2>

      <label>Título</label>

      <input
        value={menu.titulo}
        onChange={(e)=>update("titulo", e.target.value)}
      />

      <label>Descripción</label>

      <input
        value={menu.descripcion}
        onChange={(e)=>update("descripcion", e.target.value)}
      />

      <label>Imagen lateral</label>

      <input
        value={menu.imagen}
        onChange={(e)=>update("imagen", e.target.value)}
      />

      <label>Texto botón</label>

      <input
        value={menu.boton}
        onChange={(e)=>update("boton", e.target.value)}
      />

      <label>Link botón</label>

      <input
        value={menu.link}
        onChange={(e)=>update("link", e.target.value)}
      />

    </div>

  );

}
