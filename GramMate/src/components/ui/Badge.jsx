export default function Badge({ children, variant = 'default', className = '' }) {
  const colors = {
    default: 'bg-slate-100 text-slate-700',
    success: 'bg-emerald-100 text-emerald-800',
    warning: 'bg-amber-100 text-amber-800',
    danger: 'bg-rose-100 text-rose-800',
    info: 'bg-sky-100 text-sky-800',
  };
  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${colors[variant]} ${className}`}>{children}</span>;
}
