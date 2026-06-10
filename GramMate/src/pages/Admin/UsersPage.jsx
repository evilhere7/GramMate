import { Users, UserCheck, UserX } from 'lucide-react';
import Card from '../../components/ui/Card';
import SectionHeader from '../../components/ui/SectionHeader';

const users = [
  { name: 'Alicia Keys', role: 'Creator', status: 'Active' },
  { name: 'Marcus Lee', role: 'Moderator', status: 'Pending review' },
  { name: 'Shade Moore', role: 'Creator', status: 'Restricted' },
];

export default function AdminUsers() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 pb-24 sm:px-6 lg:px-8">
      <SectionHeader title="User management" subtitle="Review accounts, roles, and platform access." />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Active creators" description="Creators currently posting and earning." icon={Users} />
        <Card title="Moderation queue" description="Accounts requiring review and verification." icon={UserCheck} />
        <Card title="Banned users" description="Removed accounts under investigation." icon={UserX} />
      </div>

      <div className="mt-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="grid grid-cols-[1fr_1fr_1fr_1fr] gap-4 border-b border-slate-200 p-5 text-sm font-semibold text-slate-500">
          <span>Name</span>
          <span>Role</span>
          <span>Status</span>
          <span className="text-right">Action</span>
        </div>
        {users.map((user) => (
          <div key={user.name} className="grid grid-cols-[1fr_1fr_1fr_1fr] gap-4 p-5 text-sm text-slate-700">
            <span>{user.name}</span>
            <span>{user.role}</span>
            <span>{user.status}</span>
            <button className="justify-self-end rounded-full bg-slate-100 px-4 py-2 text-slate-700 hover:bg-slate-200">Review</button>
          </div>
        ))}
      </div>
    </div>
  );
}
