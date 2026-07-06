import { AI23Connector } from '../../ai';
import { CatalogCore } from '../../catalog';
import { CheckoutService } from '../../checkout';
import { PDFService } from '../../pdf';
import { CommercialEngine } from '../engines';
import { QuoteRepository } from './quoteRepository';

function assertRequired(value, message) {
  if (!value) throw new Error(message);
}

export const CommercialEngineService = Object.freeze({
  async createQuote(project, product, configuration) {
    assertRequired(project, 'Project is required');
    assertRequired(product, 'Product is required');
    assertRequired(configuration, 'Configuration is required');

    const quote = await CommercialEngine.buildQuote(project, product, configuration, {
      resolveCatalogReferences: CatalogCore.resolverProducto,
      validateQuoteLineWithAI23: AI23Connector.validateQuoteLine,
    });
    return QuoteRepository.save(quote);
  },

  getQuote(id) {
    assertRequired(id, 'Quote id is required');
    return QuoteRepository.findById(id);
  },

  listQuotes() {
    return QuoteRepository.list();
  },

  deleteQuote(id) {
    assertRequired(id, 'Quote id is required');
    QuoteRepository.remove(id);
  },

  generatePdf(id) {
    assertRequired(id, 'Quote id is required');
    const quote = QuoteRepository.findById(id);
    assertRequired(quote, 'Quote not found');
    return PDFService.openEceQuotePdf(quote);
  },

  startCheckout(id, paymentMethod = CheckoutService.paymentMethods.BANK_TRANSFER) {
    assertRequired(id, 'Quote id is required');
    const quote = QuoteRepository.findById(id);
    assertRequired(quote, 'Quote not found');
    return CheckoutService.createPendingAttemptFromEceQuote(quote, paymentMethod);
  },
});
