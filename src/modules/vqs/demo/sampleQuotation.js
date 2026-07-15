import { createQuotationDocument } from '../contracts/quotationDocument';
import { elanvisualBrand, getActivePaymentAccounts } from '../config/elanvisualBrand';

export const sampleQuotation = createQuotationDocument({
  platformId: 'ELANVISUAL',
  quotationNumber: 'COT-EV-2026-0001',
  status: 'proposal',
  currency: 'USD',
  issuedAt: '2026-07-15',
  validUntil: '2026-07-30',
  customer: {
    name: 'Cliente de muestra',
    companyName: 'Proyecto Comercial',
    phone: '+505 0000 0000',
    email: 'cliente@ejemplo.com',
    address: 'Managua, Nicaragua'
  },
  advisor: {
    name: 'Equipo ELANVISUAL',
    phone: '+505 7882 8089'
  },
  project: {
    title: 'Renovación de imagen comercial',
    summary: 'Propuesta visual para fabricación e instalación de elementos de rotulación.',
    category: 'Rotulación e imagen comercial',
    location: 'Managua',
    estimatedDelivery: '12 días hábiles',
    warranty: '12 meses'
  },
  items: [
    {
      id: 'item-001',
      title: 'Rótulo luminoso para fachada',
      commercialDescription: 'Caja de luz fabricada a medida con frente acrílico e iluminación LED para uso exterior.',
      quantity: 1,
      unit: 'unidad',
      unitPrice: 350,
      subtotal: 350,
      dimensions: { width: 1.1, height: 0.65, unit: 'm' },
      features: ['Uso exterior', 'Iluminación LED', 'Fabricación personalizada'],
      images: []
    },
    {
      id: 'item-002',
      title: 'Letras 3D en PVC',
      commercialDescription: 'Letras corpóreas con acabado profesional, listas para instalación.',
      quantity: 1,
      unit: 'juego',
      unitPrice: 190,
      subtotal: 190,
      features: ['PVC', 'Acabado premium', 'Instalación incluida'],
      images: []
    }
  ],
  totals: {
    subtotalGross: 540,
    discount: 0,
    subtotal: 540,
    taxRate: 15,
    tax: 0,
    total: 540,
    currency: 'USD',
    exchangeRate: 36.8,
    convertedTotal: 19872
  },
  paymentTerms: {
    type: '60_40',
    installments: [
      { label: 'Anticipo', percentage: 60, amount: 324 },
      { label: 'Contra entrega', percentage: 40, amount: 216 }
    ]
  },
  paymentAccountsSnapshot: getActivePaymentAccounts(elanvisualBrand),
  publicNotes: [
    'La propuesta tiene una vigencia de 15 días.',
    'Los tiempos de entrega comienzan después de aprobar diseño y anticipo.'
  ],
  digitalLinks: {
    platformUrl: elanvisualBrand.website,
    ecosystemUrl: elanvisualBrand.ecosystemUrl
  }
});
