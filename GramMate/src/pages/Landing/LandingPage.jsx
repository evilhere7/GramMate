import { Link } from 'react-router-dom';
import { ArrowRight, Download, ShieldCheck, Star } from 'lucide-react';
import Logo from '../../components/brand/Logo';
import { faqs, landingSections, platformFeatures, securityPillars, trustFeatures } from '../../data/platformData';
import { supabase } from '../../lib/supabase';
import { useState, useEffect } from 'react';

const metricCards = [
  { label: 'Creator revenue share', value: '80%' },
  { label: 'Reward checks', value: '24/7' },
  { label: 'Clearing window', value: '48h' },
];

export default function LandingPage() {
  const [previewVideo, setPreviewVideo] = useState(null);

  useEffect(() => {
    const fetchPreviewVideo = async () => {
      try {
        const { data } = await supabase
          .from('videos')
          .select('*')
          .eq('is_active', true)
          .eq('visibility', 'public')
          .eq('processing_status', 'ready')
          .eq('moderation_status', 'approved')
          .order('likes_count', { ascending: false })
          .limit(1)
          .maybeSingle();

        setPreviewVideo(data);
      } catch (err) {
        console.error('Error fetching preview video:', err);
      }
    };

    fetchPreviewVideo();
  }, []);

  return (
    <div className="min-h-screen bg-white text-slate-950">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" aria-label="GramMate home">
            <Logo size="sm" hoverGlow={false} />
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex" aria-label="Primary">
            <a href="#how">How it works</a>
            <a href="#creators">Creators</a>
            <a href="#trust">Trust</a>
            <a href="#faq">FAQ</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/login" className="hidden rounded-md px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 sm:inline-flex">
              Log in
            </Link>
            <Link to="/signup" className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
              Get started
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="border-b border-slate-200 bg-slate-50">
          <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 md:grid-cols-[1.05fr_0.95fr] md:py-20 lg:px-8">
            <div className="flex flex-col justify-center">
              <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700">
                <ShieldCheck size={16} className="text-green-600" aria-hidden="true" />
                Creator economy with reward integrity
              </div>
              <h1 className="max-w-3xl text-5xl font-bold leading-[1.02] tracking-normal text-slate-950 sm:text-6xl">
                Watch. Create. Earn.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
                GramMate is a video platform where attention has value. Viewers discover rewarding videos, creators build durable income, and every payout is backed by transparent trust systems.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link to="/feed" className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-5 py-3 text-base font-semibold text-white hover:bg-blue-700">
                  Watch the feed
                  <ArrowRight size={18} aria-hidden="true" />
                </Link>
                <Link to="/upload" className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-5 py-3 text-base font-semibold text-slate-900 hover:bg-slate-100">
                  Start creating
                </Link>
              </div>
              <div className="mt-10 grid max-w-2xl grid-cols-3 gap-3">
                {metricCards.map((metric) => (
                  <div key={metric.label} className="rounded-md border border-slate-200 bg-white p-4">
                    <p className="text-2xl font-bold text-slate-950">{metric.value}</p>
                    <p className="mt-1 text-sm leading-5 text-slate-500">{metric.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative min-h-[520px] overflow-hidden rounded-lg border border-slate-200 bg-slate-950 shadow-sm flex flex-col justify-center">
              {previewVideo ? (
                <>
                  <video
                    className="h-full min-h-[520px] w-full object-cover opacity-80"
                    src={previewVideo.video_url}
                    autoPlay
                    muted
                    loop
                    playsInline
                    aria-label="GramMate video preview"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent p-6 text-white">
                    <div className="mb-4 inline-flex items-center gap-2 rounded-md bg-white/10 px-3 py-2 text-sm font-semibold backdrop-blur">
                      <Star size={16} aria-hidden="true" />
                      Eligible reward: ${previewVideo.reward_rate_per_min || '0.02'}/min
                    </div>
                    <h2 className="text-2xl font-bold">{previewVideo.title}</h2>
                    {previewVideo.description && (
                      <p className="mt-2 max-w-md text-sm leading-6 text-slate-200">{previewVideo.description}</p>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex h-full min-h-[520px] flex-col items-center justify-center p-6 text-slate-400 text-center bg-gradient-to-b from-slate-900 to-slate-950">
                  <Star size={48} className="text-amber-500 mb-4 animate-pulse" />
                  <h3 className="text-2xl font-bold text-white">Join GramMate Today</h3>
                  <p className="mt-3 max-w-xs text-sm leading-6 text-slate-300">
                    A decentralized creator economy where attention has value. Publish videos, build your audience, and earn rewards.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        <section id="how" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-blue-600">How GramMate Works</p>
            <h2 className="mt-3 text-4xl font-bold tracking-normal text-slate-950">Three simple actions. One accountable economy.</h2>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {landingSections.map((item) => {
              const Icon = item.icon;
              return (
                <article key={item.title} className="rounded-lg border border-slate-200 bg-white p-6">
                  <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-md bg-blue-50 text-blue-700">
                    <Icon size={20} aria-hidden="true" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-950">{item.title}</h3>
                  <p className="mt-3 leading-7 text-slate-600">{item.copy}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section id="creators" className="border-y border-slate-200 bg-slate-50">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-blue-600">Create and earn</p>
              <h2 className="mt-3 text-4xl font-bold text-slate-950">Built for creators who treat content like a business.</h2>
              <p className="mt-5 text-lg leading-8 text-slate-600">
                Upload, schedule, measure, monetize, and withdraw from one operating system. GramMate keeps revenue understandable and fraud controls visible.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {platformFeatures.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div key={feature.label} className="flex items-center gap-3 rounded-md border border-slate-200 bg-white p-4">
                    <Icon size={20} className="text-blue-600" aria-hidden="true" />
                    <span className="font-semibold text-slate-800">{feature.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section id="trust" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[1fr_0.9fr]">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-blue-600">Security and trust</p>
              <h2 className="mt-3 text-4xl font-bold text-slate-950">A financial platform needs more than likes.</h2>
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {securityPillars.map((pillar) => {
                  const Icon = pillar.icon;
                  return (
                    <article key={pillar.title} className="rounded-lg border border-slate-200 bg-white p-5">
                      <Icon size={20} className="text-slate-900" aria-hidden="true" />
                      <h3 className="mt-4 text-lg font-bold text-slate-950">{pillar.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{pillar.copy}</p>
                    </article>
                  );
                })}
              </div>
            </div>
            <aside className="rounded-lg border border-slate-200 bg-slate-950 p-6 text-white">
              <h3 className="text-2xl font-bold">Trust systems at launch</h3>
              <div className="mt-6 space-y-3">
                {trustFeatures.map((feature) => (
                  <div key={feature} className="flex items-center gap-3 rounded-md bg-white/8 p-3">
                    <ShieldCheck size={18} className="text-green-400" aria-hidden="true" />
                    <span className="text-sm font-medium text-slate-100">{feature}</span>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </section>

        <section id="faq" className="border-y border-slate-200 bg-slate-50">
          <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
            <h2 className="text-4xl font-bold text-slate-950">FAQ</h2>
            <div className="mt-8 divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
              {faqs.map((faq) => (
                <details key={faq.q} className="group p-6">
                  <summary className="cursor-pointer list-none text-lg font-bold text-slate-950">{faq.q}</summary>
                  <p className="mt-3 leading-7 text-slate-600">{faq.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="rounded-lg bg-slate-950 p-8 text-white md:flex md:items-center md:justify-between">
            <div>
              <h2 className="text-3xl font-bold">Take GramMate with you.</h2>
              <p className="mt-3 max-w-2xl text-slate-300">Mobile-first watching, creator uploads, wallet alerts, and payout approvals in one app-ready experience.</p>
            </div>
            <Link to="/signup" className="mt-6 inline-flex items-center gap-2 rounded-md bg-white px-5 py-3 font-semibold text-slate-950 hover:bg-slate-100 md:mt-0">
              <Download size={18} aria-hidden="true" />
              Download app
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 text-sm text-slate-500 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <Logo size="xs" hoverGlow={false} />
          <p>Copyright 2026 GramMate. Watch. Create. Earn.</p>
        </div>
      </footer>
    </div>
  );
}
