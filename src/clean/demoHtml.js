const shell = (body, extraCss = '') => `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>*{box-sizing:border-box}html,body{margin:0;height:100%;font-family:Inter,Arial,sans-serif;background:#0b0b0c;color:#fff}a{text-decoration:none}${extraCss}</style>
</head><body>${body}</body></html>`;

const whatsappQuoteHref = (subject = 'proyecto visual') => {
  const message = `ELAN, quiero cotizar: ${subject}. Origen: ELANVISUAL.`;
  return `https://wa.me/50585228183?text=${encodeURIComponent(message)}`;
};

export const heroPromoHtml = shell(`
<main class="hero">
  <div class="media" aria-hidden="true"></div><div class="shade" aria-hidden="true"></div>
  <div class="content">
    <span class="eyebrow">ELANVISUAL · DISEÑO + FABRICACIÓN + INSTALACIÓN</span>
    <h1>Convertimos espacios<br><strong>en marcas que se ven.</strong></h1>
    <p>Diseño, impresión, rotulación, estructuras, displays, grabado, textil y mobiliario producido a medida.</p>
    <div class="actions">
      <a class="primary" href="/catalogo" target="_top">Ver catálogo</a>
      <a class="secondary" href="${whatsappQuoteHref('un proyecto visual')}" target="_top">Solicitar cotización</a>
    </div>
  </div>
</main>`, `
body{overflow:hidden}.hero{position:relative;min-height:100vh;display:flex;align-items:flex-end;padding:clamp(28px,6vw,90px);overflow:hidden;background:#090909}.media{position:absolute;inset:0;background:url('/servicios/hero-servicios.webp') center/cover no-repeat;transform:scale(1.02)}.shade{position:absolute;inset:0;background:linear-gradient(90deg,rgba(0,0,0,.88) 0%,rgba(0,0,0,.67) 48%,rgba(0,0,0,.25) 100%),linear-gradient(0deg,rgba(0,0,0,.7),transparent 65%)}.content{position:relative;z-index:3;max-width:820px}.eyebrow{display:inline-block;color:#e4bd3b;font-size:12px;font-weight:800;letter-spacing:.16em;margin-bottom:18px}.hero h1{font-size:clamp(42px,7vw,92px);line-height:.95;margin:0;letter-spacing:-.055em;font-weight:500}.hero h1 strong{color:#e0b632;font-weight:800}.hero p{max-width:680px;color:#e0e0e0;font-size:clamp(16px,2vw,21px);line-height:1.55;margin:28px 0}.actions{display:flex;gap:12px;flex-wrap:wrap}.actions a{padding:15px 20px;border-radius:999px;font-weight:800}.primary{background:#e0b632;color:#111}.secondary{border:1px solid #ffffff55;color:#fff;background:#1118;backdrop-filter:blur(8px)}@media(max-width:760px){.hero{padding:34px 22px 34px;align-items:flex-end}.media{background-position:60% center}.shade{background:linear-gradient(0deg,rgba(0,0,0,.92) 0%,rgba(0,0,0,.55) 75%,rgba(0,0,0,.25) 100%)}.hero p{margin:20px 0}.actions a{width:100%;text-align:center}}@media(orientation:landscape) and (max-height:600px){.hero{min-height:100vh;align-items:center;padding:18px 28px}.media{background-position:62% center}.shade{background:linear-gradient(90deg,rgba(0,0,0,.94) 0%,rgba(0,0,0,.74) 50%,rgba(0,0,0,.22) 100%)}.content{max-width:58vw}.eyebrow{font-size:10px;margin-bottom:10px}.hero h1{font-size:clamp(34px,6vw,58px)}.hero p{font-size:14px;line-height:1.4;margin:14px 0}.actions a{width:auto;padding:11px 15px;font-size:13px}}
`);

export const promoBannerHtml = shell(`
<section class="promo"><div><span>PROMOCIÓN / SLOT PROGRAMABLE</span><h2>Tu próxima fachada puede empezar aquí.</h2><p>Este espacio podrá ser reemplazado por ELAN con cualquier campaña HTML aprobada.</p></div><a href="${whatsappQuoteHref('una fachada comercial')}" target="_top">Quiero cotizar</a></section>`, `
body{display:grid;place-items:center;background:#f3f1eb;color:#111}.promo{width:100%;height:100%;min-height:260px;display:flex;align-items:center;justify-content:space-between;gap:30px;padding:clamp(26px,5vw,60px);background:linear-gradient(115deg,#f7f4eb,#e7dcae)}.promo span{font-size:11px;font-weight:900;letter-spacing:.18em;color:#846b12}.promo h2{font-size:clamp(30px,5vw,58px);line-height:1;margin:8px 0 12px;max-width:840px}.promo p{margin:0;color:#5f5a49}.promo a{flex:0 0 auto;background:#111;color:#fff;padding:16px 22px;border-radius:999px;font-weight:800}@media(max-width:700px){.promo{align-items:flex-start;flex-direction:column;justify-content:center}.promo a{width:100%;text-align:center}}@media(orientation:landscape) and (max-height:600px){.promo{min-height:100%;flex-direction:row;align-items:center;padding:18px 28px;gap:20px}.promo h2{font-size:clamp(26px,5vw,42px);margin:6px 0 8px}.promo p{font-size:13px}.promo a{width:auto;padding:12px 16px}}
`);

export function productCardHtml({ title, subtitle, price, accent = '#e0b632', type = 'ELANVISUAL', image = '' }) {
  const safeImage = String(image || '').replace(/["'<>]/g, '');
  const quoteHref = whatsappQuoteHref(title);
  return shell(`
  <article class="card">
    <div class="art" style="--card-image:url('${safeImage}')"><div class="veil"></div><div class="badge">${type}</div></div>
    <div class="body"><small>ELANVISUAL</small><h3>${title}</h3><p>${subtitle}</p><div class="bottom"><div><em>Precio</em><strong>${price}</strong></div><a href="${quoteHref}" target="_top">Cotizar</a></div></div>
  </article>`, `
body{background:transparent;color:#111}.card{height:100%;min-height:450px;border-radius:26px;overflow:hidden;background:#fff;border:1px solid #e8e8e8;display:grid;grid-template-rows:1.08fr .92fr}.art{position:relative;background:#151515 var(--card-image) center/cover no-repeat;overflow:hidden}.veil{position:absolute;inset:0;background:linear-gradient(0deg,#0009,transparent 62%)}.badge{position:absolute;left:18px;bottom:16px;border:1px solid #ffffff55;background:#080808aa;color:#fff;backdrop-filter:blur(8px);border-radius:999px;padding:8px 11px;font-size:11px;font-weight:900;letter-spacing:.12em;box-shadow:0 0 35px ${accent}22}.body{padding:22px 22px 20px}.body small{font-size:10px;font-weight:900;letter-spacing:.16em;color:#8f7417}.body h3{font-size:25px;line-height:1.05;margin:8px 0}.body p{color:#666;line-height:1.45;margin:0 0 18px}.bottom{display:flex;align-items:end;justify-content:space-between;gap:14px}.bottom em{display:block;font-size:11px;color:#888;font-style:normal}.bottom strong{font-size:18px}.bottom a{background:#111;color:#fff;border-radius:999px;padding:12px 15px;font-size:13px;font-weight:800}
`);
}
