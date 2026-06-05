import { CalendarClock, CheckCircle2, MoreHorizontal, Plus, TrendingUp } from 'lucide-react';
import { creatorStats, videos } from '../../data/platformData';

const revenueRows = [
  { source: 'Ad revenue share', value: '$18,240', share: '73%' },
  { source: 'Tips and donations', value: '$3,610', share: '14%' },
  { source: 'Sponsorship marketplace', value: '$2,180', share: '9%' },
  { source: 'Campaign rewards', value: '$830', share: '4%' },
];

export default function CreatorStudio() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 pb-24 sm:px-6 lg:px-8">
      <header className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-blue-600">Creator Studio</p>
          <h1 className="mt-2 text-4xl font-bold text-slate-950">Analytics, revenue, and uploads</h1>
          <p className="mt-3 max-w-2xl text-slate-600">Monitor content performance, schedule videos, and understand exactly where creator earnings come from.</p>
        </div>
        <button className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700">
          <Plus size={18} aria-hidden="true" />
          New upload
        </button>
      </header>

      <section className="grid gap-4 md:grid-cols-4">
        {creatorStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <article key={stat.label} className="rounded-lg border border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between">
                <Icon size={20} className="text-blue-600" aria-hidden="true" />
                <span className="rounded-md bg-green-50 px-2 py-1 text-xs font-bold text-green-700">{stat.delta}</span>
              </div>
              <p className="mt-5 text-sm text-slate-500">{stat.label}</p>
              <p className="mt-1 text-2xl font-bold text-slate-950">{stat.value}</p>
            </article>
          );
        })}
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-lg border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-950">Revenue analytics</h2>
            <TrendingUp size={20} className="text-green-600" aria-hidden="true" />
          </div>
          <div className="mt-6 space-y-4">
            {revenueRows.map((row) => (
              <div key={row.source}>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-semibold text-slate-700">{row.source}</span>
                  <span className="font-bold text-slate-950">{row.value}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100">
                  <div className="h-2 rounded-full bg-blue-600" style={{ width: row.share }} />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-bold text-slate-950">Audience analytics</h2>
          <div className="mt-6 grid grid-cols-2 gap-3">
            {['US 41%', 'NP 18%', 'IN 13%', 'UK 8%'].map((item) => (
              <div key={item} className="rounded-md bg-slate-50 p-4 text-sm font-bold text-slate-700">{item}</div>
            ))}
          </div>
          <div className="mt-6 rounded-md border border-slate-200 p-4">
            <p className="text-sm font-semibold text-slate-500">Best publishing window</p>
            <p className="mt-1 text-2xl font-bold text-slate-950">6:00 PM - 8:00 PM</p>
          </div>
        </section>
      </div>

      <section className="mt-6 rounded-lg border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-200 p-6">
          <h2 className="text-xl font-bold text-slate-950">Upload manager</h2>
          <CalendarClock size={20} className="text-slate-500" aria-hidden="true" />
        </div>
        <div className="divide-y divide-slate-200">
          {videos.map((video, index) => (
            <div key={video.id} className="grid gap-4 p-5 md:grid-cols-[1fr_auto_auto_auto] md:items-center">
              <div>
                <p className="font-bold text-slate-950">{video.title}</p>
                <p className="mt-1 text-sm text-slate-500">{video.category} - {video.duration}</p>
              </div>
              <span className="inline-flex items-center gap-2 rounded-md bg-green-50 px-3 py-2 text-sm font-bold text-green-700">
                <CheckCircle2 size={16} aria-hidden="true" />
                {index === 1 ? 'Scheduled' : 'Live'}
              </span>
              <span className="text-sm font-semibold text-slate-600">{video.likes} likes</span>
              <button className="rounded-md p-2 text-slate-500 hover:bg-slate-100" aria-label={`More actions for ${video.title}`}>
                <MoreHorizontal size={20} />
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
