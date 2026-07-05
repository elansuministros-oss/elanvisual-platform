export function createCatalogNotImplemented(featureName) {
  return () => {
    throw new Error(`Catalog V2 ${featureName} is not implemented yet.`);
  };
}
