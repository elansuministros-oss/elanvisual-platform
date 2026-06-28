import "./styles/printy.css";
import "./styles/header.css";
import "./styles/hero.css";
import "./styles/productos.css";
import "./styles/footer.css";

import PrintyHeader from "./PrintyHeader";
import PrintyHero from "./PrintyHero";
import PrintyProductos from "./PrintyProductos";
import PrintyFooter from "./PrintyFooter";

export default function PrintyApp() {
  return (
    <main className="printy-app">
      <PrintyHeader />
      <PrintyHero />
      <PrintyProductos />
      <PrintyFooter />
    </main>
  );
}
