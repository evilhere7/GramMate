import Card from '../../components/ui/Card';
import SectionHeader from '../../components/ui/SectionHeader';
import SkeletonBlock from '../../components/ui/SkeletonBlock';

const stats = [
  { label: 'Creators', value: '2,340' },
  { label: 'Videos', value: '18.2k' },
  { label: 'Earnings', value: '$1.8M' },
  { label: 'Reports', value: '152' },
];

export default function HomePage() {
  return (
    <div className="space-y-8">
      <SectionHeader title="Overview" subtitle="Your creator economy operating system." />
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <Card key={item.label} className="border-slate-200 bg-slate-50">
            <p className="text-sm uppercase tracking-[0.2em] text-slate-400">{item.label}</p>
            <p className="mt-4 text-3xl font-semibold text-slate-950">{item.value}</p>
          </Card>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <Card title="Recent activity" description="A quick snapshot of platform engagement." className="overflow-hidden">
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-3 text-sm text-slate-500">
                  <span>Campaign</span>
                  <span>2 hours ago</span>
                </div>
                <p className="text-sm text-slate-700">Creator payout was processed and the campaign reach increased to 120K.</p>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Live metrics" description="Current platform pulse and system health.">
          <div className="space-y-4">
            <SkeletonBlock className="h-20 w-full" />
            <SkeletonBlock className="h-20 w-full" />
            <SkeletonBlock className="h-20 w-full" />
          </div>
        </Card>
      </div>
    </div>
  );
}
