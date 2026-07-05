export function createProductNotImplemented(featureName) {
  return () => {
    throw new Error(`${featureName}: Not implemented`);
  };
}
