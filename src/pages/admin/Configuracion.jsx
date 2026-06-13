import { useState } from 'react';
import { useElan } from '../../core/context/ElanContext.jsx';

import AppCard from '../../components/AppCard.jsx';
import AppButton from '../../components/AppButton.jsx';
import AppInput from '../../components/AppInput.jsx';

const HOME_DEFAULT = {
  titulo: 'Rotulación profesional para negocios reales',
  subtitulo: 'Diseño, fabricación e instalación con criterio técnico.',
  textoInstitucional:
    'Fabricamos soluciones visuales funcionales para negocios que necesitan presencia, claridad y ejecución real.',
  botonPrincipalTexto: 'Ver catálogo',
  botonPrincipalUrl: '/catalogo',
  botonSecundarioTexto: 'Solicitar cotización',
  botonSecundarioUrl: '/contacto',
  servicio1Titulo: 'Rotulación comercial',
  servicio1Texto: 'Fachadas, letras 3D, cajillos, PVC, acrílico y estructuras.',
  servicio2Titulo: 'Catálogo visual',
  servicio2Texto: 'Productos organizados con imágenes, categorías y vista ampliada.',
  servicio3Titulo: 'Showroom',
  servicio3Texto: 'Galería pública de trabajos, acabados e instalaciones.',
  stat1Valor: '100%',
  stat1Texto: 'Fabricación real',
  stat2Valor: '1:1',
  stat2Texto: 'Escala técnica',
  stat3Valor: 'V2',
  stat3Texto: 'Sistema operativo',
};

export default function Configuracion() {
  const { state, updateModule } = useElan();

  const actual = {
    ...HOME_DEFAULT,
    ...(state.configuracion?.home || {}),
  };

  const [form, setForm] = useState(actual);

  const cambiarCampo = (campo, valor) => {
    setForm((prev) => ({
      ...prev,
      [campo]: valor,
    }));
  };

  const guardar = () => {
    updateModule('configuracion', {
      ...(state.configuracion || {}),
      home: form,
    });

    alert('Configuración del Home guardada.');
  };

  const restaurar = () => {
    setForm(HOME_DEFAULT);
  };

  return (
    <main className="page-shell">
      <div className="page-title">
        <p className="eyebrow">Administrador</p>
        <h1>Configuración</h1>
        <p className="muted">
          Control del contenido principal del Home público.
        </p>
      </div>

      <AppCard>
        <div className="form-grid">
          <AppInput
            label="Título principal"
            value={form.titulo}
            onChange={(e) => cambiarCampo('titulo', e.target.value)}
          />

          <AppInput
            label="Subtítulo principal"
            value={form.subtitulo}
            onChange={(e) => cambiarCampo('subtitulo', e.target.value)}
          />

          <label className="app-field">
            <span>Texto institucional</span>
            <textarea
              value={form.textoInstitucional}
              onChange={(e) =>
                cambiarCampo('textoInstitucional', e.target.value)
              }
            />
          </label>

          <AppInput
            label="Botón principal - Texto"
            value={form.botonPrincipalTexto}
            onChange={(e) =>
              cambiarCampo('botonPrincipalTexto', e.target.value)
            }
          />

          <AppInput
            label="Botón principal - URL"
            value={form.botonPrincipalUrl}
            onChange={(e) =>
              cambiarCampo('botonPrincipalUrl', e.target.value)
            }
          />

          <AppInput
            label="Botón secundario - Texto"
            value={form.botonSecundarioTexto}
            onChange={(e) =>
              cambiarCampo('botonSecundarioTexto', e.target.value)
            }
          />

          <AppInput
            label="Botón secundario - URL"
            value={form.botonSecundarioUrl}
            onChange={(e) =>
              cambiarCampo('botonSecundarioUrl', e.target.value)
            }
          />
        </div>
      </AppCard>

      <AppCard>
        <div className="form-grid">
          <AppInput
            label="Servicio 1 - Título"
            value={form.servicio1Titulo}
            onChange={(e) => cambiarCampo('servicio1Titulo', e.target.value)}
          />

          <AppInput
            label="Servicio 1 - Texto"
            value={form.servicio1Texto}
            onChange={(e) => cambiarCampo('servicio1Texto', e.target.value)}
          />

          <AppInput
            label="Servicio 2 - Título"
            value={form.servicio2Titulo}
            onChange={(e) => cambiarCampo('servicio2Titulo', e.target.value)}
          />

          <AppInput
            label="Servicio 2 - Texto"
            value={form.servicio2Texto}
            onChange={(e) => cambiarCampo('servicio2Texto', e.target.value)}
          />

          <AppInput
            label="Servicio 3 - Título"
            value={form.servicio3Titulo}
            onChange={(e) => cambiarCampo('servicio3Titulo', e.target.value)}
          />

          <AppInput
            label="Servicio 3 - Texto"
            value={form.servicio3Texto}
            onChange={(e) => cambiarCampo('servicio3Texto', e.target.value)}
          />
        </div>
      </AppCard>

      <AppCard>
        <div className="form-grid">
          <AppInput
            label="Estadística 1 - Valor"
            value={form.stat1Valor}
            onChange={(e) => cambiarCampo('stat1Valor', e.target.value)}
          />

          <AppInput
            label="Estadística 1 - Texto"
            value={form.stat1Texto}
            onChange={(e) => cambiarCampo('stat1Texto', e.target.value)}
          />

          <AppInput
            label="Estadística 2 - Valor"
            value={form.stat2Valor}
            onChange={(e) => cambiarCampo('stat2Valor', e.target.value)}
          />

          <AppInput
            label="Estadística 2 - Texto"
            value={form.stat2Texto}
            onChange={(e) => cambiarCampo('stat2Texto', e.target.value)}
          />

          <AppInput
            label="Estadística 3 - Valor"
            value={form.stat3Valor}
            onChange={(e) => cambiarCampo('stat3Valor', e.target.value)}
          />

          <AppInput
            label="Estadística 3 - Texto"
            value={form.stat3Texto}
            onChange={(e) => cambiarCampo('stat3Texto', e.target.value)}
          />

          <div className="form-actions">
            <AppButton onClick={guardar}>Guardar configuración</AppButton>
            <AppButton variant="secondary" onClick={restaurar}>
              Restaurar base
            </AppButton>
          </div>
        </div>
      </AppCard>
    </main>
  );
}