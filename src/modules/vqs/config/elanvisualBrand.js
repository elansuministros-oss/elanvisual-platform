export const elanvisualBrand = {
  platformId: 'ELANVISUAL',
  displayName: 'ELANVISUAL',
  logoUrl: '/logo.png',
  primaryColor: '#111827',
  secondaryColor: '#C9A227',
  website: 'https://visual.elankav.com',
  ecosystemUrl: 'https://www.elankav.com/',
  whatsapp: '+505 7882 8089',
  email: '',
  taxId: '4012805831001E',
  active: true,
  paymentAccounts: [
    {
      id: 'bac-nio-01',
      bankId: 'BAC',
      bankName: 'BAC Credomatic',
      currency: 'NIO',
      accountNumber: '372105585',
      active: true,
      displayOrder: 1
    },
    {
      id: 'lafise-nio-01',
      bankId: 'LAFISE',
      bankName: 'Banco LAFISE',
      currency: 'NIO',
      accountNumber: '130093768',
      active: true,
      displayOrder: 2
    },
    {
      id: 'lafise-usd-01',
      bankId: 'LAFISE',
      bankName: 'Banco LAFISE',
      currency: 'USD',
      accountNumber: '119234795',
      active: true,
      displayOrder: 3
    },
    {
      id: 'banpro-usd-01',
      bankId: 'BANPRO',
      bankName: 'Banpro',
      currency: 'USD',
      accountNumber: '10020710081659',
      active: true,
      displayOrder: 4
    }
  ]
};

export function getActivePaymentAccounts(brand = elanvisualBrand) {
  return [...(brand.paymentAccounts || [])]
    .filter((account) => account.active)
    .sort((a, b) => Number(a.displayOrder || 0) - Number(b.displayOrder || 0));
}
