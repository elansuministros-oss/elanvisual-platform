import "./styles/printy.css";
import "./styles/header.css";
import "./styles/hero.css";
import "./styles/categorias.css";
import "./styles/productos.css";
import "./styles/tracking.css";
import "./styles/footer.css";

import PrintyHeader from "./PrintyHeader";
import PrintyHero from "./PrintyHero";
import PrintyCategorias from "./PrintyCategorias";
import PrintyProductos from "./PrintyProductos";
import PrintyTracking from "./PrintyTracking";
import PrintyFooter from "./PrintyFooter";

export default function PrintyApp() {
  return (
    <main className="printy-app">
      <PrintyHeader />
      <PrintyHero />
      <PrintyCategorias />
      <PrintyProductos />
      <PrintyTracking />
      <PrintyFooter />
    </main>
  );
}
