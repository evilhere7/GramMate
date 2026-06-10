export default function Input({ label, error, className = '', ...props }) {
  return (
    <label className={`block text-sm font-medium text-slate-700 ${className}`}>
      <span className="mb-2 block">{label}</span>
      <input
        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200 disabled:cursor-not-allowed disabled:bg-slate-50"
        {...props}
      />
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </label>
  );
}
