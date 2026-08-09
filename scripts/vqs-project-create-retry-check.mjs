import assert from 'node:assert/strict';
import { runWithSingleServerRetry } from '../src/modules/vqs/services/vqsRequestRetry.js';

let attempts = 0;
const response = await runWithSingleServerRetry(async () => {
  attempts += 1;
  if (attempts === 1) throw Object.assign(new Error('Fallo transitorio.'), { status: 500 });
  return { data: { projectId: 'project-1' } };
});

assert.equal(response.data.projectId, 'project-1');
assert.equal(attempts, 2);

await assert.rejects(
  runWithSingleServerRetry(async () => {
    throw Object.assign(new Error('Contrato inválido.'), { status: 400 });
  }),
  /Contrato inválido/
);

console.log('VQS project create retry check passed.');
