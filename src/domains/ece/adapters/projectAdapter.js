const NOT_IMPLEMENTED = 'Not implemented';

function notImplemented(operationName) {
  return () => {
    throw new Error(`${operationName}: ${NOT_IMPLEMENTED}`);
  };
}

export const ProjectAdapter = Object.freeze({
  fromProject: notImplemented('ProjectAdapter.fromProject'),
});

