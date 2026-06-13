export default function AppButton({ children, variant = 'primary', ...props }) {
  return (
    <button className={`app-btn app-btn-${variant}`} type="button" {...props}>
      {children}
    </button>
  );
}