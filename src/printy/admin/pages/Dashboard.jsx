import React from "react";

export default function Dashboard(){

  return(

    <div className="printy-dashboard">

      <h1>PRINTY CMS</h1>

      <p>Panel de administración activo</p>

      <div className="dashboard-grid">

        <div className="card">Hero</div>

        <div className="card">Header</div>

        <div className="card">Mega Menú</div>

        <div className="card">Categorías</div>

        <div className="card">Productos</div>

        <div className="card">Media Center</div>

        <div className="card">Configuración</div>

      </div>

    </div>

  );

}
