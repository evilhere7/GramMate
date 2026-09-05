import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Users, 
  Video, 
  AlertTriangle, 
  DollarSign, 
  ArrowLeft,
  Search,
  Trash2,
  CheckCircle2,
  XCircle,
  ExternalLink,
  RefreshCw,
  Clock
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';
import { 
  fetchAdminMetrics, 
  fetchAdminUsers, 
  fetchAdminVideos, 
  deleteVideo, 
  fetchAdminReports, 
  updateAdminReportStatus,
  fetchAdminTransactions 
} from '../../services/supabaseService';
import { TableRowSkeleton } from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'users' | 'content' | 'reports' | 'transactions'
  const [metrics, setMetrics] = useState({
    totalUsers: 0,
    totalVideos: 0,
    totalComments: 0,
    totalTransactions: 0,
    totalReports: 0,
  });
  const [loadingMetrics, setLoadingMetrics] = useState(true);

  // Tab Data States
  const [usersList, setUsersList] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);

  const [videosList, setVideosList] = useState([]);
  const [loadingVideos, setLoadingVideos] = useState(false);

  const [reportsList, setReportsList] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);

  const [transactionsList, setTransactionsList] = useState([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);

  const { user, signOut } = useAuth();

  // Load Overview Metrics
  const loadMetrics = async () => {
    setLoadingMetrics(true);
    try {
      const data = await fetchAdminMetrics();
      setMetrics(data);
    } catch (err) {
      console.error('[AdminDashboard] Metrics error:', err);
    } finally {
      setLoadingMetrics(false);
    }
  };

  useEffect(() => {
    loadMetrics();
  }, []);

  // Load Tab-specific data
  useEffect(() => {
    if (activeTab === 'users') {
      setLoadingUsers(true);
      fetchAdminUsers({ search: userSearch }).then((data) => {
        setUsersList(data);
        setLoadingUsers(false);
      });
    } else if (activeTab === 'content') {
      setLoadingVideos(true);
      fetchAdminVideos().then((data) => {
        setVideosList(data);
        setLoadingVideos(false);
      });
    } else if (activeTab === 'reports') {
      setLoadingReports(true);
      fetchAdminReports().then((data) => {
        setReportsList(data);
        setLoadingReports(false);
      });
    } else if (activeTab === 'transactions') {
      setLoadingTransactions(true);
      fetchAdminTransactions().then((data) => {
        setTransactionsList(data);
        setLoadingTransactions(false);
      });
    }
  }, [activeTab, userSearch]);

  const handleDeleteVideo = async (videoId) => {
    if (!window.confirm('Are you sure you want to remove this video from the platform?')) return;
    try {
      await deleteVideo(videoId, null); // admin bypass
      setVideosList((prev) => prev.filter((v) => v.id !== videoId));
      setMetrics((prev) => ({ ...prev, totalVideos: Math.max(0, prev.totalVideos - 1) }));
      toast.success('Violating video deleted.');
    } catch (err) {
      toast.error('Failed to delete video.');
    }
  };

  const handleUpdateReport = async (reportId, newStatus) => {
    try {
      await updateAdminReportStatus(reportId, newStatus);
      setReportsList((prev) =>
        prev.map((r) => (r.id === reportId ? { ...r, status: newStatus } : r))
      );
      toast.success(`Report marked as ${newStatus}.`);
    } catch (err) {
      toast.error('Failed to update report status.');
    }
  };

  return (
    <div className="min-h-screen bg-[var(--gm-bg)] text-[var(--gm-text)] flex flex-col select-none">
      {/* Admin Top Navigation Bar */}
      <header className="border-b border-[var(--gm-border)] bg-[var(--gm-surface)] px-6 py-3.5 sticky top-0 z-30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center font-bold">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-tight text-[var(--gm-text)] flex items-center gap-2">
              <span>GramMate Administration</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
                Verified
              </span>
            </h1>
            <p className="text-[11px] text-[var(--gm-text-tertiary)]">
              Authorized admin: <span className="font-semibold text-[var(--gm-text-secondary)]">{user?.email}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadMetrics}
            className="gm-btn-secondary text-xs p-2 text-[var(--gm-text-secondary)]"
            title="Refresh metrics"
          >
            <RefreshCw size={14} className={loadingMetrics ? 'animate-spin' : ''} />
          </button>
          <Link
            to="/"
            className="gm-btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5"
          >
            <ArrowLeft size={14} />
            <span>Consumer Feed</span>
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 space-y-6">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-[var(--gm-border)] pb-2 overflow-x-auto no-scrollbar">
          {[
            { id: 'overview', label: 'Overview Metrics', icon: ShieldCheck },
            { id: 'users', label: 'User Directory', icon: Users },
            { id: 'content', label: 'Content Review', icon: Video },
            { id: 'reports', label: 'Moderation Queue', icon: AlertTriangle, badge: metrics.totalReports > 0 ? metrics.totalReports : null },
            { id: 'transactions', label: 'Financial Audit', icon: DollarSign },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-colors shrink-0 ${
                  isActive 
                    ? 'bg-[var(--gm-surface-elevated)] text-[var(--gm-text)] border border-[var(--gm-border-strong)]' 
                    : 'text-[var(--gm-text-secondary)] hover:text-[var(--gm-text)] hover:bg-[var(--gm-surface)]'
                }`}
              >
                <Icon size={15} className={isActive ? 'text-[var(--gm-brand)]' : ''} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-400 font-black">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* TAB 1: OVERVIEW METRICS */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="gm-card p-5 border border-[var(--gm-border)]">
                <span className="text-xs font-bold text-[var(--gm-text-tertiary)] uppercase tracking-wider block mb-1">
                  Registered Users
                </span>
                <p className="text-2xl md:text-3xl font-black text-[var(--gm-text)]">
                  {loadingMetrics ? '—' : metrics.totalUsers}
                </p>
                <p className="text-[11px] text-[var(--gm-text-secondary)] mt-1">
                  Profiles synced in Supabase
                </p>
              </div>

              <div className="gm-card p-5 border border-[var(--gm-border)]">
                <span className="text-xs font-bold text-[var(--gm-text-tertiary)] uppercase tracking-wider block mb-1">
                  Total Videos
                </span>
                <p className="text-2xl md:text-3xl font-black text-[var(--gm-text)]">
                  {loadingMetrics ? '—' : metrics.totalVideos}
                </p>
                <p className="text-[11px] text-[var(--gm-text-secondary)] mt-1">
                  Published short videos
                </p>
              </div>

              <div className="gm-card p-5 border border-[var(--gm-border)]">
                <span className="text-xs font-bold text-[var(--gm-text-tertiary)] uppercase tracking-wider block mb-1">
                  Comments
                </span>
                <p className="text-2xl md:text-3xl font-black text-[var(--gm-text)]">
                  {loadingMetrics ? '—' : metrics.totalComments}
                </p>
                <p className="text-[11px] text-[var(--gm-text-secondary)] mt-1">
                  User engagements recorded
                </p>
              </div>

              <div className="gm-card p-5 border border-[var(--gm-border)]">
                <span className="text-xs font-bold text-[var(--gm-text-tertiary)] uppercase tracking-wider block mb-1">
                  Transactions
                </span>
                <p className="text-2xl md:text-3xl font-black text-[var(--gm-text)]">
                  {loadingMetrics ? '—' : metrics.totalTransactions}
                </p>
                <p className="text-[11px] text-[var(--gm-text-secondary)] mt-1">
                  Financial ledger entries
                </p>
              </div>
            </div>

            {/* Quick Security & Architecture Info */}
            <div className="gm-card p-6 border border-[var(--gm-border)]">
              <h2 className="text-sm font-bold text-[var(--gm-text)] mb-3">
                Security & Platform Architecture
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-[var(--gm-text-secondary)]">
                <div className="p-3 bg-[var(--gm-surface-elevated)] rounded-lg border border-[var(--gm-border)]">
                  <p className="font-bold text-[var(--gm-text)] mb-1">Identity Provider</p>
                  <p>Firebase Authentication (Google OAuth + Email/Password sessions with local persistence).</p>
                </div>
                <div className="p-3 bg-[var(--gm-surface-elevated)] rounded-lg border border-[var(--gm-border)]">
                  <p className="font-bold text-[var(--gm-text)] mb-1">Database Engine</p>
                  <p>Supabase PostgreSQL with Row-Level Security (RLS) policies enforcing authorization.</p>
                </div>
                <div className="p-3 bg-[var(--gm-surface-elevated)] rounded-lg border border-[var(--gm-border)]">
                  <p className="font-bold text-[var(--gm-text)] mb-1">Admin Enforcement</p>
                  <p>Strict server/database-side clearance bound solely to <span className="font-semibold text-[var(--gm-text)]">evilmc777@gmail.com</span>.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: USER DIRECTORY */}
        {activeTab === 'users' && (
          <div className="gm-card border border-[var(--gm-border)] overflow-hidden">
            <div className="p-4 border-b border-[var(--gm-border)] flex items-center justify-between gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--gm-text-tertiary)]" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search by username or name..."
                  className="gm-input pl-9 text-xs py-2"
                />
              </div>
              <span className="text-xs text-[var(--gm-text-tertiary)]">
                {usersList.length} users found
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[var(--gm-surface-elevated)] text-[var(--gm-text-secondary)] border-b border-[var(--gm-border)] uppercase tracking-wider font-semibold text-[10px]">
                  <tr>
                    <th className="p-3.5">User</th>
                    <th className="p-3.5">Role</th>
                    <th className="p-3.5">Verified</th>
                    <th className="p-3.5">Joined Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--gm-border)]">
                  {loadingUsers ? (
                    <TableRowSkeleton cols={4} />
                  ) : usersList.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-[var(--gm-text-tertiary)]">
                        No users found.
                      </td>
                    </tr>
                  ) : (
                    usersList.map((u) => (
                      <tr key={u.id} className="hover:bg-[var(--gm-surface-elevated)] transition-colors">
                        <td className="p-3.5">
                          <div className="flex items-center gap-2.5">
                            {u.avatar_url ? (
                              <img src={u.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover" />
                            ) : (
                              <div className="w-7 h-7 rounded-full bg-[var(--gm-surface-elevated)] flex items-center justify-center font-bold">
                                {u.username?.charAt(0)?.toUpperCase() || 'U'}
                              </div>
                            )}
                            <div>
                              <p className="font-bold text-[var(--gm-text)]">{u.full_name || u.username}</p>
                              <p className="text-[10px] text-[var(--gm-text-tertiary)]">@{u.username}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-3.5 capitalize font-semibold">{u.role || 'viewer'}</td>
                        <td className="p-3.5">
                          {u.is_verified ? (
                            <span className="gm-badge gm-badge-success text-[10px]">Verified</span>
                          ) : (
                            <span className="text-[var(--gm-text-tertiary)]">Standard</span>
                          )}
                        </td>
                        <td className="p-3.5 text-[var(--gm-text-tertiary)]">
                          {new Date(u.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: CONTENT REVIEW */}
        {activeTab === 'content' && (
          <div className="gm-card border border-[var(--gm-border)] overflow-hidden">
            <div className="p-4 border-b border-[var(--gm-border)] flex items-center justify-between">
              <h2 className="text-xs font-bold text-[var(--gm-text)] uppercase tracking-wider">
                Published Videos Catalog
              </h2>
              <span className="text-xs text-[var(--gm-text-tertiary)]">
                {videosList.length} videos
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[var(--gm-surface-elevated)] text-[var(--gm-text-secondary)] border-b border-[var(--gm-border)] uppercase tracking-wider font-semibold text-[10px]">
                  <tr>
                    <th className="p-3.5">Video Title</th>
                    <th className="p-3.5">Category</th>
                    <th className="p-3.5">Engagement</th>
                    <th className="p-3.5">Published</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--gm-border)]">
                  {loadingVideos ? (
                    <TableRowSkeleton cols={5} />
                  ) : videosList.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-[var(--gm-text-tertiary)]">
                        No videos published yet.
                      </td>
                    </tr>
                  ) : (
                    videosList.map((vid) => (
                      <tr key={vid.id} className="hover:bg-[var(--gm-surface-elevated)] transition-colors">
                        <td className="p-3.5">
                          <p className="font-bold text-[var(--gm-text)] line-clamp-1">{vid.title}</p>
                          <span className="text-[10px] text-[var(--gm-text-tertiary)] truncate block max-w-xs">
                            {vid.id}
                          </span>
                        </td>
                        <td className="p-3.5">{vid.category || 'General'}</td>
                        <td className="p-3.5">
                          <span className="text-[var(--gm-text-secondary)]">
                            {vid.likes_count || 0} likes • {vid.comments_count || 0} comments
                          </span>
                        </td>
                        <td className="p-3.5 text-[var(--gm-text-tertiary)]">
                          {new Date(vid.created_at).toLocaleDateString()}
                        </td>
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => handleDeleteVideo(vid.id)}
                            className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-md transition-colors"
                            title="Remove violating video"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: MODERATION REPORTS */}
        {activeTab === 'reports' && (
          <div className="gm-card border border-[var(--gm-border)] overflow-hidden">
            <div className="p-4 border-b border-[var(--gm-border)] flex items-center justify-between">
              <h2 className="text-xs font-bold text-[var(--gm-text)] uppercase tracking-wider">
                Community Moderation Reports
              </h2>
              <span className="text-xs text-[var(--gm-text-tertiary)]">
                {reportsList.length} reports
              </span>
            </div>

            {loadingReports ? (
              <div className="p-8 space-y-3">
                <div className="h-8 bg-[var(--gm-surface-elevated)] rounded-md animate-pulse" />
              </div>
            ) : reportsList.length === 0 ? (
              <div className="py-12">
                <EmptyState
                  icon={CheckCircle2}
                  title="Moderation queue clear"
                  description="No unresolved community reports pending review."
                />
              </div>
            ) : (
              <div className="divide-y divide-[var(--gm-border)] text-xs">
                {reportsList.map((r) => (
                  <div key={r.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-red-400">{r.reason}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold ${
                          r.status === 'resolved' 
                            ? 'bg-emerald-500/15 text-emerald-400' 
                            : r.status === 'dismissed'
                            ? 'bg-zinc-500/15 text-zinc-400'
                            : 'bg-amber-500/15 text-amber-400'
                        }`}>
                          {r.status}
                        </span>
                      </div>
                      {r.description && (
                        <p className="text-[var(--gm-text-secondary)]">{r.description}</p>
                      )}
                      <p className="text-[10px] text-[var(--gm-text-tertiary)]">
                        Target video: {r.video_id} • Reported on {new Date(r.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {r.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleUpdateReport(r.id, 'resolved')}
                            className="gm-btn-secondary text-xs px-2.5 py-1 text-emerald-400 hover:text-emerald-300"
                          >
                            Resolve
                          </button>
                          <button
                            onClick={() => handleUpdateReport(r.id, 'dismissed')}
                            className="gm-btn-ghost text-xs px-2.5 py-1"
                          >
                            Dismiss
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: FINANCIAL AUDIT */}
        {activeTab === 'transactions' && (
          <div className="gm-card border border-[var(--gm-border)] overflow-hidden">
            <div className="p-4 border-b border-[var(--gm-border)] flex items-center justify-between">
              <h2 className="text-xs font-bold text-[var(--gm-text)] uppercase tracking-wider">
                Platform Financial Activity & Payouts
              </h2>
              <span className="text-xs text-[var(--gm-text-tertiary)]">
                {transactionsList.length} transactions
              </span>
            </div>

            {loadingTransactions ? (
              <div className="p-8 space-y-3">
                <div className="h-8 bg-[var(--gm-surface-elevated)] rounded-md animate-pulse" />
              </div>
            ) : transactionsList.length === 0 ? (
              <div className="py-12">
                <EmptyState
                  icon={DollarSign}
                  title="No financial transactions"
                  description="All creator payouts and rewards transactions will be audited in this ledger."
                />
              </div>
            ) : (
              <div className="divide-y divide-[var(--gm-border)] text-xs">
                {transactionsList.map((tx) => (
                  <div key={tx.id} className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-[var(--gm-text)]">
                        {tx.description || tx.transaction_type}
                      </p>
                      <p className="text-[10px] text-[var(--gm-text-tertiary)]">
                        User ID: {tx.user_id} • {new Date(tx.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-sm">
                        ${(Math.abs(tx.amount_cents || 0) / 100).toFixed(2)}
                      </p>
                      <span className="text-[10px] font-semibold text-emerald-400 uppercase">
                        {tx.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
