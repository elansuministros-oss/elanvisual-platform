import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(
  new URL('../src/modules/connect/services/commercialConnectClient.js', import.meta.url),
  'utf8'
);

test('ELANVISUAL usa CONNECT productivo como fallback', () => {
  assert.match(source, /https:\/\/elankav-connect\.vercel\.app/);
  assert.match(source, /return DEFAULT_CONNECT_URL/);
});

test('la sincronización crea Lead, Opportunity y Quote', () => {
  assert.match(source, /request\('\/api\/v1\/leads'/);
  assert.match(source, /request\('\/api\/v1\/opportunities'/);
  assert.match(source, /\/api\/v1\/opportunities\/\$\{encodeURIComponent\(opportunity\.id\)\}\/quotes/);
  assert.match(source, /return \{ lead, opportunity, quote \}/);
});

test('la Quote conserva montos y linaje de la cotización', () => {
  assert.match(source, /subtotal: amounts\.subtotal/);
  assert.match(source, /discountAmount: amounts\.discountAmount/);
  assert.match(source, /taxAmount: amounts\.taxAmount/);
  assert.match(source, /Cotización:/);
  assert.match(source, /Project Core:/);
});
