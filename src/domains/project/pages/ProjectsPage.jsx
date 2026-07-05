import React, { useMemo, useState } from 'react';
import { CalendarDays, Edit3, FolderKanban, PackagePlus, Plus, Search, SlidersHorizontal, Trash2, X } from 'lucide-react';
import { RegisteredProductService } from '../../product';
import { ProjectService } from '../services/projectService';
import './ProjectsPage.css';

const initialForm = {
  nombre: '',
  cliente: '',
  descripcion: '',
  estado: 'Activo',
  fechaCreacion: new Date().toISOString().slice(0, 10),
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState(() => ProjectService.list());
  const [registeredProducts] = useState(() => RegisteredProductService.list());
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');
  const [productForms, setProductForms] = useState({});
  const [configuringProduct, setConfiguringProduct] = useState(null);
  const [configurationForms, setConfigurationForms] = useState({});

  const filteredProjects = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return projects;
    return projects.filter((project) => project.nombre.toLowerCase().includes(query));
  }, [projects, search]);

  const handleChange = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!form.nombre.trim() || !form.cliente.trim()) return;

    if (editingId) {
      const updated = ProjectService.update(editingId, form);
      setProjects((current) => current.map((project) => (project.id === editingId ? updated : project)));
    } else {
      const created = ProjectService.create(form);
      setProjects((current) => [created, ...current]);
    }

    resetForm();
  };

  const startEdit = (project) => {
    setEditingId(project.id);
    setForm({
      nombre: project.nombre,
      cliente: project.cliente,
      descripcion: project.descripcion,
      estado: project.estado,
      fechaCreacion: project.fechaCreacion,
    });
  };

  const removeProject = (projectId) => {
    ProjectService.remove(projectId);
    setProjects((current) => current.filter((project) => project.id !== projectId));
    if (editingId === projectId) resetForm();
  };

  const getProductForm = (projectId) =>
    productForms[projectId] || {
      productId: registeredProducts[0]?.id || '',
    };

  const updateProductForm = (projectId, field, value) => {
    setProductForms((current) => ({
      ...current,
      [projectId]: {
        ...getProductForm(projectId),
        [field]: value,
      },
    }));
  };

  const resetProductForm = (projectId) => {
    setProductForms((current) => ({
      ...current,
      [projectId]: {
        productId: registeredProducts[0]?.id || '',
      },
    }));
  };

  const syncProject = (updatedProject) => {
    if (!updatedProject) return;
    setProjects((current) => current.map((project) => (project.id === updatedProject.id ? updatedProject : project)));
  };

  const saveProjectProduct = (projectId) => {
    const productForm = getProductForm(projectId);
    if (!productForm.productId) return;

    syncProject(ProjectService.addProduct(projectId, productForm));
    resetProductForm(projectId);
  };

  const getConfigurationForm = (productReference) =>
    configurationForms[productReference.id] || {
      cantidad: productReference.configuracion?.cantidad || 1,
      ancho: productReference.configuracion?.ancho ?? '',
      alto: productReference.configuracion?.alto ?? '',
      unidadMedida: productReference.configuracion?.unidadMedida || 'cm',
      observacionesComerciales: productReference.configuracion?.observacionesComerciales || '',
    };

  const updateConfigurationForm = (productReference, field, value) => {
    setConfigurationForms((current) => ({
      ...current,
      [productReference.id]: {
        ...getConfigurationForm(productReference),
        [field]: value,
      },
    }));
  };

  const openProductConfiguration = (projectId, productReference) => {
    setConfiguringProduct({ projectId, productReferenceId: productReference.id });
    setConfigurationForms((current) => ({
      ...current,
      [productReference.id]: getConfigurationForm(productReference),
    }));
  };

  const closeProductConfiguration = () => {
    setConfiguringProduct(null);
  };

  const saveProductConfiguration = (projectId, productReference) => {
    const updatedProject = ProjectService.updateProductConfiguration(
      projectId,
      productReference.id,
      getConfigurationForm(productReference)
    );
    syncProject(updatedProject);
    closeProductConfiguration();
  };

  const removeProjectProduct = (projectId, projectProductId) => {
    syncProject(ProjectService.removeProduct(projectId, projectProductId));
    if (configuringProduct?.productReferenceId === projectProductId) closeProductConfiguration();
  };

  const getRegisteredProduct = (productId) => RegisteredProductService.getById(productId);

  return (
    <main className="project-page">
      <section className="project-header">
        <div>
          <span>PROJECT V2</span>
          <h1>Proyectos</h1>
        </div>
        <div className="project-counter">
          <FolderKanban size={22} />
          <strong>{projects.length}</strong>
        </div>
      </section>

      <section className="project-layout">
        <form className="project-form" onSubmit={handleSubmit}>
          <div className="project-form-title">
            <h2>{editingId ? 'Editar proyecto' : 'Crear proyecto'}</h2>
            {editingId && (
              <button type="button" className="project-icon-button" onClick={resetForm} aria-label="Cancelar edicion">
                <X size={18} />
              </button>
            )}
          </div>

          <label>
            Nombre del proyecto
            <input value={form.nombre} onChange={(event) => handleChange('nombre', event.target.value)} required />
          </label>

          <label>
            Cliente
            <input value={form.cliente} onChange={(event) => handleChange('cliente', event.target.value)} required />
          </label>

          <label>
            Descripcion
            <textarea value={form.descripcion} onChange={(event) => handleChange('descripcion', event.target.value)} />
          </label>

          <div className="project-form-row">
            <label>
              Estado
              <select value={form.estado} onChange={(event) => handleChange('estado', event.target.value)}>
                <option>Activo</option>
                <option>Pausado</option>
                <option>Completado</option>
                <option>Cancelado</option>
              </select>
            </label>

            <label>
              Fecha de creacion
              <input
                type="date"
                value={form.fechaCreacion}
                onChange={(event) => handleChange('fechaCreacion', event.target.value)}
              />
            </label>
          </div>

          <button type="submit" className="project-submit">
            <Plus size={18} />
            {editingId ? 'Guardar cambios' : 'Crear proyecto'}
          </button>
        </form>

        <section className="project-list-panel">
          <div className="project-search">
            <Search size={18} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar proyecto por nombre"
            />
          </div>

          <div className="project-list">
            {filteredProjects.map((project) => (
              <article className="project-item" key={project.id}>
                <div className="project-item-main">
                  <div>
                    <h3>{project.nombre}</h3>
                    <p>{project.cliente}</p>
                  </div>
                  <span className={`project-status status-${project.estado.toLowerCase()}`}>{project.estado}</span>
                </div>

                {project.descripcion && <p className="project-description">{project.descripcion}</p>}

                <div className="project-meta">
                  <span>
                    <CalendarDays size={16} />
                    {project.fechaCreacion}
                  </span>
                  <div className="project-actions">
                    <button type="button" className="project-secondary" onClick={() => startEdit(project)}>
                      <Edit3 size={16} />
                      Editar
                    </button>
                    <button type="button" className="project-danger" onClick={() => removeProject(project.id)}>
                      <Trash2 size={16} />
                      Eliminar
                    </button>
                  </div>
                </div>

                <section className="project-products">
                  <div className="project-products-head">
                    <h4>Productos del Proyecto</h4>
                    <span>{project.productos?.length || 0}</span>
                  </div>

                  <div className="project-product-form">
                    <select
                      value={getProductForm(project.id).productId}
                      onChange={(event) => updateProductForm(project.id, 'productId', event.target.value)}
                    >
                      {registeredProducts.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.nombre}
                        </option>
                      ))}
                    </select>
                    <button type="button" className="project-secondary" onClick={() => saveProjectProduct(project.id)}>
                      <PackagePlus size={16} />
                      Agregar
                    </button>
                  </div>

                  <div className="project-product-list">
                    {(project.productos || []).map((productReference) => {
                      const product = getRegisteredProduct(productReference.productId);
                      const configuration = productReference.configuracion || {};
                      const isConfiguring =
                        configuringProduct?.projectId === project.id &&
                        configuringProduct?.productReferenceId === productReference.id;
                      return (
                        <article className="project-product-item" key={productReference.id}>
                          <div className="project-product-summary">
                            <div>
                              <strong>{product?.nombre || 'Producto registrado'}</strong>
                              <small>{product?.categoria || productReference.productId}</small>
                            </div>
                            <span>Cant. {configuration.cantidad || 1}</span>
                            <span>
                              {configuration.ancho || '-'} x {configuration.alto || '-'} {configuration.unidadMedida || 'cm'}
                            </span>
                            <p>{configuration.observacionesComerciales || 'Sin observaciones comerciales'}</p>
                            <div className="project-product-actions">
                              <button
                                type="button"
                                className="project-secondary"
                                onClick={() => openProductConfiguration(project.id, productReference)}
                              >
                                <SlidersHorizontal size={15} />
                                Configurar
                              </button>
                              <button
                                type="button"
                                className="project-danger"
                                onClick={() => removeProjectProduct(project.id, productReference.id)}
                              >
                                <Trash2 size={15} />
                                Eliminar
                              </button>
                            </div>
                          </div>

                          {isConfiguring && (
                            <div className="project-configuration-panel">
                              <div className="project-configuration-head">
                                <h5>Configuración del Producto</h5>
                                <button type="button" className="project-icon-button" onClick={closeProductConfiguration}>
                                  <X size={16} />
                                </button>
                              </div>

                              <div className="project-configuration-grid">
                                <label>
                                  Cantidad
                                  <input
                                    type="number"
                                    min="1"
                                    value={getConfigurationForm(productReference).cantidad}
                                    onChange={(event) =>
                                      updateConfigurationForm(productReference, 'cantidad', event.target.value)
                                    }
                                  />
                                </label>

                                <label>
                                  Ancho
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={getConfigurationForm(productReference).ancho}
                                    onChange={(event) =>
                                      updateConfigurationForm(productReference, 'ancho', event.target.value)
                                    }
                                  />
                                </label>

                                <label>
                                  Alto
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={getConfigurationForm(productReference).alto}
                                    onChange={(event) =>
                                      updateConfigurationForm(productReference, 'alto', event.target.value)
                                    }
                                  />
                                </label>

                                <label>
                                  Unidad de medida
                                  <select
                                    value={getConfigurationForm(productReference).unidadMedida}
                                    onChange={(event) =>
                                      updateConfigurationForm(productReference, 'unidadMedida', event.target.value)
                                    }
                                  >
                                    <option value="cm">cm</option>
                                    <option value="m">m</option>
                                    <option value="mm">mm</option>
                                    <option value="unidad">unidad</option>
                                  </select>
                                </label>

                                <label className="project-configuration-wide">
                                  Observaciones comerciales
                                  <textarea
                                    value={getConfigurationForm(productReference).observacionesComerciales}
                                    onChange={(event) =>
                                      updateConfigurationForm(
                                        productReference,
                                        'observacionesComerciales',
                                        event.target.value
                                      )
                                    }
                                  />
                                </label>
                              </div>

                              <div className="project-configuration-actions">
                                <button
                                  type="button"
                                  className="project-secondary"
                                  onClick={() => saveProductConfiguration(project.id, productReference)}
                                >
                                  Guardar configuración
                                </button>
                                <button type="button" className="project-danger" onClick={closeProductConfiguration}>
                                  Cerrar
                                </button>
                              </div>
                            </div>
                          )}
                        </article>
                      );
                    })}
                  </div>
                </section>
              </article>
            ))}

            {!filteredProjects.length && (
              <div className="project-empty">
                <FolderKanban size={34} />
                <p>No hay proyectos con ese nombre.</p>
              </div>
            )}
          </div>
        </section>
      </section>
    </main>
  );
}
