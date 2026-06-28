import React, { useState, useEffect } from "react";
import { getConfiguracion, saveConfiguracion } from "../../data/printyStore";

export default function ConfiguracionManager(){

  const [config, setConfig] = useState(getConfiguracion());

  useEffect(()=>{

    const update = () => setConfig(getConfiguracion());

    window.addEventListener("printy-data-updated", update);

    return () => window.removeEventListener("printy-data-updated", update);

  },[]);

  const update = (field, value) => {

    const updated = { ...config, [field]: value };

    setConfig(updated);

    saveConfiguracion(updated);

  };

  return (

    <div className="configuracion-manager">

      <h2>CONFIGURACIÓN GLOBAL CMS</h2>

      <input
        placeholder="Nombre empresa"
        value={config.nombreEmpresa}
        onChange={(e)=>update("nombreEmpresa", e.target.value)}
      />

      <input
        placeholder="Logo URL"
        value={config.logo}
        onChange={(e)=>update("logo", e.target.value)}
      />

      <input
        placeholder="WhatsApp"
        value={config.whatsapp}
        onChange={(e)=>update("whatsapp", e.target.value)}
      />

      <input
        placeholder="Email"
        value={config.email}
        onChange={(e)=>update("email", e.target.value)}
      />

      <h3>Redes sociales</h3>

      <input
        placeholder="Facebook"
        value={config.facebook}
        onChange={(e)=>update("facebook", e.target.value)}
      />

      <input
        placeholder="Instagram"
        value={config.instagram}
        onChange={(e)=>update("instagram", e.target.value)}
      />

      <input
        placeholder="TikTok"
        value={config.tiktok}
        onChange={(e)=>update("tiktok", e.target.value)}
      />

      <input
        placeholder="YouTube"
        value={config.youtube}
        onChange={(e)=>update("youtube", e.target.value)}
      />

      <h3>SEO</h3>

      <input
        placeholder="SEO Title"
        value={config.seoTitle}
        onChange={(e)=>update("seoTitle", e.target.value)}
      />

      <input
        placeholder="SEO Description"
        value={config.seoDescription}
        onChange={(e)=>update("seoDescription", e.target.value)}
      />

      <h3>Colores</h3>

      <input
        type="color"
        value={config.colorPrimario}
        onChange={(e)=>update("colorPrimario", e.target.value)}
      />

      <input
        type="color"
        value={config.colorSecundario}
        onChange={(e)=>update("colorSecundario", e.target.value)}
      />

    </div>

  );

}
