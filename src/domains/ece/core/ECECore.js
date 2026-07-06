import { CommercialEngineService } from '../services';

export const ECECore = Object.freeze({
  async createQuote(project, product, configuration) {
    return CommercialEngineService.createQuote(project, product, configuration);
  },

  getQuote(id) {
    return CommercialEngineService.getQuote(id);
  },

  listQuotes() {
    return CommercialEngineService.listQuotes();
  },

  deleteQuote(id) {
    return CommercialEngineService.deleteQuote(id);
  },

  generatePdf(id) {
    return CommercialEngineService.generatePdf(id);
  },

  startCheckout(id, paymentMethod) {
    return CommercialEngineService.startCheckout(id, paymentMethod);
  },
});
