import test from 'node:test';
import assert from 'node:assert/strict';

import { listCatalogItemsConnect } from '../src/modules/connect/services/catalogConnectClient.js';
import { uploadFileConnect } from '../src/modules/connect/services/fileConnectClient.js';
import { isConnectUnavailableError } from '../src/modules/connect/services/connectCoreClient.js';
import { subirArchivoAI } from '../src/services/aiArchivosService.js';

test('catalogo maestro consulta CONNECT con plataforma y limite', async () => {
  const previousFetch = globalThis.fetch;
  const previousWindow = globalThis.window;
  let requestedUrl = '';

  globalThis.window = { location: { hostname: 'localhost' } };
  globalThis.fetch = async (url, options) => {
    requestedUrl = String(url);
    assert.equal(options.headers['X-Elankav-Platform'], 'ELANVISUAL');
    return new Response(JSON.stringify({
      data: { items: [{ id: 'mat-1', nombre: 'Acrilico' }] }
    }), { status: 200, headers: { 'content-type': 'application/json' } });
  };

  try {
    const result = await listCatalogItemsConnect({ query: 'acrilico', limit: 25 });
    assert.equal(result.length, 1);
    assert.match(requestedUrl, /\/api\/v1\/catalog\/items/);
    assert.match(requestedUrl, /q=acrilico/);
    assert.match(requestedUrl, /limit=25/);
  } finally {
    globalThis.fetch = previousFetch;
    globalThis.window = previousWindow;
  }
});

test('storage CONNECT usa FormData sin fijar content-type manual', async () => {
  const previousFetch = globalThis.fetch;
  const previousWindow = globalThis.window;
  let headers = {};
  let isFormData = false;

  globalThis.window = { location: { hostname: 'localhost' } };
  globalThis.fetch = async (_url, options) => {
    headers = options.headers;
    isFormData = options.body instanceof FormData;
    return new Response(JSON.stringify({
      data: { id: 'file-1', bucket: 'ai-archivos', path: 'proyectos/p1/file.txt' }
    }), { status: 200, headers: { 'content-type': 'application/json' } });
  };

  try {
    const file = new File(['hola'], 'file.txt', { type: 'text/plain' });
    const result = await uploadFileConnect({ file, projectId: 'p1' });
    assert.equal(result.id, 'file-1');
    assert.equal(isFormData, true);
    assert.equal(Object.keys(headers).some((key) => key.toLowerCase() === 'content-type'), false);
  } finally {
    globalThis.fetch = previousFetch;
    globalThis.window = previousWindow;
  }
});

test('archivos AI caen a Supabase cuando CONNECT no responde', async () => {
  const previousFetch = globalThis.fetch;
  const previousWindow = globalThis.window;
  let uploadedPath = '';

  globalThis.window = { location: { hostname: 'localhost' } };
  globalThis.fetch = async () => {
    throw new TypeError('connect offline');
  };

  const fakeSupabase = {
    storage: {
      from(bucket) {
        assert.equal(bucket, 'ai-archivos');
        return {
          async upload(path) {
            uploadedPath = path;
            return { error: null };
          },
          getPublicUrl(path) {
            return { data: { publicUrl: `https://storage.test/${path}` } };
          }
        };
      }
    },
    from(table) {
      assert.equal(table, 'archivos_ai');
      return {
        insert(registro) {
          return {
            select() {
              return {
                async single() {
                  return { data: { id: 'row-1', ...registro }, error: null };
                }
              };
            }
          };
        }
      };
    }
  };

  try {
    const file = new File(['hola'], 'plano.pdf', { type: 'application/pdf' });
    const result = await subirArchivoAI({
      supabase: fakeSupabase,
      proyectoId: 'project-1',
      mensajeId: 'message-1',
      usuarioId: 'user-1',
      file,
    });

    assert.equal(result.id, 'row-1');
    assert.match(uploadedPath, /^proyectos\/project-1\/pdf\//);
  } finally {
    globalThis.fetch = previousFetch;
    globalThis.window = previousWindow;
  }
});

test('errores de red CONNECT se consideran fallback permitido', () => {
  assert.equal(isConnectUnavailableError(new TypeError('failed to fetch')), true);
});

