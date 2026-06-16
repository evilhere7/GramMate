import { Link } from 'react-router-dom';
import { ArrowRight, ChevronDown, Download, Play, ShieldCheck, Star } from 'lucide-react';
import Logo from '../../components/brand/Logo';
import { faqs, landingSections, platformFeatures, securityPillars, trustFeatures } from '../../data/platformData';
import { supabase } from '../../lib/supabase';
import { useState, useEffect, useRef } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { Moon, Sun } from 'lucide-react';

const metricCards = [
  { label: 'Creator revenue share', value: '80%' },
  { label: 'Reward checks', value: '24/7' },
  { label: 'Clearing window', value: '48h' },
];

function useInView(options = {}) {
  const ref = useRef(null);
  const [isInView, setIsInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsInView(true); },
      { threshold: 0.15, ...options }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return [ref, isInView];
}

function AnimateIn({ children, delay = 0, className = '' }) {
  const [ref, isInView] = useInView();
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${className}`}
      style={{
        opacity: isInView ? 1 : 0,
        transform: isInView ? 'translateY(0)' : 'translateY(24px)',
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

export default function LandingPage() {
  const [previewVideo, setPreviewVideo] = useState(null);
  const { theme, toggleTheme } = useTheme();

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
    <div className="min-h-screen bg-[var(--gm-bg)] text-[var(--gm-text)]">
      {/* ─── Header ─── */}
      <header className="sticky top-0 z-40 border-b border-[var(--gm-border)] glass">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" aria-label="GramMate home">
            <Logo size="sm" tagline={false} />
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-semibold text-[var(--gm-text-secondary)] md:flex" aria-label="Primary">
            <a href="#how" className="hover:text-[var(--gm-text)] transition-colors">How it works</a>
            <a href="#creators" className="hover:text-[var(--gm-text)] transition-colors">Creators</a>
            <a href="#trust" className="hover:text-[var(--gm-text)] transition-colors">Trust</a>
            <a href="#faq" className="hover:text-[var(--gm-text)] transition-colors">FAQ</a>
          </nav>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="rounded-lg p-2 text-[var(--gm-text-secondary)] hover:bg-[var(--gm-surface)] transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <Link to="/login" className="hidden rounded-lg px-3.5 py-2 text-sm font-semibold text-[var(--gm-text-secondary)] hover:bg-[var(--gm-surface)] hover:text-[var(--gm-text)] transition-colors sm:inline-flex">
              Log in
            </Link>
            <Link to="/signup" className="inline-flex items-center gap-2 rounded-lg gradient-brand px-4 py-2 text-sm font-bold text-white shadow-sm glow-brand transition-all hover:shadow-md active:scale-[0.97]">
              Get started
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* ─── Hero ─── */}
        <section className="relative overflow-hidden gradient-hero border-b border-[var(--gm-border)]">
          {/* Ambient glow blobs */}
          <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-[var(--gm-brand)] opacity-[0.07] blur-[120px]" />
          <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-[var(--gm-accent)] opacity-[0.07] blur-[120px]" />

          <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 md:grid-cols-[1.05fr_0.95fr] md:py-24 lg:px-8">
            <div className="flex flex-col justify-center">
              <AnimateIn>
                <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-full glass px-4 py-2 text-sm font-semibold text-[var(--gm-text-secondary)]">
                  <ShieldCheck size={16} className="text-success" aria-hidden="true" />
                  Creator economy with reward integrity
                </div>
              </AnimateIn>

              <AnimateIn delay={100}>
                <h1 className="text-display max-w-3xl">
                  <span className="gradient-text">Watch. Create.</span>{' '}
                  <span className="text-[var(--gm-text)]">Earn.</span>
                </h1>
              </AnimateIn>

              <AnimateIn delay={200}>
                <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--gm-text-secondary)]">
                  GramMate is a video platform where attention has value. Viewers discover rewarding videos, creators build durable income, and every payout is backed by transparent trust systems.
                </p>
              </AnimateIn>

              <AnimateIn delay={300}>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Link to="/feed" className="inline-flex items-center justify-center gap-2 rounded-xl gradient-brand px-6 py-3.5 text-base font-bold text-white shadow-sm glow-brand transition-all hover:shadow-md active:scale-[0.97]">
                    <Play size={18} fill="white" aria-hidden="true" />
                    Watch the feed
                  </Link>
                  <Link to="/upload" className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--gm-border-strong)] bg-[var(--gm-surface)] px-6 py-3.5 text-base font-bold text-[var(--gm-text)] hover:bg-[var(--gm-surface-elevated)] transition-colors active:scale-[0.97]">
                    Start creating
                  </Link>
                </div>
              </AnimateIn>

              <AnimateIn delay={400}>
                <div className="mt-10 grid max-w-2xl grid-cols-3 gap-3">
                  {metricCards.map((metric) => (
                    <div key={metric.label} className="rounded-xl surface p-4 card-hover">
                      <p className="text-h2 gradient-text">{metric.value}</p>
                      <p className="mt-1 text-caption text-[var(--gm-text-secondary)]">{metric.label}</p>
                    </div>
                  ))}
                </div>
              </AnimateIn>
            </div>

            {/* Video Preview */}
            <AnimateIn delay={300} className="relative min-h-[520px]">
              <div className="relative h-full min-h-[520px] overflow-hidden rounded-2xl border border-[var(--gm-border)] shadow-elevated">
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
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/80 to-transparent p-6 text-white">
                      <div className="mb-4 inline-flex items-center gap-2 rounded-full glass px-3 py-2 text-sm font-semibold">
                        <Star size={16} className="text-warning" aria-hidden="true" />
                        Eligible reward: ${previewVideo.reward_rate_per_min || '0.02'}/min
                      </div>
                      <h2 className="text-h2 text-white">{previewVideo.title}</h2>
                      {previewVideo.description && (
                        <p className="mt-2 max-w-md text-sm leading-6 text-slate-200">{previewVideo.description}</p>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="flex h-full min-h-[520px] flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-[var(--gm-surface)] to-[var(--gm-bg)]">
                    <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl surface-brand animate-float">
                      <Play size={32} className="text-[var(--gm-brand-light)]" fill="currentColor" />
                    </div>
                    <h3 className="text-h2 text-[var(--gm-text)]">Join GramMate Today</h3>
                    <p className="mt-3 max-w-xs text-body text-[var(--gm-text-secondary)]">
                      A creator economy where attention has value. Publish videos, build your audience, and earn rewards.
                    </p>
                  </div>
                )}
              </div>
            </AnimateIn>
          </div>
        </section>

        {/* ─── How It Works ─── */}
        <section id="how" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <AnimateIn>
            <div className="max-w-2xl">
              <p className="text-overline gradient-text">How GramMate Works</p>
              <h2 className="mt-3 text-h1">Three simple actions. One accountable economy.</h2>
            </div>
          </AnimateIn>
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {landingSections.map((item, i) => {
              const Icon = item.icon;
              return (
                <AnimateIn key={item.title} delay={i * 100}>
                  <article className="surface rounded-2xl p-6 card-hover h-full">
                    <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl surface-brand">
                      <Icon size={22} className="text-[var(--gm-brand-light)]" aria-hidden="true" />
                    </div>
                    <h3 className="text-h2">{item.title}</h3>
                    <p className="mt-3 text-body text-[var(--gm-text-secondary)]">{item.copy}</p>
                  </article>
                </AnimateIn>
              );
            })}
          </div>
        </section>

        {/* ─── Creator Features ─── */}
        <section id="creators" className="border-y border-[var(--gm-border)] bg-[var(--gm-surface)]">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
            <AnimateIn>
              <div>
                <p className="text-overline gradient-text">Create and earn</p>
                <h2 className="mt-3 text-h1">Built for creators who treat content like a business.</h2>
                <p className="mt-5 text-lg leading-8 text-[var(--gm-text-secondary)]">
                  Upload, schedule, measure, monetize, and withdraw from one operating system. GramMate keeps revenue understandable and fraud controls visible.
                </p>
              </div>
            </AnimateIn>
            <div className="grid gap-3 sm:grid-cols-2">
              {platformFeatures.map((feature, i) => {
                const Icon = feature.icon;
                return (
                  <AnimateIn key={feature.label} delay={i * 80}>
                    <div className="flex items-center gap-3 rounded-xl surface-elevated p-4 card-hover">
                      <Icon size={20} className="text-[var(--gm-brand-light)]" aria-hidden="true" />
                      <span className="font-semibold text-[var(--gm-text)]">{feature.label}</span>
                    </div>
                  </AnimateIn>
                );
              })}
            </div>
          </div>
        </section>

        {/* ─── Trust Section ─── */}
        <section id="trust" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[1fr_0.9fr]">
            <div>
              <AnimateIn>
                <p className="text-overline gradient-text">Security and trust</p>
                <h2 className="mt-3 text-h1">A financial platform needs more than likes.</h2>
              </AnimateIn>
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {securityPillars.map((pillar, i) => {
                  const Icon = pillar.icon;
                  return (
                    <AnimateIn key={pillar.title} delay={i * 80}>
                      <article className="surface rounded-2xl p-5 card-hover h-full">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg surface-brand">
                          <Icon size={20} className="text-[var(--gm-brand-light)]" aria-hidden="true" />
                        </div>
                        <h3 className="mt-4 text-h3">{pillar.title}</h3>
                        <p className="mt-2 text-caption text-[var(--gm-text-secondary)]">{pillar.copy}</p>
                      </article>
                    </AnimateIn>
                  );
                })}
              </div>
            </div>
            <AnimateIn delay={200}>
              <aside className="rounded-2xl gradient-brand p-6 text-white h-fit">
                <h3 className="text-h2 text-white">Trust systems at launch</h3>
                <div className="mt-6 space-y-3">
                  {trustFeatures.map((feature) => (
                    <div key={feature} className="flex items-center gap-3 rounded-xl bg-white/10 p-3 backdrop-blur">
                      <ShieldCheck size={18} className="text-emerald-300" aria-hidden="true" />
                      <span className="text-sm font-medium">{feature}</span>
                    </div>
                  ))}
                </div>
              </aside>
            </AnimateIn>
          </div>
        </section>

        {/* ─── FAQ ─── */}
        <section id="faq" className="border-y border-[var(--gm-border)] bg-[var(--gm-surface)]">
          <div className="mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:px-8">
            <AnimateIn>
              <h2 className="text-h1">Frequently asked questions</h2>
            </AnimateIn>
            <div className="mt-10 space-y-3">
              {faqs.map((faq, i) => (
                <AnimateIn key={faq.q} delay={i * 60}>
                  <details className="group surface rounded-xl overflow-hidden">
                    <summary className="flex cursor-pointer items-center justify-between p-5 text-h3 list-none">
                      {faq.q}
                      <ChevronDown size={20} className="text-[var(--gm-text-tertiary)] transition-transform duration-300 group-open:rotate-180" />
                    </summary>
                    <p className="px-5 pb-5 text-body text-[var(--gm-text-secondary)]">{faq.a}</p>
                  </details>
                </AnimateIn>
              ))}
            </div>
          </div>
        </section>

        {/* ─── CTA ─── */}
        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <AnimateIn>
            <div className="relative overflow-hidden rounded-2xl gradient-brand p-8 text-white md:flex md:items-center md:justify-between">
              {/* Ambient blob */}
              <div className="absolute -top-20 -right-20 h-60 w-60 rounded-full bg-white opacity-[0.08] blur-[80px]" />
              <div className="relative">
                <h2 className="text-h1 text-white">Take GramMate with you.</h2>
                <p className="mt-3 max-w-2xl text-white/80">Mobile-first watching, creator uploads, wallet alerts, and payout approvals in one app-ready experience.</p>
              </div>
              <Link to="/signup" className="relative mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 font-bold text-[var(--gm-brand-dark)] hover:bg-white/90 transition-colors active:scale-[0.97] md:mt-0">
                <Download size={18} aria-hidden="true" />
                Get started free
              </Link>
            </div>
          </AnimateIn>
        </section>
      </main>

      {/* ─── Footer ─── */}
      <footer className="border-t border-[var(--gm-border)]">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <Logo size="xs" tagline={false} />
          <nav className="flex flex-wrap gap-6 text-sm font-medium text-[var(--gm-text-secondary)]">
            <a href="#how" className="hover:text-[var(--gm-text)] transition-colors">How it works</a>
            <a href="#creators" className="hover:text-[var(--gm-text)] transition-colors">Creators</a>
            <a href="#trust" className="hover:text-[var(--gm-text)] transition-colors">Trust</a>
            <a href="#faq" className="hover:text-[var(--gm-text)] transition-colors">FAQ</a>
          </nav>
          <p className="text-caption text-[var(--gm-text-tertiary)]">© 2026 GramMate. Watch. Create. Earn.</p>
        </div>
      </footer>
    </div>
  );
}
