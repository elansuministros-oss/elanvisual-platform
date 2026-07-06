const NOT_IMPLEMENTED = 'Not implemented';

function notImplemented(operationName) {
  return () => {
    throw new Error(`${operationName}: ${NOT_IMPLEMENTED}`);
  };
}

export const ProductAdapter = Object.freeze({
  fromProduct: notImplemented('ProductAdapter.fromProduct'),
});

