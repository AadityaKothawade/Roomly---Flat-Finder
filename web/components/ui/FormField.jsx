export function FormField({ label, hint, children }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-ink/80 mb-1.5">{label}</span>
      {children}
      {hint && <span className="block text-xs text-ink/45 mt-1.5">{hint}</span>}
    </label>
  );
}
