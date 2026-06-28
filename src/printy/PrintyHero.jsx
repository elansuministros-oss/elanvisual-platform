import { useEffect, useState } from "react";
import { getHero } from "./data/printyStore";

export default function PrintyHero(){

  const [hero,setHero]=useState(getHero());

  useEffect(()=>{

    const update=()=>setHero(getHero());

    window.addEventListener("printy-data-updated",update);

    return()=>window.removeEventListener("printy-data-updated",update);

  },[]);

  if(!hero?.activo) return null;

  const desktop = hero?.desktop || "";
  const mobile = hero?.mobile || desktop;

  if(!desktop) return null;

  return(

    <section className="printy-hero">

      <picture>

        {mobile && (
          <source media="(max-width:768px)" srcSet={mobile}/>
        )}

        <img
          src={desktop}
          alt="Banner Printy"
          loading="eager"
        />

      </picture>

    </section>

  );

}
