import { useEffect, useState } from 'react';
import { Activity, Clock3, ShieldAlert } from 'lucide-react';
import Card from '../../components/ui/Card';
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
      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Event stream" description="Operational actions and moderation history." icon={Activity} />
        <Card title="Risk signals" description="Suspicious patterns and fraud alerts." icon={ShieldAlert} />
        <Card title="Retention" description="Platform health metrics and throughput." icon={Clock3} />
      </div>

      {loading ? (
        <div className="mt-8 text-slate-500">Loading logs...</div>
      ) : logs.length === 0 ? (
        <div className="mt-8 flex flex-col items-center justify-center p-12 text-slate-500 border border-slate-200 bg-white rounded-3xl">
          <Activity size={36} className="mb-2 text-slate-400" />
          <p className="text-lg font-bold text-slate-950">No activity logs available yet</p>
          <p className="text-sm mt-1">Platform operational events will be recorded here.</p>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {logs.map((item) => (
            <div key={item.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{item.action}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    Entity: {item.entity_type} {item.entity_id ? `(${item.entity_id.substring(0, 8)}...)` : ''} 
                    {item.actor?.username ? ` by @${item.actor.username}` : ''}
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
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
