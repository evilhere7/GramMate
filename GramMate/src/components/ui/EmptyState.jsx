import { PackageOpen } from 'lucide-react';
import Button from './Button';

export default function EmptyState({
  icon: Icon = PackageOpen,
  title = 'Nothing here yet',
  description = '',
  action,
  actionLabel = 'Get started',
  className = '',
}) {
  return (
    <div className={`flex flex-col items-center justify-center py-16 px-6 text-center animate-fade-in-up ${className}`}>
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl surface-brand">
        <Icon size={28} className="text-[var(--gm-brand-light)]" aria-hidden="true" />
      </div>
      <h3 className="text-h3 text-[var(--gm-text)]">{title}</h3>
      {description && (
        <p className="mt-2 max-w-sm text-body text-[var(--gm-text-secondary)]">{description}</p>
      )}
      {action && (
        <Button onClick={action} variant="primary" size="md" className="mt-6">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
