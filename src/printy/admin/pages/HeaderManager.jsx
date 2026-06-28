import React, { useState, useEffect } from "react";
import { getHeader, saveHeader } from "../../data/printyStore";

export default function HeaderManager(){

  const [header, setHeader] = useState(getHeader());

  useEffect(()=>{

    setHeader(getHeader());

  },[]);

  const updateItem = (index, field, value) => {

    const updated = { ...header };

    updated.items[index][field] = value;

    setHeader(updated);

    saveHeader(updated);

  };

  const addItem = () => {

    const updated = { ...header };

    updated.items.push({
      id: Date.now(),
      nombre: "NUEVO ITEM",
      tipo: "link",
      link: "#",
      visible: true,
      orden: updated.items.length + 1
    });

    setHeader(updated);

    saveHeader(updated);

  };

  const removeItem = (index) => {

    const updated = { ...header };

    updated.items.splice(index, 1);

    setHeader(updated);

    saveHeader(updated);

  };

  return (

    <div className="header-manager">

      <h2>EDITOR HEADER</h2>

      <button onClick={addItem}>Agregar Item</button>

      {header.items.map((item, index)=>(

        <div key={item.id} className="header-item">

          <input
            value={item.nombre}
            onChange={(e)=>updateItem(index,"nombre",e.target.value)}
            placeholder="Nombre"
          />

          <input
            value={item.link || ""}
            onChange={(e)=>updateItem(index,"link",e.target.value)}
            placeholder="Link"
          />

          <select
            value={item.tipo}
            onChange={(e)=>updateItem(index,"tipo",e.target.value)}
          >
            <option value="link">Link</option>
            <option value="mega">Mega Menú</option>
          </select>

          <label>
            <input
              type="checkbox"
              checked={item.visible}
              onChange={(e)=>updateItem(index,"visible",e.target.checked)}
            />
            Visible
          </label>

          <button onClick={()=>removeItem(index)}>Eliminar</button>

        </div>

      ))}

    </div>

  );

}
