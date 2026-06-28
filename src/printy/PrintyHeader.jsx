import { useEffect, useState } from "react";
import { cargarPrintyMenu } from "./data/printyStore";

export default function PrintyHeader() {
  const [menuItems, setMenuItems] = useState(cargarPrintyMenu());

  useEffect(() => {
    const actualizar = () => setMenuItems(cargarPrintyMenu());
    window.addEventListener("printy-data-updated", actualizar);
    window.addEventListener("storage", actualizar);
    return () => {
      window.removeEventListener("printy-data-updated", actualizar);
      window.removeEventListener("storage", actualizar);
    };
  }, []);

  return (
    <header className="printy-header">
      <a href="/" className="printy-logo">
        <img src="/assets/branding/elanvisual.svg" alt="ELANVISUAL" />
      </a>

      <nav className="printy-nav">
        <div className="printy-menu-dropdown">
          <button className="printy-menu-trigger" type="button">CATÁLOGO⌃</button>
          <div className="printy-dropdown-panel">
            {menuItems.map((item) => (
              <a href={"/printy?categoria=" + encodeURIComponent(item)} key={item}>{item}</a>
            ))}
          </div>
        </div>

        <div>PERSONALIZA</div>
        <div>PERSONALIZA TU ESPEJO</div>
        <div>LETREROS DE INTERIOR</div>
        <div>LETREROS DE EXTERIOR</div>
      </nav>

      <button className="printy-track-btn">MI PEDIDO</button>

      <div className="printy-icons">
        <span>⌕</span>
        <span>♙</span>
        <span>▢</span>
      </div>
    </header>
  );
}

