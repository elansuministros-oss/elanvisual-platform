export default function ImageViewer({ image, open, onClose }) {
  if (!open || !image) return null;

  return (
    <div className="image-viewer-fullscreen" role="dialog" aria-modal="true">
      <button
        type="button"
        className="image-viewer-backdrop"
        aria-label="Cerrar vista de imagen"
        onClick={onClose}
      />

      <div className="image-viewer-panel">
        <button
          type="button"
          className="image-viewer-close"
          onClick={onClose}
          aria-label="Cerrar"
        >
          ×
        </button>

        <img src={image} alt="Vista ampliada" />
      </div>
    </div>
  );
}