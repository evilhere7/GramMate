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

      <div className="mt-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="grid grid-cols-[1fr_1fr] gap-4 border-b border-slate-200 p-5 text-sm font-semibold text-slate-500">
          <span>Setting</span>
          <span>Value</span>
        </div>
        {settings.map((setting) => (
          <div key={setting.label} className="grid grid-cols-[1fr_1fr] gap-4 p-5 text-sm text-slate-700">
            <span>{setting.label}</span>
            <span>{setting.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
