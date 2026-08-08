const SOURCE_KEY = '__ELANVISUAL_VQS_SEARCH_SOURCE__';

const OPTIONS = [
  { value: 'customers', label: 'Clientes de CONNECT', placeholder: 'Nombre, empresa, teléfono o correo' },
  { value: 'designer', label: 'Solicitudes del Diseñador', placeholder: 'Nombre, teléfono o código DESIGN-...' }
];

function findSearchCard() {
  return Array.from(document.querySelectorAll('.uq-card')).find((card) => {
    const heading = card.querySelector('h2');
    return heading?.textContent?.trim() === 'Cargar desde el ecosistema' || heading?.textContent?.trim() === 'Buscar información';
  });
}

function enhance() {
  const card = findSearchCard();
  if (!card || card.dataset.searchSourceEnhanced === 'true') return;

  const heading = card.querySelector('h2');
  const description = card.querySelector('p');
  const input = card.querySelector('input');
  const button = Array.from(card.querySelectorAll('button')).find((entry) => entry.textContent?.includes('Buscar'));
  const fields = card.querySelector('.uq-fields');
  if (!heading || !description || !input || !button || !fields) return;

  card.dataset.searchSourceEnhanced = 'true';
  heading.textContent = 'Buscar información';
  description.textContent = 'Seleccioná el origen y buscá la información que querés cargar en la cotización.';
  button.textContent = 'Buscar';

  const sourceLabel = document.createElement('label');
  sourceLabel.textContent = 'Buscar en';
  const select = document.createElement('select');
  select.setAttribute('aria-label', 'Origen de búsqueda');
  for (const option of OPTIONS) {
    const element = document.createElement('option');
    element.value = option.value;
    element.textContent = option.label;
    select.appendChild(element);
  }
  sourceLabel.appendChild(select);
  fields.insertBefore(sourceLabel, fields.firstChild);

  const applySource = () => {
    const selected = OPTIONS.find((option) => option.value === select.value) || OPTIONS[0];
    window[SOURCE_KEY] = selected.value;
    input.placeholder = selected.placeholder;
  };

  select.addEventListener('change', applySource);
  applySource();
}

export function installVqsSearchSourceEnhancer() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  window[SOURCE_KEY] = window[SOURCE_KEY] || 'customers';
  const observer = new MutationObserver(enhance);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener('DOMContentLoaded', enhance, { once: true });
  window.setTimeout(enhance, 0);
}
