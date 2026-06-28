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

  return (

    <div className="hero-manager">

      <h2>Hero Printy</h2>

      <p>
        El Hero no usa titulo, subtitulo ni descripcion HTML.
        Todo el mensaje debe venir integrado dentro de la imagen del banner.
      </p>

      <label>Imagen Desktop / PC</label>

      <ImagePicker
        value={hero.desktop || ""}
        onSelect={(url)=>update("desktop", url)}
      />

      <label>Imagen Mobile</label>

      <ImagePicker
        value={hero.mobile || ""}
        onSelect={(url)=>update("mobile", url)}
      />

      <label>

        <input
          type="checkbox"
          checked={!!hero.activo}
          onChange={(e)=>update("activo", e.target.checked)}
        />

        Hero activo

      </label>

    </div>

  );

}
