import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../src/modules/quotation-viewer/components/CustomerPaymentsPanel.jsx', import.meta.url), 'utf8');

test('el historial de recibos ofrece envío al cliente por WhatsApp', () => {
  assert.match(source, /Enviar al cliente/);
  assert.match(source, /whatsapp:\/\/send\?phone=/);
  assert.match(source, /api\.whatsapp\.com\/send\?phone=/);
  assert.match(source, /officialReceiptNumber\(payment\)/);
});

test('el envío valida un teléfono registrado', () => {
  assert.match(source, /no tiene un número de WhatsApp válido registrado/i);
  assert.match(source, /customer_snapshot\?\.phone/);
  assert.match(source, /quotation\.customer\?\.phone/);
});
