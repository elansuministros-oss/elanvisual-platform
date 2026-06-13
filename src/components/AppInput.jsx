export default function AppInput({ label, ...props }) {
  return (
    <label className="app-field">
      {label && <span>{label}</span>}
      <input {...props} />
    </label>
  );
}