import React from "react";

export default function Sidebar({ page, setPage }){

  const items = [
    { id: "dashboard", label: "Dashboard" },
    { id: "hero", label: "Hero" },
    { id: "header", label: "Header" },
    { id: "megamenu", label: "Mega Menú" },
    { id: "categorias", label: "Categorías" },
    { id: "productos", label: "Productos" },
    { id: "media", label: "Media Center" },
    { id: "configuracion", label: "Configuración" }
  ];

  return (

    <aside style={{width:"220px", background:"#111", color:"#fff", minHeight:"100vh", padding:"20px"}}>

      <h2>PRINTY</h2>

      {items.map(i => (

        <div
          key={i.id}
          onClick={()=>setPage(i.id)}
          style={{padding:"10px", cursor:"pointer"}}
        >

          {i.label}

        </div>

      ))}

    </aside>

  );

}
