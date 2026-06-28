import React, { useState, useEffect } from "react";
import { getHero, saveHero } from "../../data/printyStore";
import ImagePicker from "../components/ImagePicker";

export default function HeroManager(){

  const [hero, setHero] = useState(getHero());

  useEffect(()=>{

    const update = () => setHero(getHero());

    window.addEventListener("printy-data-updated", update);

    return () => window.removeEventListener("printy-data-updated", update);

  },[]);

  const update = (field, value) => {

    const updated = { ...hero, [field]: value };

    setHero(updated);

    saveHero(updated);

  };

  const updateBoton = (btn, field, value) => {

    const updated = { ...hero };

    updated[btn][field] = value;

    setHero(updated);

    saveHero(updated);

  };

  return (

    <div className="hero-manager">

      <h2>HERO CMS</h2>

      <label>Imagen Desktop</label>

      <ImagePicker
        value={hero.desktop}
        onSelect={(url)=>update("desktop", url)}
      />

      <label>Imagen Mobile</label>

      <ImagePicker
        value={hero.mobile}
        onSelect={(url)=>update("mobile", url)}
      />

      <h3>Botón Negro</h3>

      <input
        value={hero.boton1.texto}
        onChange={(e)=>updateBoton("boton1","texto",e.target.value)}
      />

      <input
        value={hero.boton1.link}
        onChange={(e)=>updateBoton("boton1","link",e.target.value)}
      />

      <h3>Botón Amarillo</h3>

      <input
        value={hero.boton2.texto}
        onChange={(e)=>updateBoton("boton2","texto",e.target.value)}
      />

      <input
        value={hero.boton2.link}
        onChange={(e)=>updateBoton("boton2","link",e.target.value)}
      />

      <label>

        <input
          type="checkbox"
          checked={hero.activo}
          onChange={(e)=>update("activo", e.target.checked)}
        />

        Hero activo

      </label>

    </div>

  );

}
