const text = (value) => String(value ?? '').trim();

export function applyQuotationListAliases(record = {}) {
  if (!record || typeof record !== 'object' || Array.isArray(record)) return record;

  const customerName = text(record.customerName || record.customer_name);
  const customerCompanyName = text(record.customerCompanyName || record.customer_company_name);
  const customerPhone = text(record.customerPhone || record.customer_phone);
  const executiveName = text(record.executiveName || record.executive_name);

  return {
    ...record,
    customer: {
      ...(record.customer && typeof record.customer === 'object' ? record.customer : {}),
      ...(customerName ? { name: customerName } : {}),
      ...(customerCompanyName ? { companyName: customerCompanyName } : {}),
      ...(customerPhone ? { phone: customerPhone } : {})
    },
    executive: {
      ...(record.executive && typeof record.executive === 'object' ? record.executive : {}),
      ...(executiveName ? { name: executiveName } : {})
    }
  };
}

export function applyQuotationListAliasesToPayload(payload = {}) {
  const candidates = ['data', 'projects', 'items', 'results', 'records', 'quotations'];

  if (Array.isArray(payload)) return payload.map(applyQuotationListAliases);

  const output = { ...payload };
  for (const key of candidates) {
    if (Array.isArray(output[key])) output[key] = output[key].map(applyQuotationListAliases);
  }

  if (output.data && typeof output.data === 'object' && !Array.isArray(output.data)) {
    output.data = { ...output.data };
    for (const key of candidates.slice(1)) {
      if (Array.isArray(output.data[key])) output.data[key] = output.data[key].map(applyQuotationListAliases);
    }
  }

  return output;
}
