import { RegisteredProductService } from '../../product';
import { ProjectService } from '../../project';
import { CatalogCore } from '../../catalog';
import { AI23Connector } from '../../ai';
import { QuoteEngine } from '../engines/quoteEngine';
import { QuoteRepository } from './quoteRepository';

function resolveProduct(productId) {
  return RegisteredProductService.getById(productId) || {
    id: productId,
    nombre: 'Producto registrado',
    categoria: '',
  };
}

export const QuoteService = Object.freeze({
  list() {
    return QuoteRepository.list();
  },

  listProjects() {
    return ProjectService.list();
  },

  async generateFromProject(projectId) {
    const project = ProjectService.list().find((item) => item.id === projectId);
    if (!project) throw new Error('Project not found');

    const quote = await QuoteEngine.transformProject(project, {
      resolveProduct,
      resolveCatalogReferences: CatalogCore.resolverProducto,
      validateQuoteLineWithAI23: AI23Connector.validateQuoteLine,
    });
    return QuoteRepository.save(quote);
  },

  getByProject(projectId) {
    return QuoteRepository.getByProject(projectId);
  },

  remove(quoteId) {
    QuoteRepository.remove(quoteId);
  },
});
