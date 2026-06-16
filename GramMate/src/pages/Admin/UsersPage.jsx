import { useEffect, useState } from 'react';
import { Users, UserCheck, UserX } from 'lucide-react';
import Card from '../../components/ui/Card';
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
      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Active creators" description={`${creatorCount} creators currently registered.`} icon={Users} />
        <Card title="Verified accounts" description={`${verifiedCount} accounts verified.`} icon={UserCheck} />
        <Card title="Total registered" description={`${usersList.length} total users.`} icon={UserCheck} />
      </div>

      {loading ? (
        <div className="mt-8 text-slate-500">Loading users...</div>
      ) : usersList.length === 0 ? (
        <div className="mt-8 flex flex-col items-center justify-center p-12 text-slate-500 border border-slate-200 bg-white rounded-3xl">
          <Users size={36} className="mb-2 text-slate-400" />
          <p className="text-lg font-bold text-slate-950">No users registered yet</p>
          <p className="text-sm mt-1">Newly registered accounts will be listed here.</p>
        </div>
      ) : (
        <div className="mt-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="grid grid-cols-[1fr_1fr_1fr_1fr] gap-4 border-b border-slate-200 p-5 text-sm font-semibold text-slate-500">
            <span>Name</span>
            <span>Handle</span>
            <span>Role</span>
            <span className="text-right">Status</span>
          </div>
          {usersList.map((user) => (
            <div key={user.id} className="grid grid-cols-[1fr_1fr_1fr_1fr] gap-4 p-5 text-sm text-slate-700 items-center">
              <span className="font-semibold text-slate-950">{user.full_name || 'Anonymous User'}</span>
              <span>@{user.username}</span>
              <span className="capitalize">{user.role}</span>
              <span className="justify-self-end">
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  user.is_verified ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                }`}>
                  {user.is_verified ? 'Verified' : 'Active'}
                </span>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
