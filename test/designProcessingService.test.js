import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildDesignPrompt,
  extractGeneratedImage
} from '../api/services/design/designProcessingService.js';

test('buildDesignPrompt conserva medidas, etapa e indicaciones', () => {
  const prompt = buildDesignPrompt({
    request_type: 'rotulo',
    installation_environment: 'exterior',
    width_cm: 450,
    height_cm: 142,
    workflow_stage: 'render',
    revision_number: 2,
    design_notes: 'Mantener exactamente el logo aprobado.'
  });

  assert.match(prompt, /450 cm de ancho por 142 cm de alto/);
  assert.match(prompt, /Etapa del flujo: render/);
  assert.match(prompt, /Mantener exactamente el logo aprobado/);
  assert.match(prompt, /técnicamente fabricable/);
});

test('extractGeneratedImage obtiene el PNG base64 del image_generation_call', () => {
  const expected = Buffer.from('imagen-prueba');
  const bytes = extractGeneratedImage({
    output: [{ type: 'image_generation_call', result: expected.toString('base64') }]
  });
  assert.deepEqual(bytes, expected);
});

test('extractGeneratedImage falla cuando OpenAI no devuelve imagen', () => {
  assert.throws(
    () => extractGeneratedImage({ output: [{ type: 'message' }] }),
    error => error?.code === 'DESIGN_IMAGE_RESULT_MISSING'
  );
});
