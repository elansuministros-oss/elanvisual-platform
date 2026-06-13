export function getImage(src) {
  if (!src) {
    return '/placeholder.jpg';
  }

  return src;
}

export function isImage(fileName = '') {
  const ext = fileName.toLowerCase();

  return (
    ext.endsWith('.jpg') ||
    ext.endsWith('.jpeg') ||
    ext.endsWith('.png') ||
    ext.endsWith('.webp') ||
    ext.endsWith('.svg')
  );
}