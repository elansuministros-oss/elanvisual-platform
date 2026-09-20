const shell = (body, extraCss = '') => `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>*{box-sizing:border-box}html,body{margin:0;height:100%;font-family:Inter,Arial,sans-serif;background:#0b0b0c;color:#fff}a{text-decoration:none}${extraCss}</style>
</head><body>${body}</body></html>`;

export const heroPromoHtml = shell(`
<main class="hero">
  <div class="orb one"></div><div class="orb two"></div>
  <div class="content">
    <span class="eyebrow">ELANVISUAL · CAMPAÑA ACTIVA</span>
    <h1>Convertimos espacios<br><strong>en marcas que se ven.</strong></h1>
    <p>Rótulos, impresión, exhibición y producción visual con diseño, fabricación e instalación.</p>
    <div class="actions">
      <a class="primary" href="/catalogo" target="_top">Ver catálogo</a>
      <a class="secondary" href="/contacto" target="_top">Solicitar cotización</a>
    </div>
  </div>
  <div class="visual">
    <div class="sign"><span>ELAN</span><b>VISUAL</b></div>
    <div class="glow"></div>
  </div>
</main>`, `
body{overflow:hidden}.hero{position:relative;min-height:100vh;display:grid;grid-template-columns:1.1fr .9fr;align-items:center;padding:clamp(28px,6vw,90px);background:radial-gradient(circle at 85% 10%,#3a2d06 0,transparent 35%),linear-gradient(135deg,#070707,#151515 55%,#0a0a0a);overflow:hidden}.content{position:relative;z-index:3;max-width:760px}.eyebrow{display:inline-block;color:#e4bd3b;font-size:12px;font-weight:800;letter-spacing:.16em;margin-bottom:18px}.hero h1{font-size:clamp(42px,7vw,92px);line-height:.95;margin:0;letter-spacing:-.055em;font-weight:500}.hero h1 strong{color:#e0b632;font-weight:800}.hero p{max-width:610px;color:#cfcfcf;font-size:clamp(16px,2vw,21px);line-height:1.55;margin:28px 0}.actions{display:flex;gap:12px;flex-wrap:wrap}.actions a{padding:15px 20px;border-radius:999px;font-weight:800}.primary{background:#e0b632;color:#111}.secondary{border:1px solid #4c4c4c;color:#fff;background:#171717}.visual{position:relative;height:440px;display:grid;place-items:center}.sign{position:relative;z-index:2;padding:38px 48px;border-radius:24px;background:linear-gradient(145deg,#1b1b1c,#050505);border:1px solid #393939;box-shadow:0 35px 80px #000;transform:rotate(-7deg);font-size:clamp(34px,5vw,65px);font-weight:900;letter-spacing:.04em}.sign span{color:white}.sign b{color:#e0b632;margin-left:10px}.glow{position:absolute;width:65%;height:38%;background:#d4a90f;filter:blur(80px);opacity:.28}.orb{position:absolute;border-radius:50%;filter:blur(2px);opacity:.22}.orb.one{width:280px;height:280px;background:#e0b632;right:-80px;top:-80px}.orb.two{width:180px;height:180px;background:#fff;left:-80px;bottom:-100px;opacity:.05}@media(max-width:760px){.hero{grid-template-columns:1fr;padding:34px 22px 26px;align-content:center}.visual{height:210px;margin-top:20px}.sign{padding:26px 24px}.hero p{margin:20px 0}.actions a{width:100%;text-align:center}}
`);

