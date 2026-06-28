import { useEffect, useState } from "react";
import { getProductos, getCategorias } from "./data/printyStore";

export default function PrintyProductos(){

  const [productos, setProductos] = useState(getProductos());
  const [categorias, setCategorias] = useState(getCategorias());
  const [filtro, setFiltro] = useState("todos");

  useEffect(()=>{

    const update = () => {
      setProductos(getProductos());
      setCategorias(getCategorias());
    };

    window.addEventListener("printy-data-updated", update);

    return () => window.removeEventListener("printy-data-updated", update);

  },[]);

  const filtrados = filtro === "todos"
    ? productos
    : productos.filter(p => p.categoria === filtro);

  return (

    <section className="printy-productos">

      {/* FILTROS CATEGORÍAS */}

      <div className="printy-filtros">

        <button
          onClick={()=>setFiltro("todos")}
          className={filtro === "todos" ? "active" : ""}
        >
          Todos
        </button>

        {categorias.map(cat => (

          <button
            key={cat.id}
            onClick={()=>setFiltro(cat.nombre)}
            className={filtro === cat.nombre ? "active" : ""}
          >
            {cat.nombre}
          </button>

        ))}

      </div>

      {/* GRID PRODUCTOS */}

      <div className="printy-grid">

        {filtrados.map(p => (

          <div key={p.id} className="producto-card">

            <img src={p.imagen} alt={p.nombre} />

            <h3>{p.nombre}</h3>

            <p>{p.precio}</p>

          </div>

        ))}

      </div>

    </section>

  );

}
