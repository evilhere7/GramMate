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
    <div className="mx-auto max-w-7xl px-4 py-8 pb-24 sm:px-6 lg:px-8 space-y-8">
      <SectionHeader title="Overview" subtitle="Your creator economy operating system." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <article key={item.label} className="surface rounded-xl p-5 card-hover">
            <p className="text-overline text-[var(--gm-text-tertiary)]">{item.label}</p>
            <p className="mt-3 text-h1 text-[var(--gm-text)]">{item.value}</p>
          </article>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <Card title="Recent activity" description="A quick snapshot of platform engagement." className="overflow-hidden">
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="rounded-xl border border-[var(--gm-border)] bg-[var(--gm-surface-elevated)] p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span className="text-caption font-semibold text-[var(--gm-brand-light)]">Campaign</span>
                  <span className="text-caption text-[var(--gm-text-tertiary)]">2 hours ago</span>
                </div>
                <p className="text-body text-[var(--gm-text-secondary)]">Creator payout was processed and the campaign reach increased to 120K.</p>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Live metrics" description="Current platform pulse and system health.">
          <div className="space-y-3">
            <SkeletonBlock className="h-20 w-full" />
            <SkeletonBlock className="h-20 w-full" />
            <SkeletonBlock className="h-20 w-full" />
          </div>
        </Card>
      </div>
    </div>
  );
}
