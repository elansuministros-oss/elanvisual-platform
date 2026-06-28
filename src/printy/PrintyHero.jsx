import { useEffect, useState } from "react";
import { getHero } from "./data/printyStore";

export default function PrintyHero(){

  const [hero, setHero] = useState(getHero());

  useEffect(()=>{

    const update = () => setHero(getHero());

    window.addEventListener("printy-data-updated", update);

    return () => window.removeEventListener("printy-data-updated", update);

  },[]);

  if(!hero.activo) return null;

  return (

    <section className="printy-hero">

      <img
        src={hero.desktop}
        alt=""
        style={{width:"100%", display:"block"}}
      />

      <div className="hero-buttons">

        <a className="btn-black" href={hero.boton1.link}>
          {hero.boton1.texto}
        </a>

        <a className="btn-yellow" href={hero.boton2.link}>
          {hero.boton2.texto}
        </a>

      </div>

    </section>

  );

}
