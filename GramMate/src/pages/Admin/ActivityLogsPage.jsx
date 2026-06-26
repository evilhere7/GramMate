import { useEffect, useState } from 'react';
import { Activity, Clock3, ShieldAlert } from 'lucide-react';
import SectionHeader from '../../components/ui/SectionHeader';
import { supabase } from '../../lib/supabase';

export default function AdminActivityLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('audit_logs')
          .select(`
            id,
            action,
            entity_type,
            entity_id,
            created_at,
            actor:actor_id (
              username
            )
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setLogs(data || []);
      } catch (err) {
        console.error('Error fetching audit logs:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 pb-24 sm:px-6 lg:px-8">
      <SectionHeader title="Activity logs" subtitle="Audit changes, approvals, and trust actions across the platform." />

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Event stream', desc: 'Operational actions and moderation history.', icon: Activity },
          { label: 'Risk signals', desc: 'Suspicious patterns and fraud alerts.', icon: ShieldAlert },
          { label: 'Retention', desc: 'Platform health metrics and throughput.', icon: Clock3 },
        ].map(({ label, desc, icon: Icon }) => (
          <article key={label} className="surface rounded-xl p-5 card-hover">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--gm-surface-elevated)] border border-[var(--gm-border)]">
              <Icon size={18} className="text-[var(--gm-brand-light)]" aria-hidden="true" />
            </div>
            <h3 className="mt-4 text-h3 text-[var(--gm-text)]">{label}</h3>
            <p className="mt-1 text-caption text-[var(--gm-text-secondary)]">{desc}</p>
          </article>
        ))}
      </div>

      {loading ? (
        <div className="mt-8 text-sm text-[var(--gm-text-secondary)]">Loading logs…</div>
      ) : logs.length === 0 ? (
        <div className="mt-6 flex flex-col items-center justify-center rounded-xl surface p-12 text-center">
          <Activity size={32} className="mb-3 text-[var(--gm-text-tertiary)]" />
          <p className="text-h3 text-[var(--gm-text)]">No activity logs yet</p>
          <p className="mt-1 text-body text-[var(--gm-text-secondary)]">Platform operational events will be recorded here.</p>
        </div>
      ) : (
        <div className="mt-6 space-y-2">
          {logs.map((item) => (
            <div key={item.id} className="surface rounded-xl px-5 py-4 card-hover">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-[var(--gm-text)]">{item.action}</p>
                  <p className="mt-0.5 text-caption text-[var(--gm-text-secondary)]">
                    {item.entity_type}
                    {item.entity_id ? ` (${item.entity_id.substring(0, 8)}…)` : ''}
                    {item.actor?.username ? ` · @${item.actor.username}` : ''}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-[var(--gm-surface-elevated)] border border-[var(--gm-border)] px-3 py-1 text-[11px] font-semibold text-[var(--gm-text-secondary)]">
                  {new Date(item.created_at).toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
