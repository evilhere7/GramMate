import { Activity, Clock3, ShieldAlert } from 'lucide-react';
import Card from '../../components/ui/Card';
import SectionHeader from '../../components/ui/SectionHeader';

const logs = [
  { event: 'User ban executed', detail: 'Account suspended for policy violation', time: '12m ago' },
  { event: 'Withdrawal reviewed', detail: 'Verified payout cleared for creator', time: '34m ago' },
  { event: 'Report escalated', detail: 'Video flagged by 3 moderators', time: '1h ago' },
];

export default function AdminActivityLogs() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 pb-24 sm:px-6 lg:px-8">
      <SectionHeader title="Activity logs" subtitle="Audit changes, approvals, and trust actions across the platform." />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Event stream" description="Operational actions and moderation history." icon={Activity} />
        <Card title="Risk signals" description="Suspicious patterns and fraud alerts." icon={ShieldAlert} />
        <Card title="Retention" description="Platform health metrics and throughput." icon={Clock3} />
      </div>

      <div className="mt-8 space-y-4">
        {logs.map((item) => (
          <div key={item.event} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-900">{item.event}</p>
                <p className="mt-1 text-sm text-slate-500">{item.detail}</p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{item.time}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
