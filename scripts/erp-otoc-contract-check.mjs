import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const detailPath = path.join(root, 'src/pages/QuotationDetail.jsx');
const servicePath = path.join(root, 'src/modules/quotation-viewer/services/operationalOrdersService.js');
const cssPath = path.join(root, 'src/styles/operational-flow.css');

const detail = fs.readFileSync(detailPath, 'utf8');
const service = fs.readFileSync(servicePath, 'utf8');
const css = fs.readFileSync(cssPath, 'utf8');

const checks = [
  ['Ver cotizacion', detail.includes('Ver cotizacion')],
  ['Generar OT', detail.includes('Generar OT')],
  ['Ver OT', detail.includes('Ver OT')],
  ['Generar OC', detail.includes('Generar OC')],
  ['Ver OC', detail.includes('Ver OC')],
  ['POST OT via Orchestrator', service.includes("projectPath(projectId, 'work-orders')") && service.includes("method: 'POST'")],
  ['POST OC via Orchestrator', service.includes("projectPath(projectId, 'purchase-orders')") && service.includes('supplierId')],
  ['Sin Supabase directo', !detail.includes('@supabase') && !service.includes('@supabase')],
  ['Vista adaptable', css.includes('@media (max-width: 760px)')]
];

const failed = checks.filter(([, ok]) => !ok);
checks.forEach(([name, ok]) => console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`));

if (failed.length) {
  process.exitCode = 1;
  throw new Error(`ERP-OTOC-01 contract check failed: ${failed.map(([name]) => name).join(', ')}`);
}

console.log(`ERP-OTOC-01: ${checks.length}/${checks.length} validaciones aprobadas.`);
