import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  adaptQuotationDocument,
  mapCatalogItemToContextResult,
  mapVqsPath,
  resolveUpstream
} from '../api/vqs/[...path].js';

assert.equal(mapVqsPath('projects'), '/quotations');
assert.equal(mapVqsPath('assets'), '/assets');
assert.equal(mapVqsPath('projects/project-1'), '/quotations/project-1');
assert.equal(mapVqsPath('projects/project-1/send-whatsapp'), '/quotations/project-1/send-whatsapp');
assert.equal(mapVqsPath('customers/search'), '/customers/directory-search');
assert.equal(mapVqsPath('context/search'), null);
assert.equal(mapVqsPath('public/quotations/project-1'), '/quotations/project-1');
assert.equal(mapVqsPath('projects/project-1/payments'), null);

const connect = resolveUpstream({
  CONNECT_BASE_URL: 'https://connect.elankav.com/',
  VQS_API_TOKEN: 'test-token'
});
assert.equal(connect.mode, 'connect');
assert.equal(connect.baseUrl, 'https://connect.elankav.com/api/v1/business/vqs');
assert.equal(connect.token, 'test-token');

const storeContext = mapCatalogItemToContextResult({
  id: 'product-1', name: 'Caja de luz', description: 'Producto de prueba', unit: 'unidad', salePrice: 125
});
assert.equal(storeContext.type, 'store');
assert.equal(storeContext.source.storeProductId, 'product-1');
assert.equal(storeContext.items[0].unitPrice, 125);

const legacy = resolveUpstream({ VQS_UPSTREAM: 'legacy' });
assert.equal(legacy.mode, 'legacy');
assert.equal(legacy.baseUrl, 'https://orchestrator.elankav.com');

const document = adaptQuotationDocument({
  contractVersion: '1.0.0',
  customer: { customerId: 'customer-1', name: 'Cliente de prueba' },
  executive: { executiveId: 'exec-1', name: 'Ejecutivo' },
  project: { title: 'Rótulo exterior' },
  items: [{ itemId: 'line-1', title: 'Letras 3D', quantity: 1, unitPriceUsd: 100, subtotalUsd: 100 }],
  pricing: { totalUsd: 100, exchangeRate: 36.8, payableTotalNio: 3680 },
  payments: { type: '60_40', installments: [{ label: 'Anticipo', percentage: 60 }, { label: 'Entrega', percentage: 40 }] }
});
assert.equal(document.customerSnapshot.customerId, 'customer-1');
assert.equal(document.executiveSnapshot.executiveId, 'exec-1');
assert.equal(document.items[0].id, 'line-1');
assert.equal(document.items[0].unitPrice, 100);
assert.equal(document.pricing.totalUsd, 100);
assert.equal(document.paymentTerms.installments.length, 2);

const vercelConfig = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'));
const vqsRewrite = vercelConfig.rewrites.find((rewrite) => rewrite.source === '/api/vqs/:path*');
const spaRewrite = vercelConfig.rewrites.find((rewrite) => rewrite.destination === '/index.html');
assert.equal(vqsRewrite?.destination, '/api/vqs?path=:path*', 'Las rutas VQS anidadas deben llegar a la función plana /api/vqs.');
assert.equal(spaRewrite?.source, '/((?!api/).*)', 'El fallback SPA debe excluir todas las rutas /api/.');

console.log('VQS CONNECT proxy check: OK');
