import React, { useState, useEffect } from "react";
import { getMedia, saveMedia } from "../../data/printyStore";

export default function ImagePicker({ value, onSelect }){

  const [media, setMedia] = useState(getMedia());
  const [open, setOpen] = useState(false);

  useEffect(()=>{

    const update = () => setMedia(getMedia());

    window.addEventListener("printy-data-updated", update);

    return () => window.removeEventListener("printy-data-updated", update);

  },[]);

  const images = media.filter(m => m.tipo === "imagen");

  return (

    <div className="image-picker">

      <button type="button" onClick={()=>setOpen(true)}>
        Seleccionar imagen
      </button>

      {value && (
        <img src={value} alt="" style={{width:80, marginTop:10}} />
      )}

      {open && (

        <div className="picker-modal">

          <div className="picker-grid">

            {images.map(img => (

              <div
                key={img.id}
                className="picker-item"
                onClick={()=>{

                  onSelect(img.url);
                  setOpen(false);

                }}
              >

                <img src={img.url} alt={img.nombre} />

              </div>

            ))}

          </div>

          <button onClick={()=>setOpen(false)}>
            Cerrar
          </button>

        </div>

      )}

    </div>

  );

}
