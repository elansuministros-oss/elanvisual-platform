import { useEffect, useState } from "react";
import { getHeader, getCategorias } from "./data/printyStore";

export default function PrintyHeader(){

  const [header, setHeader] = useState(getHeader());
  const [categorias, setCategorias] = useState(getCategorias());

  useEffect(()=>{

    const update = () => {
      setHeader(getHeader());
      setCategorias(getCategorias());
    };

    window.addEventListener("printy-data-updated", update);

    return () => window.removeEventListener("printy-data-updated", update);

  },[]);

  return (

    <header className="printy-header">

      <div className="printy-logo">

        {header.logo ? (
          <img src={header.logo} alt="logo" />
        ) : (
          <h2>PRINTY</h2>
        )}

      </div>

      <nav className="printy-nav">

        {header.items.map(item => (

          item.visible && (

            <div key={item.id} className="nav-item">

              {item.tipo === "mega" ? (

                <div className="mega">

                  <span>{item.nombre}</span>

                  <div className="mega-panel">

                    {categorias.map(cat => (

                      <a key={cat.id} href={"/printy?cat=" + cat.slug}>
                        {cat.nombre}
                      </a>

                    ))}

                  </div>

                </div>

              ) : (

                <a href={item.link}>
                  {item.nombre}
                </a>

              )}

            </div>

          )

        ))}

      </nav>

    </header>

  );

}
