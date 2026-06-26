import { useEffect, useState } from 'react';
import { Users, UserCheck } from 'lucide-react';
import SectionHeader from '../../components/ui/SectionHeader';
import { supabase } from '../../lib/supabase';

export default function AdminUsers() {
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('profiles')
          .select('id, username, full_name, role, is_verified')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setUsersList(data || []);
      } catch (err) {
        console.error('Error fetching users:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const creatorCount = usersList.filter(u => u.role === 'creator').length;
  const verifiedCount = usersList.filter(u => u.is_verified).length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 pb-24 sm:px-6 lg:px-8">
      <SectionHeader title="User management" subtitle="Review accounts, roles, and platform access." />

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Active creators', value: creatorCount, icon: Users },
          { label: 'Verified accounts', value: verifiedCount, icon: UserCheck },
          { label: 'Total registered', value: usersList.length, icon: Users },
        ].map(({ label, value, icon: Icon }) => (
          <article key={label} className="surface rounded-xl p-5 card-hover">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--gm-surface-elevated)] border border-[var(--gm-border)]">
              <Icon size={18} className="text-[var(--gm-brand-light)]" aria-hidden="true" />
            </div>
            <p className="mt-4 text-caption text-[var(--gm-text-secondary)]">{label}</p>
            <p className="mt-1 text-h2 text-[var(--gm-text)]">{value}</p>
          </article>
        ))}
      </div>

      {loading ? (
        <div className="mt-8 text-sm text-[var(--gm-text-secondary)]">Loading users…</div>
      ) : usersList.length === 0 ? (
        <div className="mt-8 flex flex-col items-center justify-center rounded-xl surface p-12 text-center">
          <Users size={32} className="mb-3 text-[var(--gm-text-tertiary)]" />
          <p className="text-h3 text-[var(--gm-text)]">No users registered yet</p>
          <p className="mt-1 text-body text-[var(--gm-text-secondary)]">Newly registered accounts will appear here.</p>
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-xl surface">
          {/* Table header */}
          <div className="grid grid-cols-[1fr_1fr_1fr_1fr] gap-4 border-b border-[var(--gm-border)] px-5 py-3 text-caption font-semibold text-[var(--gm-text-secondary)]">
            <span>Name</span>
            <span>Handle</span>
            <span>Role</span>
            <span className="text-right">Status</span>
          </div>
          {/* Table rows */}
          <div className="divide-y divide-[var(--gm-border)]">
            {usersList.map((user) => (
              <div key={user.id} className="grid grid-cols-[1fr_1fr_1fr_1fr] gap-4 px-5 py-3.5 text-sm items-center hover:bg-[var(--gm-surface-elevated)] transition-colors">
                <span className="font-semibold text-[var(--gm-text)]">{user.full_name || 'Anonymous'}</span>
                <span className="text-[var(--gm-text-secondary)]">@{user.username}</span>
                <span className="capitalize text-[var(--gm-text-secondary)]">{user.role}</span>
                <span className="justify-self-end">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border ${
                    user.is_verified
                      ? 'bg-success/10 text-success border-success/20'
                      : 'bg-[var(--gm-surface-elevated)] text-[var(--gm-text-secondary)] border-[var(--gm-border)]'
                  }`}>
                    {user.is_verified ? 'Verified' : 'Active'}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