export const promoBannerHtml = shell(`
<section class="promo"><div><span>PROMOCIÓN</span><h2>Tu próxima fachada puede empezar aquí.</h2><p>Diseño + fabricación + instalación en una sola experiencia.</p></div><a href="/contacto" target="_top">Quiero cotizar</a></section>`, `
body{display:grid;place-items:center;background:#f3f1eb;color:#111}.promo{width:100%;height:100%;min-height:260px;display:flex;align-items:center;justify-content:space-between;gap:30px;padding:clamp(26px,5vw,60px);background:linear-gradient(115deg,#f7f4eb,#e7dcae)}.promo span{font-size:11px;font-weight:900;letter-spacing:.18em;color:#846b12}.promo h2{font-size:clamp(30px,5vw,58px);line-height:1;margin:8px 0 12px;max-width:840px}.promo p{margin:0;color:#5f5a49}.promo a{flex:0 0 auto;background:#111;color:#fff;padding:16px 22px;border-radius:999px;font-weight:800}@media(max-width:700px){.promo{align-items:flex-start;flex-direction:column;justify-content:center}.promo a{width:100%;text-align:center}}
`);

export function productCardHtml({ title, subtitle, price, accent = '#e0b632', type = 'LETRAS' }) {
  return shell(`
  <article class="card">
    <div class="art"><div class="mock"><span>${type}</span></div></div>
    <div class="body"><small>ELANVISUAL</small><h3>${title}</h3><p>${subtitle}</p><div class="bottom"><div><em>Desde</em><strong>${price}</strong></div><a href="/contacto" target="_top">Cotizar</a></div></div>
  </article>`, `
body{background:transparent;color:#111}.card{height:100%;min-height:430px;border-radius:26px;overflow:hidden;background:#fff;border:1px solid #e8e8e8;display:grid;grid-template-rows:1.06fr .94fr}.art{display:grid;place-items:center;background:linear-gradient(145deg,#111,#292929);position:relative;overflow:hidden}.art:before{content:'';position:absolute;width:220px;height:220px;border-radius:50%;background:${accent};filter:blur(70px);opacity:.28}.mock{position:relative;z-index:1;padding:28px 24px;border:1px solid #ffffff30;border-radius:18px;background:#0b0b0bdd;box-shadow:0 25px 50px #0008}.mock span{font-size:clamp(28px,5vw,54px);font-weight:900;letter-spacing:.08em;color:#fff;text-shadow:0 0 24px ${accent}}.body{padding:22px 22px 20px}.body small{font-size:10px;font-weight:900;letter-spacing:.16em;color:#8f7417}.body h3{font-size:25px;line-height:1.05;margin:8px 0}.body p{color:#666;line-height:1.45;margin:0 0 18px}.bottom{display:flex;align-items:end;justify-content:space-between;gap:14px}.bottom em{display:block;font-size:11px;color:#888;font-style:normal}.bottom strong{font-size:21px}.bottom a{background:#111;color:#fff;border-radius:999px;padding:12px 15px;font-size:13px;font-weight:800}
`);
}

export const sampleProducts = [
  { title: 'Letras corpóreas', subtitle: 'Volumen, iluminación y acabados configurables para fachadas e interiores.', price: 'Cotización', accent: '#e0b632', type: '3D' },
  { title: 'Cajas de luz', subtitle: 'Soluciones luminosas para exterior e interior con estructura a medida.', price: 'Cotización', accent: '#d9e7ff', type: 'LIGHT' },
  { title: 'Impresión gran formato', subtitle: 'Vinil, microperforado, lonas y aplicaciones para campañas visuales.', price: 'Cotización', accent: '#f4b3d1', type: 'PRINT' },
  { title: 'Exhibidores', subtitle: 'Mobiliario comercial y piezas de exhibición producidas según proyecto.', price: 'Cotización', accent: '#9ed9c8', type: 'DISPLAY' },
  { title: 'ACM y fachadas', subtitle: 'Revestimientos, volumen, cortes y combinaciones para identidad exterior.', price: 'Cotización', accent: '#b7b7b7', type: 'ACM' },
  { title: 'Señalización', subtitle: 'Sistemas funcionales y visuales para espacios comerciales y corporativos.', price: 'Cotización', accent: '#d5b5ff', type: 'SIGN' }
];
