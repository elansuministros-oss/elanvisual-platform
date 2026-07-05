const STORAGE_KEY = 'elanvisual_v2_projects';

const fallbackProjects = [
  {
    id: 'project-demo-1',
    nombre: 'Fachada Farmacia Central',
    cliente: 'Farmacia Central',
    descripcion: 'Rotulo ACM luminoso para fachada principal.',
    estado: 'Activo',
    fechaCreacion: new Date().toISOString().slice(0, 10),
    productos: [],
  },
];

function readProjects() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallbackProjects;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : fallbackProjects;
  } catch {
    return fallbackProjects;
  }
}

function writeProjects(projects) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

function normalizeProject(project) {
  return {
    id: project.id || `project-${Date.now()}`,
    nombre: String(project.nombre || '').trim(),
    cliente: String(project.cliente || '').trim(),
    descripcion: String(project.descripcion || '').trim(),
    estado: project.estado || 'Activo',
    fechaCreacion: project.fechaCreacion || new Date().toISOString().slice(0, 10),
    productos: normalizeProjectProducts(project.productos),
  };
}

function normalizeProjectProducts(products) {
  return Array.isArray(products)
    ? products.map((product) => ({
        id: product.id || `project-product-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        productId: product.productId,
        configuracion: normalizeProductConfiguration(product.configuracion || product),
      }))
    : [];
}

function normalizeProductConfiguration(configuration = {}) {
  return {
    cantidad: Math.max(1, Number(configuration.cantidad || 1)),
    ancho: configuration.ancho === '' || configuration.ancho == null ? '' : Number(configuration.ancho),
    alto: configuration.alto === '' || configuration.alto == null ? '' : Number(configuration.alto),
    unidadMedida: configuration.unidadMedida || 'cm',
    observacionesComerciales: String(
      configuration.observacionesComerciales ?? configuration.observaciones ?? ''
    ).trim(),
  };
}

function updateProject(projectId, updater) {
  let updatedProject = null;
  const projects = readProjects().map((project) => {
    if (project.id !== projectId) return normalizeProject(project);
    updatedProject = normalizeProject(updater(normalizeProject(project)));
    return updatedProject;
  });

  writeProjects(projects);
  return updatedProject;
}

export const ProjectService = Object.freeze({
  list() {
    return readProjects();
  },

  create(project) {
    const nextProject = normalizeProject(project);
    const projects = [nextProject, ...readProjects()];
    writeProjects(projects);
    return nextProject;
  },

  update(projectId, project) {
    const current = readProjects().find((item) => item.id === projectId) || {};
    const nextProject = normalizeProject({ ...current, ...project, id: projectId });
    const projects = readProjects().map((item) => (item.id === projectId ? nextProject : item));
    writeProjects(projects);
    return nextProject;
  },

  remove(projectId) {
    const projects = readProjects().filter((item) => item.id !== projectId);
    writeProjects(projects);
  },

  addProduct(projectId, productReference) {
    return updateProject(projectId, (project) => ({
      ...project,
      productos: [
        {
          id: `project-product-${Date.now()}`,
          productId: productReference.productId,
          configuracion: normalizeProductConfiguration(productReference.configuracion),
        },
        ...project.productos,
      ],
    }));
  },

  updateProductConfiguration(projectId, projectProductId, configuration) {
    return updateProject(projectId, (project) => ({
      ...project,
      productos: project.productos.map((product) =>
        product.id === projectProductId
          ? {
              ...product,
              configuracion: normalizeProductConfiguration({
                ...product.configuracion,
                ...configuration,
              }),
            }
          : product
      ),
    }));
  },

  removeProduct(projectId, projectProductId) {
    return updateProject(projectId, (project) => ({
      ...project,
      productos: project.productos.filter((product) => product.id !== projectProductId),
    }));
  },
});
