import { CheckCircle2, Headphones, Search, ShieldAlert, UserX } from 'lucide-react';
import Logo from '../../components/brand/Logo';
import { adminStats, moderationQueue } from '../../data/platformData';

const adminAreas = ['User management', 'Video management', 'Reports', 'Earnings', 'Withdrawals', 'Fraud', 'Support'];

export default function AdminDashboard() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 pb-24 sm:px-6 lg:px-8">
      <header className="mb-8 flex flex-col justify-between gap-4 border-b border-slate-200 pb-6 md:flex-row md:items-end">
        <div>
          <Logo size="sm" hoverGlow={false} />
          <p className="mt-6 text-sm font-bold uppercase tracking-[0.16em] text-blue-600">Admin Center</p>
          <h1 className="mt-2 text-4xl font-bold text-slate-950">Platform operations and trust</h1>
        </div>
        <label className="relative block md:w-80">
          <Search className="absolute left-3 top-3 text-slate-400" size={18} />
          <input className="w-full rounded-md border border-slate-300 py-3 pl-10 pr-3" placeholder="Search users, videos, reports" />
        </label>
      </header>

      <section className="grid gap-4 md:grid-cols-4">
        {adminStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <article key={stat.label} className="rounded-lg border border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between">
                <Icon size={21} className="text-blue-600" />
                <span className="text-xs font-bold text-slate-500">{stat.trend}</span>
              </div>
              <p className="mt-5 text-sm text-slate-500">{stat.label}</p>
              <p className="mt-1 text-2xl font-bold text-slate-950">{stat.value}</p>
            </article>
          );
        })}
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <aside className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="text-xl font-bold text-slate-950">Admin modules</h2>
          <div className="mt-4 grid gap-2">
            {adminAreas.map((area) => (
              <button key={area} className="rounded-md px-3 py-3 text-left text-sm font-bold text-slate-700 hover:bg-slate-50">{area}</button>
            ))}
          </div>
        </aside>

        <section className="rounded-lg border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-200 p-5">
            <h2 className="text-xl font-bold text-slate-950">Fraud and moderation queue</h2>
            <ShieldAlert size={22} className="text-amber-600" />
          </div>
          <div className="divide-y divide-slate-200">
            {moderationQueue.map((item) => (
              <div key={item.item} className="grid gap-4 p-5 md:grid-cols-[1fr_auto_auto] md:items-center">
                <div>
                  <p className="font-bold text-slate-950">{item.item}</p>
                  <p className="mt-1 text-sm text-slate-500">{item.reason}</p>
                </div>
                <span className="rounded-md bg-amber-50 px-3 py-2 text-sm font-bold text-amber-700">Risk {item.score}</span>
                <button className="rounded-md bg-slate-950 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800">{item.action}</button>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="mt-6 grid gap-4 md:grid-cols-3">
        {[
          ['Withdrawal approvals', 'Review payout requests, KYC state, risk holds, and audit notes.', CheckCircle2],
          ['Support tickets', 'Resolve creator appeals, viewer reward disputes, and account issues.', Headphones],
          ['User enforcement', 'Warn, limit, block, or ban accounts with clear internal notes.', UserX],
        ].map(([title, copy, Icon]) => (
          <article key={title} className="rounded-lg border border-slate-200 bg-white p-5">
            <Icon size={22} className="text-blue-600" />
            <h3 className="mt-4 text-lg font-bold text-slate-950">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">{copy}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
