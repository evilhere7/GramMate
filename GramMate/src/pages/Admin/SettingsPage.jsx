import { SlidersHorizontal, ShieldCheck, Tool } from 'lucide-react';
import Card from '../../components/ui/Card';
import SectionHeader from '../../components/ui/SectionHeader';

const settings = [
  { label: 'Platform mode', value: 'Live' },
  { label: 'Moderation priority', value: 'High' },
  { label: 'Maintenance window', value: 'None scheduled' },
];

export default function AdminSettings() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 pb-24 sm:px-6 lg:px-8">
      <SectionHeader title="Admin settings" subtitle="Control platform policies, risk settings, and trust operations." />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Platform control" description="Live settings and operational mode." icon={SlidersHorizontal} />
        <Card title="Safety" description="Anti-fraud and moderation configuration." icon={ShieldCheck} />
        <Card title="Tools" description="Admin utilities, bulk actions, and audit controls." icon={Tool} />
      </div>

      <div className="mt-8 overflow-hidden rounded-xl surface">
        <div className="grid grid-cols-[1fr_1fr] gap-4 border-b border-[var(--gm-border)] px-5 py-3 text-caption font-semibold text-[var(--gm-text-secondary)]">
          <span>Setting</span>
          <span>Value</span>
        </div>
        <div className="divide-y divide-[var(--gm-border)]">
        {settings.map((setting) => (
          <div key={setting.label} className="grid grid-cols-[1fr_1fr] gap-4 px-5 py-3.5 text-sm text-[var(--gm-text-secondary)] hover:bg-[var(--gm-surface-elevated)] transition-colors">
            <span className="font-semibold text-[var(--gm-text)]">{setting.label}</span>
            <span>{setting.value}</span>
          </div>
        ))}
        </div>
      </div>
    </div>
  );
}
