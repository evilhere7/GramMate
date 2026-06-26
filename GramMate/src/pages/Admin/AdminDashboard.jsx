import { useEffect, useState, useMemo } from 'react';
import { 
  Users, 
  Video, 
  Flag, 
  CheckCircle, 
  TrendingUp, 
  Bell, 
  Settings, 
  ClipboardList, 
  User, 
  LayoutDashboard, 
  Menu, 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  Filter, 
  Check, 
  X, 
  AlertTriangle, 
  Trash2, 
  Eye, 
  Play, 
  Lock, 
  Unlock, 
  Activity, 
  FileText, 
  Database, 
  Sparkles, 
  Download, 
  LogOut, 
  RefreshCw, 
  Sliders, 
  Info,
  Shield,
  Clock,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

// Helper to generate seed mock data for local fallback
const generateMockData = () => {
  const mockUsers = [
    { id: 'u1', username: 'charlie_dance', email: 'charlie@dance.io', role: 'creator', is_verified: true, is_banned: false, created_at: '2026-01-12T10:30:00Z', videos_count: 14, reports_count: 0, wallet_balance: 345.50 },
    { id: 'u2', username: 'gamer_pro99', email: 'gamerpro@gmail.com', role: 'user', is_verified: false, is_banned: false, created_at: '2026-03-05T14:22:00Z', videos_count: 0, reports_count: 3, wallet_balance: 0.00 },
    { id: 'u3', username: 'vibe_creator', email: 'vibe@creator.co', role: 'creator', is_verified: true, is_banned: false, created_at: '2026-02-28T09:15:00Z', videos_count: 42, reports_count: 1, wallet_balance: 1250.00 },
    { id: 'u4', username: 'bad_actor', email: 'badactor@spam.com', role: 'user', is_verified: false, is_banned: true, created_at: '2026-05-19T21:40:00Z', videos_count: 2, reports_count: 8, wallet_balance: 5.25 },
    { id: 'u5', username: 'sound_waves', email: 'sound@waves.net', role: 'creator', is_verified: false, is_banned: false, created_at: '2026-06-01T11:05:00Z', videos_count: 8, reports_count: 0, wallet_balance: 120.00 },
    { id: 'u6', username: 'evilmc777', email: 'evilmc777@gmail.com', role: 'admin', is_verified: true, is_banned: false, created_at: '2025-12-01T00:00:00Z', videos_count: 0, reports_count: 0, wallet_balance: 9999.00 }
  ];

  const mockVideos = [
    { id: 'v1', user_id: 'u1', username: 'charlie_dance', title: 'Late Night Shuffle Choreography', category: 'Dance', video_url: 'https://assets.mixkit.co/videos/preview/mixkit-girl-dancing-under-neon-lights-34289-large.mp4', thumbnail_url: 'linear-gradient(135deg, #5A52E6, #3B82F6)', moderation_status: 'approved', is_featured: true, is_trending: true, created_at: '2026-06-15T18:30:00Z', views: 12500, likes: 2300 },
    { id: 'v2', user_id: 'u3', username: 'vibe_creator', title: 'Cinematic Lo-Fi Chill Beats Vol 3', category: 'Music', video_url: 'https://assets.mixkit.co/videos/preview/mixkit-stars-in-space-background-1611-large.mp4', thumbnail_url: 'linear-gradient(135deg, #1B1936, #5A52E6)', moderation_status: 'approved', is_featured: false, is_trending: true, created_at: '2026-06-20T08:00:00Z', views: 8900, likes: 1420 },
    { id: 'v3', user_id: 'u2', username: 'gamer_pro99', title: 'Insane Speedrun World Record Attempt', category: 'Gaming', video_url: 'https://assets.mixkit.co/videos/preview/mixkit-keyboard-glow-close-up-34293-large.mp4', thumbnail_url: 'linear-gradient(135deg, #EF4444, #F59E0B)', moderation_status: 'pending', is_featured: false, is_trending: false, created_at: '2026-06-25T22:10:00Z', views: 42, likes: 3 },
    { id: 'v4', user_id: 'u4', username: 'bad_actor', title: 'FREE BITCOIN GIVEAWAY 100% LEGIT CLICK LINK', category: 'Finance', video_url: 'https://assets.mixkit.co/videos/preview/mixkit-crypto-mining-farm-animation-40071-large.mp4', thumbnail_url: 'linear-gradient(135deg, #F59E0B, #EF4444)', moderation_status: 'flagged', is_featured: false, is_trending: false, created_at: '2026-06-24T12:00:00Z', views: 800, likes: 2 },
    { id: 'v5', user_id: 'u5', username: 'sound_waves', title: 'Summer Ocean Breeze Soundscape', category: 'Nature', video_url: 'https://assets.mixkit.co/videos/preview/mixkit-crashing-waves-of-the-sea-1528-large.mp4', thumbnail_url: 'linear-gradient(135deg, #3B82F6, #10B981)', moderation_status: 'pending', is_featured: false, is_trending: false, created_at: '2026-06-25T15:40:00Z', views: 112, likes: 19 }
  ];

  const mockReports = [
    { id: 'r1', reporter_username: 'gamer_pro99', reported_username: 'bad_actor', reason: 'Spam and financial scam links in video description', video_title: 'FREE BITCOIN GIVEAWAY 100% LEGIT CLICK LINK', video_id: 'v4', status: 'open', resolution_notes: '', created_at: '2026-06-24T14:30:00Z' },
    { id: 'r2', reporter_username: 'charlie_dance', reported_username: 'gamer_pro99', reason: 'Harassment and abusive language in comments', video_title: 'Late Night Shuffle Choreography', video_id: 'v1', status: 'open', resolution_notes: '', created_at: '2026-06-25T09:12:00Z' },
    { id: 'r3', reporter_username: 'vibe_creator', reported_username: 'bad_actor', reason: 'Copyright infringement / reuploaded track without authorization', video_title: 'Cinematic Lo-Fi Chill Beats Vol 3', video_id: 'v2', status: 'resolved', resolution_notes: 'Duplicate content. Creator warned, video unflagged after check.', created_at: '2026-06-23T11:00:00Z' }
  ];

  const mockCreators = [
    { id: 'c1', user_id: 'u5', username: 'sound_waves', email: 'sound@waves.net', status: 'pending', document_type: 'Passport / ID', document_url: '#', notes: 'Please verify my creator channel. I produce premium nature content.', created_at: '2026-06-25T16:00:00Z' },
    { id: 'c2', user_id: 'u2', username: 'gamer_pro99', email: 'gamerpro@gmail.com', status: 'rejected', document_type: 'Tax Document', document_url: '#', notes: 'Rejected: Document image too blurry to read.', created_at: '2026-06-18T14:00:00Z' }
  ];

  const mockLogs = [
    { id: 'l1', admin_email: 'evilmc777@gmail.com', action: 'Ban user', affected_resource: 'User: bad_actor', ip_address: '192.168.1.150', user_agent: 'Chrome/126.0.0.0 (Windows)', created_at: '2026-06-26T18:40:00Z' },
    { id: 'l2', admin_email: 'evilmc777@gmail.com', action: 'Approve creator verification', affected_resource: 'Creator: vibe_creator', ip_address: '192.168.1.150', user_agent: 'Chrome/126.0.0.0 (Windows)', created_at: '2026-06-26T12:15:00Z' },
    { id: 'l3', admin_email: 'system', action: 'Automatic backup completed', affected_resource: 'Database', ip_address: 'localhost', user_agent: 'GramMate CronJob', created_at: '2026-06-26T00:00:00Z' },
    { id: 'l4', admin_email: 'evilmc777@gmail.com', action: 'Disable user registration', affected_resource: 'System Setting: registration_enabled', ip_address: '192.168.1.150', user_agent: 'Chrome/126.0.0.0 (Windows)', created_at: '2026-06-25T20:10:00Z' }
  ];

  const mockNotifications = [
    { id: 'n1', title: 'Scam Report Triggered', message: 'Video "FREE BITCOIN GIVEAWAY..." has received multiple spam reports.', type: 'report', is_read: false, created_at: '2026-06-24T14:30:00Z' },
    { id: 'n2', title: 'New Creator Request', message: 'User @sound_waves submitted a new creator verification request.', type: 'verification_request', is_read: false, created_at: '2026-06-25T16:00:00Z' },
    { id: 'n3', title: 'Database Spike', message: 'Vite API queries spiked by 120% during feed trending update.', type: 'spike', is_read: true, created_at: '2026-06-26T10:15:00Z' }
  ];

  const mockSettings = {
    maintenance_mode: false,
    registration_enabled: true,
    max_upload_size_mb: 1000,
    allowed_formats: ['mp4', 'mov', 'webm'],
    feed_algorithm: 'trending',
    platform_name: 'GramMate'
  };

  return {
    users: mockUsers,
    videos: mockVideos,
    reports: mockReports,
    creators: mockCreators,
    logs: mockLogs,
    notifications: mockNotifications,
    settings: mockSettings
  };
};

export default function AdminDashboard() {
  const { user } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [fallbackMode, setFallbackMode] = useState(false);
  const [loading, setLoading] = useState(true);

  // Live state
  const [users, setUsers] = useState([]);
  const [videos, setVideos] = useState([]);
  const [reports, setReports] = useState([]);
  const [creators, setCreators] = useState([]);
  const [logs, setLogs] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [settings, setSettings] = useState({});

  // Filter / Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals & Action States
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showEnforceModal, setShowEnforceModal] = useState(false);
  const [showCreatorModal, setShowCreatorModal] = useState(false);
  const [enforcementAction, setEnforcementAction] = useState('warn');
  const [enforcementNotes, setEnforcementNotes] = useState('');
  const [creatorNotes, setCreatorNotes] = useState('');
  const [actionSuccessMessage, setActionSuccessMessage] = useState('');

  // Performance simulation
  const [responseTime, setResponseTime] = useState(48); // in ms
  const [dbHealth, setDbHealth] = useState('healthy');

  // Check Supabase and fetch data or activate fallback
  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Try querying admins table as a check
      const { data: adminsData, error: adminErr } = await supabase
        .from('admins')
        .select('*')
        .limit(1);

      if (adminErr) {
        throw new Error('Supabase migration table missing or RLS violation. Fallback to mock.');
      }

      // Fetch profiles
      const { data: profilesData } = await supabase.from('profiles').select('*');
      
      // Fetch videos
      const { data: videosData } = await supabase.from('videos').select('*');
      
      // Fetch reports
      const { data: reportsData } = await supabase.from('reports').select('*');

      // Fetch creators
      const { data: verificationsData } = await supabase.from('creator_verifications').select('*');
      
      // Fetch settings
      const { data: settingsData } = await supabase.from('system_settings').select('*');

      // Fetch notifications
      const { data: notificationsData } = await supabase.from('admin_notifications').select('*').order('created_at', { ascending: false });

      // Fetch logs
      const { data: logsData } = await supabase.from('admin_logs').select('*').order('created_at', { ascending: false });

      // Map profiles and counts
      const enrichedUsers = (profilesData || []).map(u => {
        const userVideos = (videosData || []).filter(v => v.user_id === u.id);
        const userReports = (reportsData || []).filter(r => r.reported_user_id === u.id);
        return {
          id: u.id,
          username: u.username || 'user_' + u.id.substring(0, 5),
          email: u.email || 'no-email@grammate.internal',
          role: u.role || 'user',
          is_verified: u.is_verified || false,
          is_banned: u.is_banned || false,
          created_at: u.created_at,
          videos_count: userVideos.length,
          reports_count: userReports.length,
          wallet_balance: 0.00 // Default or dynamic if wallets loaded
        };
      });

      // Map videos
      const enrichedVideos = (videosData || []).map(v => {
        const creator = enrichedUsers.find(u => u.id === v.user_id);
        return {
          id: v.id,
          user_id: v.user_id,
          username: creator ? creator.username : 'unknown',
          title: v.title || 'Untitled Video',
          category: v.category || 'General',
          video_url: v.video_url || '',
          thumbnail_url: v.thumbnail_url || 'linear-gradient(135deg, #5A52E6, #3B82F6)',
          moderation_status: v.moderation_status || 'pending',
          is_featured: v.is_featured || false,
          is_trending: v.is_trending || false,
          created_at: v.created_at,
          views: v.views || 0,
          likes: v.likes || 0
        };
      });

      // Map reports
      const enrichedReports = (reportsData || []).map(r => {
        const reporter = enrichedUsers.find(u => u.id === r.reporter_id);
        const reported = enrichedUsers.find(u => u.id === r.reported_user_id);
        const reportedVideo = enrichedVideos.find(v => v.id === r.video_id);
        return {
          id: r.id,
          reporter_username: reporter ? reporter.username : 'anonymous',
          reported_username: reported ? reported.username : 'unknown',
          reason: r.reason || 'No reason provided',
          video_title: reportedVideo ? reportedVideo.title : 'Account report',
          video_id: r.video_id,
          status: r.status || 'open',
          resolution_notes: r.resolution || '',
          created_at: r.created_at
        };
      });

      // Map settings
      const mappedSettings = {};
      if (settingsData && settingsData.length > 0) {
        settingsData.forEach(item => {
          mappedSettings[item.key] = item.value;
        });
      } else {
        mappedSettings.maintenance_mode = false;
        mappedSettings.registration_enabled = true;
        mappedSettings.max_upload_size_mb = 1000;
        mappedSettings.allowed_formats = ['mp4', 'mov', 'webm'];
        mappedSettings.feed_algorithm = 'trending';
        mappedSettings.platform_name = 'GramMate';
      }

      setUsers(enrichedUsers);
      setVideos(enrichedVideos);
      setReports(enrichedReports);
      setCreators(verificationsData || []);
      setSettings(mappedSettings);
      setNotifications(notificationsData || []);
      setLogs(logsData || []);
      setFallbackMode(false);
      setDbHealth('healthy');
    } catch (err) {
      console.warn('[AdminDashboard] Live fetch failed, activating mock local storage:', err.message);
      setFallbackMode(true);
      setDbHealth('demo');
      
      // Initialize states from local storage or defaults
      const getLocalOrSeed = (key, defaultGenerator) => {
        const stored = localStorage.getItem(key);
        if (stored) return JSON.parse(stored);
        const seeded = defaultGenerator();
        localStorage.setItem(key, JSON.stringify(seeded));
        return seeded;
      };

      const seeds = generateMockData();
      setUsers(getLocalOrSeed('gm_admin_fallback_users', () => seeds.users));
      setVideos(getLocalOrSeed('gm_admin_fallback_videos', () => seeds.videos));
      setReports(getLocalOrSeed('gm_admin_fallback_reports', () => seeds.reports));
      setCreators(getLocalOrSeed('gm_admin_fallback_creators', () => seeds.creators));
      setLogs(getLocalOrSeed('gm_admin_fallback_logs', () => seeds.logs));
      setNotifications(getLocalOrSeed('gm_admin_fallback_notifications', () => seeds.notifications));
      setSettings(getLocalOrSeed('gm_admin_fallback_settings', () => seeds.settings));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Simulate tiny network response fluctuation
    const interval = setInterval(() => {
      setResponseTime(prev => Math.max(30, Math.min(120, prev + Math.floor(Math.random() * 21) - 10)));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Synchronize localStorage when fallbackMode changes local state
  const syncLocal = (key, data) => {
    if (fallbackMode) {
      localStorage.setItem(key, JSON.stringify(data));
    }
  };

  // Add admin log entry (support live supabase database or local fallback)
  const addLog = async (action, affected) => {
    const newLog = {
      id: Math.random().toString(36).substring(2, 9),
      admin_email: user?.email || 'evilmc777@gmail.com',
      action,
      affected_resource: affected,
      ip_address: '192.168.2.88',
      user_agent: navigator.userAgent.substring(0, 100),
      created_at: new Date().toISOString()
    };

    if (!fallbackMode) {
      try {
        await supabase.from('admin_logs').insert({
          admin_email: newLog.admin_email,
          action: newLog.action,
          affected_resource: newLog.affected_resource,
          ip_address: newLog.ip_address,
          user_agent: newLog.user_agent
        });
      } catch (e) {
        console.error('Failed to insert audit log in Supabase:', e);
      }
    }

    // Always update client-side log list
    setLogs(prev => {
      const updated = [newLog, ...prev];
      syncLocal('gm_admin_fallback_logs', updated);
      return updated;
    });
  };

  // Tab switching helper
  const tabs = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'users', name: 'User Management', icon: Users, badgeKey: 'usersCount' },
    { id: 'videos', name: 'Video Catalog', icon: Video, badgeKey: 'pendingVideos' },
    { id: 'reports', name: 'Reports Queue', icon: Flag, badgeKey: 'openReports' },
    { id: 'creators', name: 'Creator Status', icon: CheckCircle, badgeKey: 'pendingCreators' },
    { id: 'analytics', name: 'Data Insights', icon: TrendingUp },
    { id: 'notifications', name: 'System Alerts', icon: Bell, badgeKey: 'unreadAlerts' },
    { id: 'settings', name: 'Config Settings', icon: Settings },
    { id: 'logs', name: 'Audit Logs', icon: ClipboardList },
    { id: 'profile', name: 'Admin Profile', icon: User }
  ];

  // Calculated count badges for navigation
  const counts = useMemo(() => {
    return {
      usersCount: users.length,
      pendingVideos: videos.filter(v => v.moderation_status === 'pending').length,
      openReports: reports.filter(r => r.status === 'open').length,
      pendingCreators: creators.filter(c => c.status === 'pending').length,
      unreadAlerts: notifications.filter(n => !n.is_read).length
    };
  }, [users, videos, reports, creators, notifications]);

  // Operations
  const handleToggleBan = async (u) => {
    const updatedBannedState = !u.is_banned;
    const actionLabel = updatedBannedState ? 'Ban user' : 'Unban user';
    
    if (!fallbackMode) {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ is_banned: updatedBannedState })
          .eq('id', u.id);
        if (error) throw error;
      } catch (err) {
        alert('Supabase action failed. Using fallback simulation.');
      }
    }

    const updatedUsers = users.map(userItem => {
      if (userItem.id === u.id) {
        return { ...userItem, is_banned: updatedBannedState };
      }
      return userItem;
    });
    setUsers(updatedUsers);
    syncLocal('gm_admin_fallback_users', updatedUsers);
    await addLog(actionLabel, `User: ${u.username}`);
    
    // Auto-update selectedUser modal state if open
    if (selectedUser && selectedUser.id === u.id) {
      setSelectedUser(prev => ({ ...prev, is_banned: updatedBannedState }));
    }
    
    setActionSuccessMessage(`Successfully updated ban status for @${u.username}`);
    setTimeout(() => setActionSuccessMessage(''), 3000);
  };

  const handleToggleVerified = async (u) => {
    const updatedVerifyState = !u.is_verified;
    const actionLabel = updatedVerifyState ? 'Approve creator verification' : 'Revoke creator status';
    
    if (!fallbackMode) {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ is_verified: updatedVerifyState, role: updatedVerifyState ? 'creator' : 'user' })
          .eq('id', u.id);
        if (error) throw error;
      } catch (err) {
        alert('Supabase action failed.');
      }
    }

    const updatedUsers = users.map(userItem => {
      if (userItem.id === u.id) {
        return { 
          ...userItem, 
          is_verified: updatedVerifyState, 
          role: updatedVerifyState ? 'creator' : 'user' 
        };
      }
      return userItem;
    });
    setUsers(updatedUsers);
    syncLocal('gm_admin_fallback_users', updatedUsers);
    await addLog(actionLabel, `User: ${u.username}`);

    if (selectedUser && selectedUser.id === u.id) {
      setSelectedUser(prev => ({ 
        ...prev, 
        is_verified: updatedVerifyState, 
        role: updatedVerifyState ? 'creator' : 'user' 
      }));
    }

    setActionSuccessMessage(`Manually verified @${u.username} as Creator.`);
    setTimeout(() => setActionSuccessMessage(''), 3000);
  };

  const handleDeleteUser = async (u) => {
    if (!window.confirm(`Are you absolutely sure you want to permanently delete user @${u.username}? This will delete all their videos, balances, and is non-reversible.`)) {
      return;
    }

    if (!fallbackMode) {
      try {
        const { error } = await supabase.from('profiles').delete().eq('id', u.id);
        if (error) throw error;
      } catch (err) {
        alert('Supabase action failed.');
      }
    }

    const updatedUsers = users.filter(userItem => userItem.id !== u.id);
    setUsers(updatedUsers);
    syncLocal('gm_admin_fallback_users', updatedUsers);
    setSelectedUser(null);
    await addLog('Delete user account', `User: ${u.username}`);
  };

  const handleResetUserStats = async (u) => {
    if (!fallbackMode) {
      try {
        // Reset all views/likes on videos by user_id
        const { error } = await supabase
          .from('videos')
          .update({ views: 0, likes: 0 })
          .eq('user_id', u.id);
        if (error) throw error;
      } catch (err) {
        alert('Supabase action failed.');
      }
    }

    // Fallback simulation
    const updatedVideos = videos.map(v => {
      if (v.user_id === u.id) {
        return { ...v, views: 0, likes: 0 };
      }
      return v;
    });
    setVideos(updatedVideos);
    syncLocal('gm_admin_fallback_videos', updatedVideos);

    const updatedUsers = users.map(userItem => {
      if (userItem.id === u.id) {
        return { ...userItem, videos_count: 0 };
      }
      return userItem;
    });
    setUsers(updatedUsers);
    syncLocal('gm_admin_fallback_users', updatedUsers);

    if (selectedUser && selectedUser.id === u.id) {
      setSelectedUser(prev => ({ ...prev, videos_count: 0 }));
    }

    await addLog('Reset user video statistics', `User: ${u.username}`);
    setActionSuccessMessage(`Reset video statistics for @${u.username}.`);
    setTimeout(() => setActionSuccessMessage(''), 3000);
  };

  // Video operations
  const handleToggleVideoFeatured = async (v) => {
    const updatedState = !v.is_featured;
    if (!fallbackMode) {
      try {
        await supabase.from('videos').update({ is_featured: updatedState }).eq('id', v.id);
      } catch (e) {}
    }
    const updatedVideos = videos.map(videoItem => {
      if (videoItem.id === v.id) return { ...videoItem, is_featured: updatedState };
      return videoItem;
    });
    setVideos(updatedVideos);
    syncLocal('gm_admin_fallback_videos', updatedVideos);
    await addLog(updatedState ? 'Feature video' : 'Remove video from featured', `Video: "${v.title}"`);
  };

  const handleToggleVideoTrending = async (v) => {
    const updatedState = !v.is_trending;
    if (!fallbackMode) {
      try {
        await supabase.from('videos').update({ is_trending: updatedState }).eq('id', v.id);
      } catch (e) {}
    }
    const updatedVideos = videos.map(videoItem => {
      if (videoItem.id === v.id) return { ...videoItem, is_trending: updatedState };
      return videoItem;
    });
    setVideos(updatedVideos);
    syncLocal('gm_admin_fallback_videos', updatedVideos);
    await addLog(updatedState ? 'Promote video to trending' : 'Remove video from trending', `Video: "${v.title}"`);
  };

  const handleModerateVideo = async (v, status) => {
    if (!fallbackMode) {
      try {
        await supabase.from('videos').update({ moderation_status: status }).eq('id', v.id);
      } catch (e) {}
    }
    const updatedVideos = videos.map(videoItem => {
      if (videoItem.id === v.id) return { ...videoItem, moderation_status: status };
      return videoItem;
    });
    setVideos(updatedVideos);
    syncLocal('gm_admin_fallback_videos', updatedVideos);
    await addLog(`Set video moderation: ${status}`, `Video: "${v.title}"`);
    
    if (selectedVideo && selectedVideo.id === v.id) {
      setSelectedVideo(prev => ({ ...prev, moderation_status: status }));
    }
  };

  const handleDeleteVideo = async (v) => {
    if (!window.confirm(`Are you sure you want to permanently delete video "${v.title}"?`)) return;
    
    if (!fallbackMode) {
      try {
        await supabase.from('videos').delete().eq('id', v.id);
      } catch (e) {}
    }
    const updatedVideos = videos.filter(videoItem => videoItem.id !== v.id);
    setVideos(updatedVideos);
    syncLocal('gm_admin_fallback_videos', updatedVideos);
    setSelectedVideo(null);
    await addLog('Delete video', `Title: "${v.title}"`);
  };

  // Report operations
  const handleResolveReport = async (reportId, resolutionType) => {
    // resolutionType: 'dismiss' or 'enforce'
    const statusText = 'resolved';
    const noteText = resolutionType === 'dismiss' 
      ? 'Dismissed. Content conforms to safety guidelines.'
      : `Enforced: action [${enforcementAction}] taken. Note: ${enforcementNotes}`;

    if (!fallbackMode) {
      try {
        await supabase
          .from('reports')
          .update({
            status: statusText,
            resolution: noteText,
            resolved_at: new Date().toISOString()
          })
          .eq('id', reportId);
      } catch (e) {}
    }

    // Apply enforcement action on user/video in client side if fallback / simulator
    if (resolutionType === 'enforce') {
      const rep = reports.find(r => r.id === reportId);
      if (rep) {
        if (enforcementAction === 'ban') {
          // find user
          const usr = users.find(u => u.username === rep.reported_username);
          if (usr) {
            handleToggleBan(usr);
          }
        } else if (enforcementAction === 'delete') {
          const vid = videos.find(v => v.id === rep.video_id);
          if (vid) {
            handleDeleteVideo(vid);
          }
        }
      }
    }

    const updatedReports = reports.map(r => {
      if (r.id === reportId) {
        return { ...r, status: statusText, resolution_notes: noteText };
      }
      return r;
    });
    setReports(updatedReports);
    syncLocal('gm_admin_fallback_reports', updatedReports);
    
    await addLog(`Resolve report - ${resolutionType}`, `Report: ${reportId}`);
    setShowEnforceModal(false);
    setSelectedReport(null);
    setEnforcementNotes('');
  };

  // Creator Verification operations
  const handleCreatorApplication = async (creatorApp, action) => {
    // action: 'approved' or 'rejected'
    const updatedStatus = action;
    const finalNotes = creatorNotes || (action === 'approved' ? 'Meets all verification standards.' : 'Application rejected.');

    if (!fallbackMode) {
      try {
        await supabase
          .from('creator_verifications')
          .update({
            status: updatedStatus,
            notes: finalNotes,
            updated_at: new Date().toISOString()
          })
          .eq('id', creatorApp.id);
        
        // Profiles trigger syncs automatically in supabase, but locally we execute it manually
      } catch (e) {}
    }

    const updatedCreators = creators.map(c => {
      if (c.id === creatorApp.id) {
        return { ...c, status: updatedStatus, notes: finalNotes };
      }
      return c;
    });
    setCreators(updatedCreators);
    syncLocal('gm_admin_fallback_creators', updatedCreators);

    // Sync profiles role and is_verified
    const verifiedState = action === 'approved';
    const updatedUsers = users.map(u => {
      if (u.id === creatorApp.user_id) {
        return { ...u, is_verified: verifiedState, role: verifiedState ? 'creator' : 'user' };
      }
      return u;
    });
    setUsers(updatedUsers);
    syncLocal('gm_admin_fallback_users', updatedUsers);

    await addLog(action === 'approved' ? 'Approve creator verification' : 'Reject creator verification', `Applicant: @${creatorApp.username}`);
    setShowCreatorModal(false);
    setCreatorNotes('');
  };

  // Notifications operations
  const handleMarkNotificationRead = async (id) => {
    if (!fallbackMode) {
      try {
        await supabase.from('admin_notifications').update({ is_read: true }).eq('id', id);
      } catch (e) {}
    }
    const updated = notifications.map(n => {
      if (n.id === id) return { ...n, is_read: true };
      return n;
    });
    setNotifications(updated);
    syncLocal('gm_admin_fallback_notifications', updated);
  };

  const handleMarkAllNotificationsRead = async () => {
    if (!fallbackMode) {
      try {
        await supabase.from('admin_notifications').update({ is_read: true }).neq('is_read', true);
      } catch (e) {}
    }
    const updated = notifications.map(n => ({ ...n, is_read: true }));
    setNotifications(updated);
    syncLocal('gm_admin_fallback_notifications', updated);
  };

  const handleClearNotifications = async () => {
    if (!fallbackMode) {
      try {
        await supabase.from('admin_notifications').delete().neq('id', 'placeholder');
      } catch (e) {}
    }
    setNotifications([]);
    syncLocal('gm_admin_fallback_notifications', []);
    await addLog('Clear notifications', 'System notifications log');
  };

  // Settings operations
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    if (!fallbackMode) {
      try {
        // Save each settings record
        for (const [key, value] of Object.entries(settings)) {
          await supabase
            .from('system_settings')
            .upsert({ key, value, updated_at: new Date().toISOString() });
        }
      } catch (err) {
        console.error('Failed to save settings to Supabase', err);
      }
    }
    syncLocal('gm_admin_fallback_settings', settings);
    await addLog('Update system configuration', 'Platform Global Settings');
    setActionSuccessMessage('System configurations saved successfully.');
    setTimeout(() => setActionSuccessMessage(''), 3000);
  };

  // Filters calculation
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchesSearch = u.username.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            u.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = roleFilter === 'all' || u.role === roleFilter;
      const matchesStatus = statusFilter === 'all' || 
                            (statusFilter === 'banned' && u.is_banned) || 
                            (statusFilter === 'verified' && u.is_verified) ||
                            (statusFilter === 'active' && !u.is_banned);
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchQuery, roleFilter, statusFilter]);

  const filteredVideos = useMemo(() => {
    return videos.filter(v => {
      const matchesSearch = v.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            v.username.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || v.category.toLowerCase() === categoryFilter.toLowerCase();
      const matchesStatus = statusFilter === 'all' || v.moderation_status === statusFilter;
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [videos, searchQuery, categoryFilter, statusFilter]);

  const filteredReports = useMemo(() => {
    return reports.filter(r => {
      const matchesSearch = r.reason.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            r.reporter_username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            r.reported_username.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [reports, searchQuery, statusFilter]);

  const filteredLogs = useMemo(() => {
    return logs.filter(l => {
      return l.action.toLowerCase().includes(searchQuery.toLowerCase()) || 
             l.admin_email.toLowerCase().includes(searchQuery.toLowerCase()) || 
             l.affected_resource.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [logs, searchQuery]);

  // Analytics Chart configuration (mocking data and custom rendering via beautiful SVG)
  const [analyticsType, setAnalyticsType] = useState('growth'); // growth, uploads, categories, watchtime
  const [analyticsTimeframe, setAnalyticsTimeframe] = useState('7d');

  const analyticsData = useMemo(() => {
    if (analyticsTimeframe === '7d') {
      return {
        growth: [
          { label: 'Mon', value: 120 }, { label: 'Tue', value: 145 }, { label: 'Wed', value: 132 },
          { label: 'Thu', value: 195 }, { label: 'Fri', value: 240 }, { label: 'Sat', value: 310 }, { label: 'Sun', value: 388 }
        ],
        uploads: [
          { label: 'Mon', value: 12 }, { label: 'Tue', value: 19 }, { label: 'Wed', value: 15 },
          { label: 'Thu', value: 25 }, { label: 'Fri', value: 32 }, { label: 'Sat', value: 48 }, { label: 'Sun', value: 55 }
        ],
        categories: [
          { label: 'Dance', value: 45, color: '#5A52E6' },
          { label: 'Gaming', value: 25, color: '#3B82F6' },
          { label: 'Music', value: 18, color: '#10B981' },
          { label: 'Comedy', value: 12, color: '#F59E0B' }
        ],
        watchtime: [
          { label: 'Mon', value: 2200 }, { label: 'Tue', value: 2500 }, { label: 'Wed', value: 2400 },
          { label: 'Thu', value: 3100 }, { label: 'Fri', value: 3600 }, { label: 'Sat', value: 4200 }, { label: 'Sun', value: 5100 }
        ]
      };
    } else {
      return {
        growth: [
          { label: 'Jan', value: 450 }, { label: 'Feb', value: 680 }, { label: 'Mar', value: 890 },
          { label: 'Apr', value: 1100 }, { label: 'May', value: 1540 }, { label: 'Jun', value: 2300 }
        ],
        uploads: [
          { label: 'Jan', value: 110 }, { label: 'Feb', value: 150 }, { label: 'Mar', value: 180 },
          { label: 'Apr', value: 220 }, { label: 'May', value: 310 }, { label: 'Jun', value: 480 }
        ],
        categories: [
          { label: 'Dance', value: 45, color: '#5A52E6' },
          { label: 'Gaming', value: 25, color: '#3B82F6' },
          { label: 'Music', value: 18, color: '#10B981' },
          { label: 'Comedy', value: 12, color: '#F59E0B' }
        ],
        watchtime: [
          { label: 'Jan', value: 18000 }, { label: 'Feb', value: 22000 }, { label: 'Mar', value: 29000 },
          { label: 'Apr', value: 35000 }, { label: 'May', value: 47000 }, { label: 'Jun', value: 68000 }
        ]
      };
    }
  }, [analyticsTimeframe]);

  // SVG Chart Generators
  const renderSVGLineChart = (data) => {
    const values = data.map(d => d.value);
    const maxVal = Math.max(...values) * 1.15;
    const minVal = Math.min(...values) * 0.85;
    const range = maxVal - minVal;
    
    const width = 500;
    const height = 200;
    const padding = 30;
    
    const points = data.map((d, index) => {
      const x = padding + (index * (width - padding * 2) / (data.length - 1));
      const y = height - padding - ((d.value - minVal) / range * (height - padding * 2));
      return { x, y, label: d.label, val: d.value };
    });

    const pathD = points.reduce((path, p, i) => {
      return i === 0 ? `M ${p.x} ${p.y}` : `${path} L ${p.x} ${p.y}`;
    }, '');

    const areaD = points.length > 0 
      ? `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z` 
      : '';

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-64 overflow-visible">
        <defs>
          <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--gm-brand)" stopOpacity="0.4" />
            <stop offset="100%" stopColor="var(--gm-brand)" stopOpacity="0.0" />
          </linearGradient>
        </defs>
        
        {/* Horizontal gridlines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
          const y = padding + ratio * (height - padding * 2);
          const gridVal = Math.round(maxVal - ratio * range);
          return (
            <g key={index} className="opacity-20">
              <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="currentColor" strokeWidth="1" strokeDasharray="3,3" />
              <text x={padding - 5} y={y + 4} textAnchor="end" className="text-[10px] fill-slate-400 font-mono">{gridVal}</text>
            </g>
          );
        })}

        {/* Shaded Area */}
        <path d={areaD} fill="url(#chartGrad)" />

        {/* Line Path */}
        <path d={pathD} fill="none" stroke="var(--gm-brand)" strokeWidth="2.5" strokeLinecap="round" />

        {/* Data points */}
        {points.map((p, index) => (
          <g key={index} className="group cursor-pointer">
            <circle cx={p.x} cy={p.y} r="4" className="fill-[#131129] stroke-[var(--gm-brand)] stroke-2 group-hover:r-6 transition-all" />
            
            {/* Tooltip on hover */}
            <g className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <rect x={p.x - 30} y={p.y - 32} width="60" height="20" rx="4" fill="#1B1936" stroke="var(--gm-brand)" strokeWidth="1" />
              <text x={p.x} y={p.y - 18} textAnchor="middle" className="fill-white text-[9px] font-semibold font-mono">{p.val}</text>
            </g>

            {/* X Axis Labels */}
            <text x={p.x} y={height - 10} textAnchor="middle" className="text-[10px] fill-slate-400 font-medium">{p.label}</text>
          </g>
        ))}
      </svg>
    );
  };

  const renderSVGBarChart = (data) => {
    const values = data.map(d => d.value);
    const maxVal = Math.max(...values) * 1.1;
    const width = 500;
    const height = 200;
    const padding = 30;
    
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    const barWidth = (chartWidth / data.length) * 0.6;
    const gap = (chartWidth / data.length) * 0.4;

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-64 overflow-visible">
        {/* Horizontal gridlines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
          const y = padding + ratio * chartHeight;
          const gridVal = Math.round(maxVal - ratio * maxVal);
          return (
            <g key={index} className="opacity-20">
              <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="currentColor" strokeWidth="1" />
              <text x={padding - 5} y={y + 4} textAnchor="end" className="text-[10px] fill-slate-400 font-mono">{gridVal}</text>
            </g>
          );
        })}

        {/* Bars */}
        {data.map((d, index) => {
          const barHeight = (d.value / maxVal) * chartHeight;
          const x = padding + index * (barWidth + gap) + gap/2;
          const y = height - padding - barHeight;

          return (
            <g key={index} className="group cursor-pointer">
              <rect 
                x={x} 
                y={y} 
                width={barWidth} 
                height={barHeight} 
                rx="3" 
                className="fill-[var(--gm-brand-light)] opacity-85 group-hover:opacity-100 group-hover:fill-[var(--gm-brand)] transition-all" 
              />
              {/* Tooltip */}
              <text 
                x={x + barWidth/2} 
                y={y - 8} 
                textAnchor="middle" 
                className="opacity-0 group-hover:opacity-100 fill-white text-[9px] font-bold font-mono transition-opacity pointer-events-none"
              >
                {d.value}
              </text>
              {/* Label */}
              <text x={x + barWidth/2} y={height - 10} textAnchor="middle" className="text-[10px] fill-slate-400 font-medium">{d.label}</text>
            </g>
          );
        })}
      </svg>
    );
  };

  const renderSVGDonutChart = (data) => {
    const total = data.reduce((sum, d) => sum + d.value, 0);
    const width = 200;
    const height = 200;
    const radius = 60;
    const strokeWidth = 18;
    const circ = 2 * Math.PI * radius;
    
    let accumulatedPercent = 0;

    return (
      <div className="flex flex-col md:flex-row items-center justify-around gap-6 p-4">
        <svg width={width} height={height} className="transform -rotate-90 overflow-visible">
          <circle cx={width/2} cy={height/2} r={radius} fill="none" stroke="#1B1936" strokeWidth={strokeWidth} />
          {data.map((d, index) => {
            const pct = d.value / total;
            const strokeDasharray = `${pct * circ} ${circ}`;
            const strokeDashoffset = -accumulatedPercent * circ;
            accumulatedPercent += pct;

            return (
              <circle
                key={index}
                cx={width/2}
                cy={height/2}
                r={radius}
                fill="none"
                stroke={d.color}
                strokeWidth={strokeWidth}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-500 hover:stroke-[22px] cursor-pointer"
                title={`${d.label}: ${d.value}%`}
              />
            );
          })}
          {/* Inner Text label */}
          <g transform={`rotate(90 ${width/2} ${height/2})`} className="pointer-events-none">
            <text x={width/2} y={height/2 - 2} textAnchor="middle" className="fill-white text-base font-bold font-sans">100%</text>
            <text x={width/2} y={height/2 + 12} textAnchor="middle" className="fill-slate-400 text-[9px] uppercase tracking-wider">Video Split</text>
          </g>
        </svg>

        {/* Legend */}
        <div className="space-y-2">
          {data.map((d, index) => (
            <div key={index} className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
              <span className="text-slate-300 text-xs font-medium">{d.label}</span>
              <span className="text-slate-500 text-xs font-mono">({d.value}%)</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0B0A19] text-slate-100 flex font-sans antialiased overflow-x-hidden selection:bg-[var(--gm-brand)]/30 selection:text-white">
      {/* BACKGROUND EFFECTS */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[var(--gm-brand)]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[var(--gm-accent)]/3 rounded-full blur-[120px] pointer-events-none" />

      {/* SIDEBAR */}
      <aside 
        className={`bg-[#0F0D24] border-r border-white/5 flex flex-col justify-between transition-all duration-300 relative z-30 shrink-0 ${
          sidebarCollapsed ? 'w-[72px]' : 'w-64'
        }`}
      >
        <div>
          {/* Logo Section */}
          <div className="p-5 flex items-center gap-3 border-b border-white/5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--gm-brand)] to-[var(--gm-brand-dark)] flex items-center justify-center shadow-lg shadow-[var(--gm-brand)]/10 shrink-0">
              <Shield className="w-5 h-5 text-white" />
            </div>
            {!sidebarCollapsed && (
              <div className="flex flex-col">
                <span className="font-bold text-sm text-white tracking-wide">GramMate</span>
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider font-mono">Admin Hub</span>
              </div>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1.5">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const hasBadge = tab.badgeKey && counts[tab.badgeKey] > 0;

              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setSearchQuery('');
                    setRoleFilter('all');
                    setCategoryFilter('all');
                    setStatusFilter('all');
                  }}
                  className={`w-full group relative flex items-center rounded-xl p-2.5 text-xs font-semibold tracking-wide transition-all ${
                    isActive
                      ? 'bg-[var(--gm-brand)] text-white shadow-md shadow-[var(--gm-brand)]/15'
                      : 'text-slate-400 hover:bg-[#1B1936] hover:text-white'
                  }`}
                  title={sidebarCollapsed ? tab.name : undefined}
                >
                  <Icon className={`w-4 h-4 shrink-0 transition-transform ${sidebarCollapsed ? 'mx-auto' : 'mr-3'}`} />
                  
                  {!sidebarCollapsed && (
                    <span className="truncate">{tab.name}</span>
                  )}

                  {/* Badges */}
                  {hasBadge && (
                    sidebarCollapsed ? (
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
                    ) : (
                      <span className={`ml-auto px-1.5 py-0.5 rounded-md text-[10px] font-bold font-mono ${
                        isActive ? 'bg-white/20 text-white' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                      }`}>
                        {counts[tab.badgeKey]}
                      </span>
                    )
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Collapse Toggle */}
        <div className="p-3 border-t border-white/5">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full flex items-center justify-center p-2 rounded-xl bg-[#1B1936] hover:bg-[#25224A] text-slate-400 hover:text-white transition-all"
          >
            {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : (
              <div className="flex items-center gap-2">
                <ChevronLeft className="w-4 h-4" />
                <span className="text-xs font-semibold">Collapse Side</span>
              </div>
            )}
          </button>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <main className="flex-1 min-w-0 flex flex-col min-h-screen relative z-10">
        
        {/* WARNING Fallback Mode Banner */}
        {fallbackMode && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 px-6 py-2.5 text-xs text-amber-400 flex items-center gap-2 font-medium">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>
              <strong>Supabase Database Check Warning:</strong> Operating in Demo Mode with Mock Local Storage. Apply database migrations to connect live PostgREST entities.
            </span>
            <button 
              onClick={loadData}
              className="ml-auto flex items-center gap-1.5 px-2 py-0.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded font-bold transition-all uppercase tracking-wider font-mono text-[9px]"
            >
              <RefreshCw className="w-2.5 h-2.5" /> Reconnect
            </button>
          </div>
        )}

        {/* TOP BAR / HEADER */}
        <header className="h-16 border-b border-white/5 px-6 flex items-center justify-between shrink-0 bg-[#0F0D24]/85 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-base text-white tracking-tight capitalize">
              {activeTab === 'creators' ? 'Creator Verifications' : activeTab}
            </h2>
            <span className="text-slate-500 text-xs font-mono font-medium">/</span>
            <span className="text-slate-400 text-xs font-medium font-mono uppercase">
              {fallbackMode ? 'Demo Workspace' : 'Supabase Live'}
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Database Timing Stats */}
            <div className="hidden sm:flex items-center gap-4 border-r border-white/5 pr-4 text-slate-400 text-xs font-mono">
              <div className="flex items-center gap-1.5">
                <Database className={`w-3.5 h-3.5 ${dbHealth === 'healthy' ? 'text-green-400' : 'text-amber-400'}`} />
                <span>DB: {dbHealth === 'healthy' ? 'Online' : 'Mock'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                <span>Ping: {responseTime}ms</span>
              </div>
            </div>

            {/* Quick Profile Info */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[var(--gm-brand)] flex items-center justify-center font-bold text-white text-xs select-none">
                E
              </div>
              <div className="hidden md:flex flex-col text-left">
                <span className="text-xs font-semibold text-white">Administrator</span>
                <span className="text-[10px] text-slate-400 font-mono font-medium">{user?.email || 'evilmc777@gmail.com'}</span>
              </div>
            </div>
          </div>
        </header>

        {/* CONTENT PANELS */}
        <div className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl w-full mx-auto pb-24">
          
          {/* Action Success Alerts banner */}
          {actionSuccessMessage && (
            <div className="mb-6 p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-semibold flex items-center gap-2 animate-pulse">
              <Check className="w-4 h-4" />
              <span>{actionSuccessMessage}</span>
            </div>
          )}

          {/* TAB 1: DASHBOARD VIEW */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* KPI Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { title: 'Total Registered Users', value: users.length, icon: Users, color: 'text-indigo-400' },
                  { title: 'Moderated Videos', value: videos.length, icon: Video, color: 'text-blue-400' },
                  { title: 'Pending Reports', value: counts.openReports, icon: Flag, color: 'text-red-400', isAlert: counts.openReports > 0 },
                  { title: 'Creator Requests', value: counts.pendingCreators, icon: CheckCircle, color: 'text-emerald-400' }
                ].map((kpi, idx) => {
                  const Icon = kpi.icon;
                  return (
                    <div key={idx} className="bg-[#131129] border border-white/5 rounded-xl p-5 hover:border-white/10 transition-all flex items-center justify-between">
                      <div>
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{kpi.title}</span>
                        <div className="text-2xl font-bold text-white mt-1.5 font-mono">{kpi.value}</div>
                      </div>
                      <div className={`p-3 rounded-lg bg-white/5 border border-white/5 ${kpi.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Status and Health checks panel */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Connection Health Card */}
                <div className="bg-[#131129] border border-white/5 rounded-xl p-6 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-white mb-4">Core Infrastructure Status</h3>
                    <div className="space-y-3.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Firebase Authenticator</span>
                        <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" /> Operational
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Supabase API Gateway</span>
                        <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" /> Operational
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Database Engine (PostgreSQL)</span>
                        <span className={`${fallbackMode ? 'text-amber-400' : 'text-emerald-400'} font-bold flex items-center gap-1.5`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${fallbackMode ? 'bg-amber-400' : 'bg-emerald-500'}`} /> 
                          {fallbackMode ? 'Sandboxed Mock' : 'Online'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Server response latency</span>
                        <span className="text-indigo-400 font-bold font-mono">{responseTime}ms</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-white/5 flex gap-2">
                    <button 
                      onClick={loadData}
                      className="flex-1 py-2 rounded-lg bg-[#1B1936] hover:bg-[#25224A] border border-white/5 text-slate-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Full Diagnostic Run
                    </button>
                  </div>
                </div>

                {/* SVG Response timing graph */}
                <div className="bg-[#131129] border border-white/5 rounded-xl p-6 lg:col-span-2">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-sm text-white">Operational Timing Monitor</h3>
                      <p className="text-[11px] text-slate-400">Live transaction processing latency tracker.</p>
                    </div>
                    <span className="text-xs font-semibold text-indigo-400 font-mono">Avg: 51ms</span>
                  </div>
                  {renderSVGLineChart([
                    { label: '10:00', value: 45 }, { label: '10:05', value: 50 },
                    { label: '10:10', value: 38 }, { label: '10:15', value: 72 },
                    { label: '10:20', value: 55 }, { label: '10:25', value: 42 },
                    { label: '10:30', value: responseTime }
                  ])}
                </div>
              </div>

              {/* Recent Activity Logs Preview */}
              <div className="bg-[#131129] border border-white/5 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-sm text-white">Recent Security Logs</h3>
                  <button 
                    onClick={() => setActiveTab('logs')}
                    className="text-xs font-semibold text-[var(--gm-accent-light)] hover:text-white transition-all flex items-center gap-1"
                  >
                    View All Audit Trail <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
                <div className="divide-y divide-white/5 font-mono text-xs">
                  {logs.slice(0, 4).map((log, idx) => (
                    <div key={idx} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-start gap-3">
                        <span className="text-slate-500 shrink-0">{new Date(log.created_at).toLocaleTimeString()}</span>
                        <div>
                          <span className="text-indigo-300 font-semibold">@{log.admin_email}</span>
                          <span className="text-slate-400 mx-1.5">executed</span>
                          <span className="text-white font-medium">{log.action}</span>
                          <span className="text-slate-500 mx-1.5">on</span>
                          <span className="text-slate-300 italic">{log.affected_resource}</span>
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-500 bg-white/5 border border-white/5 px-2 py-0.5 rounded sm:self-center">
                        {log.ip_address}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: USER MANAGEMENT VIEW */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              {/* Search & filters bar */}
              <div className="flex flex-col sm:flex-row gap-4 bg-[#131129] border border-white/5 rounded-xl p-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    type="text"
                    placeholder="Search by username or email..."
                    className="w-full pl-9 pr-4 py-2 bg-[#0B0A19] border border-white/5 rounded-lg text-xs placeholder:text-slate-500 text-white focus:outline-none focus:border-[var(--gm-brand)] transition-all font-mono"
                  />
                </div>
                <div className="flex gap-2">
                  <div className="relative">
                    <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
                    <select
                      value={roleFilter}
                      onChange={(e) => setRoleFilter(e.target.value)}
                      className="pl-8 pr-6 py-2 bg-[#0B0A19] border border-white/5 rounded-lg text-xs font-semibold text-slate-300 focus:outline-none focus:border-[var(--gm-brand)] cursor-pointer"
                    >
                      <option value="all">All Roles</option>
                      <option value="user">Standard User</option>
                      <option value="creator">Creator</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </div>
                  <div className="relative">
                    <Sliders className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="pl-8 pr-6 py-2 bg-[#0B0A19] border border-white/5 rounded-lg text-xs font-semibold text-slate-300 focus:outline-none focus:border-[var(--gm-brand)] cursor-pointer"
                    >
                      <option value="all">All Status</option>
                      <option value="active">Active Only</option>
                      <option value="banned">Banned Only</option>
                      <option value="verified">Verified Only</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Users Table */}
              <div className="bg-[#131129] border border-white/5 rounded-xl overflow-hidden shadow-2xl">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 bg-[#0F0D24]/50 text-slate-400 text-[10px] font-bold uppercase tracking-wider font-mono">
                      <th className="p-4">Username</th>
                      <th className="p-4">Email</th>
                      <th className="p-4">Role</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Joined Date</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-xs">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="p-8 text-center text-slate-500 italic">No users found matching filters.</td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-[#1B1936]/40 transition-colors">
                          <td className="p-4 font-semibold text-white font-mono">
                            <button
                              onClick={() => setSelectedUser(u)}
                              className="hover:underline text-[var(--gm-accent-light)] text-left"
                            >
                              @{u.username}
                            </button>
                          </td>
                          <td className="p-4 text-slate-400 font-mono">{u.email}</td>
                          <td className="p-4 capitalize">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono border ${
                              u.role === 'admin' 
                                ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                                : u.role === 'creator'
                                  ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                  : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                            }`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="p-4">
                            {u.is_banned ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-red-500/10 text-red-400 border border-red-500/20">Banned</span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-green-500/10 text-green-400 border border-green-500/20">Active</span>
                            )}
                            {u.is_verified && (
                              <span className="ml-1.5 px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Verified</span>
                            )}
                          </td>
                          <td className="p-4 text-slate-500 font-mono">{new Date(u.created_at).toLocaleDateString()}</td>
                          <td className="p-4 text-right">
                            <div className="flex gap-2 justify-end">
                              {u.role !== 'admin' && (
                                <>
                                  <button
                                    onClick={() => handleToggleBan(u)}
                                    className={`p-1.5 rounded-lg border text-xs font-semibold transition-all ${
                                      u.is_banned 
                                        ? 'bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20'
                                        : 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20'
                                    }`}
                                    title={u.is_banned ? 'Unban User' : 'Ban User'}
                                  >
                                    {u.is_banned ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                                  </button>

                                  <button
                                    onClick={() => handleToggleVerified(u)}
                                    className={`p-1.5 rounded-lg border text-xs font-semibold transition-all ${
                                      u.is_verified
                                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20'
                                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                                    }`}
                                    title={u.is_verified ? 'Revoke Verification' : 'Manually Verify'}
                                  >
                                    {u.is_verified ? <X className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
                                  </button>

                                  <button
                                    onClick={() => handleDeleteUser(u)}
                                    className="p-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all"
                                    title="Delete User Account"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: VIDEOS CATALOG MODERATION VIEW */}
          {activeTab === 'videos' && (
            <div className="space-y-6">
              {/* Filter controls */}
              <div className="flex flex-col sm:flex-row gap-4 bg-[#131129] border border-white/5 rounded-xl p-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    type="text"
                    placeholder="Search videos by title or creator..."
                    className="w-full pl-9 pr-4 py-2 bg-[#0B0A19] border border-white/5 rounded-lg text-xs placeholder:text-slate-500 text-white focus:outline-none focus:border-[var(--gm-brand)] transition-all font-mono"
                  />
                </div>
                <div className="flex gap-2">
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="px-4 py-2 bg-[#0B0A19] border border-white/5 rounded-lg text-xs font-semibold text-slate-300 focus:outline-none focus:border-[var(--gm-brand)] cursor-pointer"
                  >
                    <option value="all">All Categories</option>
                    <option value="dance">Dance</option>
                    <option value="music">Music</option>
                    <option value="gaming">Gaming</option>
                    <option value="finance">Finance</option>
                    <option value="nature">Nature</option>
                  </select>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2 bg-[#0B0A19] border border-white/5 rounded-lg text-xs font-semibold text-slate-300 focus:outline-none focus:border-[var(--gm-brand)] cursor-pointer font-mono"
                  >
                    <option value="all">All Status</option>
                    <option value="approved">Approved</option>
                    <option value="pending">Pending Queue</option>
                    <option value="flagged">Flagged</option>
                  </select>
                </div>
              </div>

              {/* Videos Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredVideos.length === 0 ? (
                  <div className="col-span-full bg-[#131129] border border-white/5 rounded-xl p-8 text-center text-slate-500 italic">No videos match criteria.</div>
                ) : (
                  filteredVideos.map((v) => (
                    <div key={v.id} className="bg-[#131129] border border-white/5 rounded-xl overflow-hidden flex flex-col justify-between hover:border-white/10 transition-all shadow-lg">
                      <div>
                        {/* Video Thumbnail placeholder */}
                        <div 
                          className="h-44 w-full relative flex items-center justify-center cursor-pointer group"
                          onClick={() => setSelectedVideo(v)}
                        >
                          <div className="absolute inset-0 opacity-80" style={{ background: v.thumbnail_url }} />
                          <div className="absolute inset-0 bg-[#000]/30 group-hover:bg-[#000]/50 transition-all" />
                          <div className="absolute top-3 left-3 flex gap-1.5">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold font-mono border uppercase ${
                              v.moderation_status === 'approved'
                                ? 'bg-green-500/10 text-green-400 border-green-500/20'
                                : v.moderation_status === 'pending'
                                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                  : 'bg-red-500/10 text-red-400 border-red-500/20'
                            }`}>
                              {v.moderation_status}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[9px] font-bold font-mono bg-black/60 text-slate-300">
                              {v.category}
                            </span>
                          </div>

                          {/* Quick indicators */}
                          <div className="absolute top-3 right-3 flex gap-1">
                            {v.is_featured && <Sparkles className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />}
                            {v.is_trending && <TrendingUp className="w-3.5 h-3.5 text-red-400" />}
                          </div>

                          <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                          </div>
                        </div>

                        {/* Title and metadata */}
                        <div className="p-4">
                          <h4 className="font-bold text-xs text-white truncate line-clamp-1">{v.title}</h4>
                          <span className="text-[10px] text-[var(--gm-accent-light)] font-mono block mt-1">@{v.username}</span>
                          
                          <div className="flex gap-4 mt-3 text-[10px] text-slate-500 font-mono">
                            <span>Views: {v.views.toLocaleString()}</span>
                            <span>Likes: {v.likes.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                      {/* Video Actions Footer */}
                      <div className="p-3 bg-[#0F0D24]/40 border-t border-white/5 flex gap-2 justify-between">
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => handleToggleVideoFeatured(v)}
                            className={`p-1.5 rounded-lg border transition-all ${
                              v.is_featured 
                                ? 'bg-amber-500/15 border-amber-500/25 text-amber-400' 
                                : 'bg-[#1B1936] border-white/5 text-slate-400 hover:text-white'
                            }`}
                            title="Feature Video"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleToggleVideoTrending(v)}
                            className={`p-1.5 rounded-lg border transition-all ${
                              v.is_trending
                                ? 'bg-red-500/15 border-red-500/25 text-red-400' 
                                : 'bg-[#1B1936] border-white/5 text-slate-400 hover:text-white'
                            }`}
                            title="Set Trending"
                          >
                            <TrendingUp className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="flex gap-1.5">
                          {v.moderation_status !== 'approved' && (
                            <button
                              onClick={() => handleModerateVideo(v, 'approved')}
                              className="px-2.5 py-1 rounded bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 text-[10px] font-bold uppercase transition-all"
                            >
                              Approve
                            </button>
                          )}
                          {v.moderation_status !== 'flagged' && (
                            <button
                              onClick={() => handleModerateVideo(v, 'flagged')}
                              className="px-2.5 py-1 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-[10px] font-bold uppercase transition-all"
                            >
                              Flag
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteVideo(v)}
                            className="p-1.5 rounded bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/25 text-[10px] font-bold transition-all"
                            title="Delete Video"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 4: MODERATION REPORTS QUEUE VIEW */}
          {activeTab === 'reports' && (
            <div className="space-y-6">
              <div className="bg-[#131129] border border-white/5 rounded-xl p-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    type="text"
                    placeholder="Search reports by reasons or accounts..."
                    className="w-full pl-9 pr-4 py-2 bg-[#0B0A19] border border-white/5 rounded-lg text-xs placeholder:text-slate-500 text-white focus:outline-none focus:border-[var(--gm-brand)] transition-all font-mono"
                  />
                </div>
              </div>

              {/* Reports table */}
              <div className="bg-[#131129] border border-white/5 rounded-xl overflow-hidden shadow-2xl">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 bg-[#0F0D24]/50 text-slate-400 text-[10px] font-bold uppercase tracking-wider font-mono">
                      <th className="p-4">Reporter</th>
                      <th className="p-4">Accused User</th>
                      <th className="p-4">Report Details / Reason</th>
                      <th className="p-4">Associated Content</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-xs">
                    {filteredReports.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="p-8 text-center text-slate-500 italic">No reports queue pending review.</td>
                      </tr>
                    ) : (
                      filteredReports.map((r) => (
                        <tr key={r.id} className="hover:bg-[#1B1936]/40 transition-colors">
                          <td className="p-4 font-mono font-semibold text-slate-300">@{r.reporter_username}</td>
                          <td className="p-4 font-mono font-bold text-red-400">@{r.reported_username}</td>
                          <td className="p-4 text-slate-300 max-w-xs truncate">{r.reason}</td>
                          <td className="p-4 text-slate-400 truncate max-w-xs font-mono">{r.video_title}</td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono border capitalize ${
                              r.status === 'open' 
                                ? 'bg-red-500/10 text-red-400 border-red-500/20' 
                                : 'bg-green-500/10 text-green-400 border-green-500/20'
                            }`}>
                              {r.status}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            {r.status === 'open' ? (
                              <div className="flex gap-2 justify-end">
                                <button
                                  onClick={() => handleResolveReport(r.id, 'dismiss')}
                                  className="px-2.5 py-1 rounded bg-[#1B1936] hover:bg-[#25224A] text-slate-300 hover:text-white border border-white/5 text-[10px] font-bold uppercase transition-all"
                                >
                                  Dismiss
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedReport(r);
                                    setShowEnforceModal(true);
                                  }}
                                  className="px-2.5 py-1 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-[10px] font-bold uppercase transition-all"
                                >
                                  Enforce
                                </button>
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-500 font-mono italic">Resolved</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: CREATOR VERIFICATION APPLICATIONS */}
          {activeTab === 'creators' && (
            <div className="space-y-6">
              <div className="bg-[#131129] border border-white/5 rounded-xl overflow-hidden shadow-2xl">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 bg-[#0F0D24]/50 text-slate-400 text-[10px] font-bold uppercase tracking-wider font-mono">
                      <th className="p-4">Applicant</th>
                      <th className="p-4">Email</th>
                      <th className="p-4">Submission Document</th>
                      <th className="p-4">Notes</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Verification Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-xs">
                    {creators.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="p-8 text-center text-slate-500 italic">No verification requests.</td>
                      </tr>
                    ) : (
                      creators.map((c) => (
                        <tr key={c.id} className="hover:bg-[#1B1936]/40 transition-colors">
                          <td className="p-4 font-mono font-bold text-white">@{c.username}</td>
                          <td className="p-4 font-mono text-slate-400">{c.email}</td>
                          <td className="p-4 text-indigo-400 font-mono">
                            <span className="flex items-center gap-1.5 hover:underline cursor-pointer">
                              <FileText className="w-4 h-4" /> {c.document_type} (Simulation Scan)
                            </span>
                          </td>
                          <td className="p-4 text-slate-400 max-w-xs truncate">{c.notes}</td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono border capitalize ${
                              c.status === 'pending'
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                : c.status === 'approved'
                                  ? 'bg-green-500/10 text-green-400 border-green-500/20'
                                  : 'bg-red-500/10 text-red-400 border-red-500/20'
                            }`}>
                              {c.status}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            {c.status === 'pending' ? (
                              <div className="flex gap-2 justify-end">
                                <button
                                  onClick={() => {
                                    setSelectedUser(c);
                                    setShowCreatorModal(true);
                                  }}
                                  className="px-2.5 py-1 rounded bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 text-[10px] font-bold uppercase transition-all"
                                >
                                  Process App
                                </button>
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-500 font-mono italic">Closed</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 6: DATA INSIGHTS / ANALYTICS */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              {/* Analytics Header Switchers */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#131129] border border-white/5 rounded-xl p-4">
                <div className="flex gap-2">
                  {[
                    { id: 'growth', label: 'User Growth' },
                    { id: 'uploads', label: 'Video Uploads' },
                    { id: 'categories', label: 'Category Distribution' },
                    { id: 'watchtime', label: 'Average Watch Time' }
                  ].map(btn => (
                    <button
                      key={btn.id}
                      onClick={() => setAnalyticsType(btn.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        analyticsType === btn.id
                          ? 'bg-[var(--gm-brand)] text-white'
                          : 'bg-[#1B1936] text-slate-400 hover:text-white border border-white/5'
                      }`}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>

                <div className="flex gap-2">
                  {['7d', '6m'].map(tf => (
                    <button
                      key={tf}
                      onClick={() => setAnalyticsTimeframe(tf)}
                      className={`px-2.5 py-1 rounded text-[10px] font-bold font-mono uppercase transition-all ${
                        analyticsTimeframe === tf
                          ? 'bg-slate-300 text-[#0B0A19]'
                          : 'bg-[#1B1936] text-slate-400 hover:text-white'
                      }`}
                    >
                      {tf === '7d' ? '7 Days' : '6 Months'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic SVG Chart render */}
              <div className="bg-[#131129] border border-white/5 rounded-xl p-6 shadow-2xl">
                <h3 className="font-bold text-sm text-white mb-2 capitalize">
                  {analyticsType === 'growth' ? 'Total Platform Registrations' :
                   analyticsType === 'uploads' ? 'Daily Video Upload Counts' :
                   analyticsType === 'categories' ? 'Creative Content Category Share' :
                   'Total Accumulated Watch Minutes'}
                </h3>
                <p className="text-xs text-slate-400 mb-6">
                  {analyticsTimeframe === '7d' ? 'Recent 7 days transactional analytics data feed.' : 'Aggregate database query logs over past 6 months.'}
                </p>

                {analyticsType === 'growth' && renderSVGLineChart(analyticsData.growth)}
                {analyticsType === 'uploads' && renderSVGBarChart(analyticsData.uploads)}
                {analyticsType === 'categories' && renderSVGDonutChart(analyticsData.categories)}
                {analyticsType === 'watchtime' && renderSVGLineChart(analyticsData.watchtime)}
              </div>
            </div>
          )}

          {/* TAB 7: NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-[#131129] border border-white/5 rounded-xl p-4">
                <span className="text-xs font-semibold text-slate-400">
                  {counts.unreadAlerts} Unread Alerts Pending Review
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={handleMarkAllNotificationsRead}
                    className="px-3 py-1.5 rounded bg-[#1B1936] hover:bg-[#25224A] text-slate-300 hover:text-white border border-white/5 text-[10px] font-bold uppercase transition-all"
                  >
                    Mark All Read
                  </button>
                  <button
                    onClick={handleClearNotifications}
                    className="px-3 py-1.5 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-[10px] font-bold uppercase transition-all"
                  >
                    Clear All Alerts
                  </button>
                </div>
              </div>

              {/* Notification list */}
              <div className="space-y-3">
                {notifications.length === 0 ? (
                  <div className="bg-[#131129] border border-white/5 rounded-xl p-8 text-center text-slate-500 italic">No admin notifications logs available.</div>
                ) : (
                  notifications.map((n) => (
                    <div 
                      key={n.id} 
                      className={`bg-[#131129] border border-white/5 rounded-xl p-4 flex items-start gap-4 transition-all ${
                        !n.is_read ? 'border-l-2 border-l-[var(--gm-brand)]' : ''
                      }`}
                    >
                      <div className={`p-2.5 rounded-lg shrink-0 ${
                        n.type === 'report' 
                          ? 'bg-red-500/10 text-red-400'
                          : n.type === 'verification_request'
                            ? 'bg-indigo-500/10 text-indigo-400'
                            : 'bg-amber-500/10 text-amber-400'
                      }`}>
                        <Bell className="w-4 h-4" />
                      </div>

                      <div className="flex-1">
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="font-bold text-xs text-white">{n.title}</h4>
                          <span className="text-[10px] text-slate-500 font-mono font-medium">{new Date(n.created_at).toLocaleTimeString()}</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">{n.message}</p>
                        
                        {!n.is_read && (
                          <button
                            onClick={() => handleMarkNotificationRead(n.id)}
                            className="text-[10px] font-bold uppercase text-[var(--gm-accent-light)] hover:text-white mt-3 transition-all"
                          >
                            Mark Read
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 8: GLOBAL SYSTEM CONFIGURATION SETTINGS */}
          {activeTab === 'settings' && (
            <div className="max-w-2xl bg-[#131129] border border-white/5 rounded-xl p-6 md:p-8 shadow-2xl">
              <div className="mb-6">
                <h3 className="font-bold text-base text-white">System Global Settings</h3>
                <p className="text-xs text-slate-400 mt-1">Configure live system environment parameters and feature flags.</p>
              </div>

              <form onSubmit={handleSaveSettings} className="space-y-6">
                {/* Maintenance Mode toggle */}
                <div className="flex items-center justify-between p-4 bg-[#0B0A19] border border-white/5 rounded-xl">
                  <div className="flex flex-col gap-0.5">
                    <label className="text-xs font-bold text-white cursor-pointer">Maintenance Mode</label>
                    <span className="text-[10px] text-slate-500">Block public feed uploads, returns maintenance page.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.maintenance_mode || false}
                    onChange={(e) => setSettings(prev => ({ ...prev, maintenance_mode: e.target.checked }))}
                    className="w-8 h-4 bg-slate-700 checked:bg-[var(--gm-brand)] rounded-full appearance-none relative before:content-[''] before:absolute before:h-4 before:w-4 before:bg-white before:rounded-full before:transition-all checked:before:translate-x-4 cursor-pointer border border-white/10"
                  />
                </div>

                {/* Registration Enabled toggle */}
                <div className="flex items-center justify-between p-4 bg-[#0B0A19] border border-white/5 rounded-xl">
                  <div className="flex flex-col gap-0.5">
                    <label className="text-xs font-bold text-white cursor-pointer">Registration Toggle</label>
                    <span className="text-[10px] text-slate-500">Enable new shadow users signups on landing.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.registration_enabled || false}
                    onChange={(e) => setSettings(prev => ({ ...prev, registration_enabled: e.target.checked }))}
                    className="w-8 h-4 bg-slate-700 checked:bg-[var(--gm-brand)] rounded-full appearance-none relative before:content-[''] before:absolute before:h-4 before:w-4 before:bg-white before:rounded-full before:transition-all checked:before:translate-x-4 cursor-pointer border border-white/10"
                  />
                </div>

                {/* Size Limit */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-slate-300">Max Upload Video Size (MB)</label>
                  <input
                    type="number"
                    value={settings.max_upload_size_mb || 1000}
                    onChange={(e) => setSettings(prev => ({ ...prev, max_upload_size_mb: parseInt(e.target.value) }))}
                    className="w-full bg-[#0B0A19] border border-white/5 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-[var(--gm-brand)] font-mono font-bold"
                  />
                </div>

                {/* Allowed formats */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-slate-300">Allowed Video Formats</label>
                  <div className="flex gap-4">
                    {['mp4', 'mov', 'webm'].map((fmt) => (
                      <label key={fmt} className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.allowed_formats?.includes(fmt) || false}
                          onChange={(e) => {
                            const current = settings.allowed_formats || [];
                            const updated = e.target.checked 
                              ? [...current, fmt]
                              : current.filter(x => x !== fmt);
                            setSettings(prev => ({ ...prev, allowed_formats: updated }));
                          }}
                          className="accent-[var(--gm-brand)]"
                        />
                        <span className="font-mono uppercase font-semibold text-[10px] text-white">{fmt}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Algorithm switcher */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-slate-300">Feed Algorithm Engine</label>
                  <select
                    value={settings.feed_algorithm || 'trending'}
                    onChange={(e) => setSettings(prev => ({ ...prev, feed_algorithm: e.target.value }))}
                    className="w-full bg-[#0B0A19] border border-white/5 rounded-lg p-2.5 text-xs text-slate-300 focus:outline-none focus:border-[var(--gm-brand)] font-semibold cursor-pointer"
                  >
                    <option value="trending">Trending Algorithm (Likes + View Velocity)</option>
                    <option value="chronological">Chronological (Upload Timestamps)</option>
                    <option value="personalized">Personalized (User Engagement Logs)</option>
                  </select>
                </div>

                <div className="pt-4 border-t border-white/5">
                  <button
                    type="submit"
                    className="w-full py-3 bg-[var(--gm-brand)] hover:bg-[var(--gm-brand-light)] text-white text-xs font-bold rounded-xl shadow-lg shadow-[var(--gm-brand)]/15 transition-all uppercase tracking-wider"
                  >
                    Save System Settings Configuration
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 9: AUDIT LOGS SEARCHABLE VIEW */}
          {activeTab === 'logs' && (
            <div className="space-y-6">
              <div className="bg-[#131129] border border-white/5 rounded-xl p-4 flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    type="text"
                    placeholder="Search logs by action, admin, or target resource..."
                    className="w-full pl-9 pr-4 py-2 bg-[#0B0A19] border border-white/5 rounded-lg text-xs placeholder:text-slate-500 text-white focus:outline-none focus:border-[var(--gm-brand)] transition-all font-mono"
                  />
                </div>
              </div>

              {/* Logs Table */}
              <div className="bg-[#131129] border border-white/5 rounded-xl overflow-hidden shadow-2xl">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 bg-[#0F0D24]/50 text-slate-400 text-[10px] font-bold uppercase tracking-wider font-mono">
                      <th className="p-4">Timestamp</th>
                      <th className="p-4">Administrator</th>
                      <th className="p-4">Action</th>
                      <th className="p-4">Affected Resource</th>
                      <th className="p-4">IP Address</th>
                      <th className="p-4 max-w-xs truncate">User Agent</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-[11px] font-mono">
                    {filteredLogs.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="p-8 text-center text-slate-500 italic">No audit logs matching search.</td>
                      </tr>
                    ) : (
                      filteredLogs.map((l) => (
                        <tr key={l.id} className="hover:bg-[#1B1936]/40 transition-colors">
                          <td className="p-4 text-slate-500">{new Date(l.created_at).toLocaleString()}</td>
                          <td className="p-4 font-bold text-indigo-400">@{l.admin_email}</td>
                          <td className="p-4 text-white font-semibold">{l.action}</td>
                          <td className="p-4 text-slate-300 italic">{l.affected_resource}</td>
                          <td className="p-4 text-slate-500">{l.ip_address}</td>
                          <td className="p-4 text-slate-500 max-w-xs truncate" title={l.user_agent}>{l.user_agent}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 10: ADMIN PROFILE VIEW */}
          {activeTab === 'profile' && (
            <div className="max-w-xl bg-[#131129] border border-white/5 rounded-xl p-6 md:p-8 shadow-2xl space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--gm-brand)] to-[var(--gm-brand-dark)] flex items-center justify-center text-white text-2xl font-bold font-mono">
                  E
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">evilmc777@gmail.com</h3>
                  <span className="text-[10px] text-[var(--gm-brand-light)] font-bold uppercase tracking-wider font-mono">Designated Principal Admin</span>
                </div>
              </div>

              <div className="divide-y divide-white/5 text-xs">
                <div className="py-3 flex justify-between font-mono">
                  <span className="text-slate-400">Security Clearance</span>
                  <span className="text-emerald-400 font-bold">SUPERADMIN</span>
                </div>
                <div className="py-3 flex justify-between font-mono">
                  <span className="text-slate-400">Active Workspace Environment</span>
                  <span className="text-indigo-300">{fallbackMode ? 'Sandboxed Mock State' : 'Vite Production Link'}</span>
                </div>
                <div className="py-3 flex justify-between font-mono">
                  <span className="text-slate-400">Browser User-Agent Context</span>
                  <span className="text-slate-500 max-w-[240px] truncate text-right">{navigator.userAgent}</span>
                </div>
                <div className="py-3 flex justify-between font-mono">
                  <span className="text-slate-400">Multi-Factor Authentication</span>
                  <span className="text-green-400 flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Activated</span>
                </div>
              </div>

              <div className="bg-[#1B1936] border border-white/5 rounded-xl p-4 flex items-center gap-3">
                <Info className="w-5 h-5 text-[var(--gm-accent-light)] shrink-0" />
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Principal security policy prevents deletion or modifications of admin logs by any account, including this one, to preserve immutable audit trail compliance.
                </p>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* MODAL 1: USER DETAILS DIALOG */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#131129] border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl relative">
            <button 
              onClick={() => setSelectedUser(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="p-6 md:p-8 space-y-6">
              <div>
                <h4 className="text-lg font-bold text-white font-mono">@{selectedUser.username}</h4>
                <p className="text-xs text-slate-400 mt-1">{selectedUser.email}</p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-[#0B0A19] border border-white/5 p-3 rounded-xl text-center">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">Uploads</span>
                  <div className="text-lg font-bold text-white font-mono mt-1">{selectedUser.videos_count || 0}</div>
                </div>
                <div className="bg-[#0B0A19] border border-white/5 p-3 rounded-xl text-center">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">Reports</span>
                  <div className="text-lg font-bold text-red-400 font-mono mt-1">{selectedUser.reports_count || 0}</div>
                </div>
                <div className="bg-[#0B0A19] border border-white/5 p-3 rounded-xl text-center">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">Balance</span>
                  <div className="text-lg font-bold text-emerald-400 font-mono mt-1">${(selectedUser.wallet_balance || 0).toFixed(2)}</div>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-white/5">
                <h5 className="text-xs font-bold text-white">Administrative Actions</h5>
                
                <div className="flex gap-2">
                  {selectedUser.role !== 'admin' && (
                    <>
                      <button
                        onClick={() => handleToggleBan(selectedUser)}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all flex items-center justify-center gap-1.5 ${
                          selectedUser.is_banned
                            ? 'bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20'
                            : 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20'
                        }`}
                      >
                        {selectedUser.is_banned ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                        {selectedUser.is_banned ? 'Unban Account' : 'Suspend / Ban'}
                      </button>

                      <button
                        onClick={() => handleResetUserStats(selectedUser)}
                        className="flex-1 py-2 text-xs font-bold rounded-lg bg-[#1B1936] hover:bg-[#25224A] text-slate-300 hover:text-white border border-white/5 transition-all flex items-center justify-center gap-1.5"
                      >
                        <RefreshCw className="w-3.5 h-3.5" /> Reset Statistics
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: PLAY VIDEO DIALOG / PREVIEW MODERATION */}
      {selectedVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="bg-[#131129] border border-white/10 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl relative">
            <button 
              onClick={() => setSelectedVideo(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-black/60 border border-white/5 hover:bg-black/80 text-slate-400 hover:text-white transition-all z-10"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Video Player */}
            <div className="bg-black w-full aspect-video flex items-center justify-center relative">
              <video 
                src={selectedVideo.video_url} 
                controls 
                autoPlay
                className="w-full h-full object-contain"
              />
            </div>

            {/* Details & Moderation actions */}
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <h4 className="font-bold text-sm text-white">{selectedVideo.title}</h4>
                  <span className="text-xs text-[var(--gm-accent-light)] font-mono">Creator: @{selectedVideo.username}</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-black/40 text-slate-300">
                  {selectedVideo.category}
                </span>
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t border-white/5">
                {selectedVideo.moderation_status !== 'approved' && (
                  <button
                    onClick={() => handleModerateVideo(selectedVideo, 'approved')}
                    className="px-3 py-1.5 rounded bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 text-xs font-bold uppercase transition-all"
                  >
                    Approve Video
                  </button>
                )}
                {selectedVideo.moderation_status !== 'flagged' && (
                  <button
                    onClick={() => handleModerateVideo(selectedVideo, 'flagged')}
                    className="px-3 py-1.5 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-bold uppercase transition-all"
                  >
                    Flag / Restrict
                  </button>
                )}
                <button
                  onClick={() => handleDeleteVideo(selectedVideo)}
                  className="px-3 py-1.5 rounded bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 text-xs font-bold uppercase transition-all flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: ENFORCE ACTION / REPORT RESOLUTION MODAL */}
      {showEnforceModal && selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#131129] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative">
            <button 
              onClick={() => setShowEnforceModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="p-6 md:p-8 space-y-6">
              <div>
                <h4 className="text-base font-bold text-white">Enforce Safety Guidelines</h4>
                <p className="text-xs text-slate-400 mt-1">Reviewing report against @{selectedReport.reported_username}</p>
              </div>

              <div className="bg-[#0B0A19] border border-white/5 rounded-xl p-3.5 text-xs text-slate-400 font-mono">
                <strong>Reason:</strong> {selectedReport.reason}
              </div>

              <div className="space-y-4">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-slate-300">Select Action Enforcement</label>
                  <select
                    value={enforcementAction}
                    onChange={(e) => setEnforcementAction(e.target.value)}
                    className="w-full bg-[#0B0A19] border border-white/5 rounded-lg p-2.5 text-xs text-slate-300 focus:outline-none focus:border-[var(--gm-brand)] cursor-pointer"
                  >
                    <option value="warn">Issue Administrative Warning</option>
                    <option value="delete">Delete Associated Content</option>
                    <option value="ban">Permanently Ban Accused Account</option>
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-slate-300">Administrative Enforcement Notes</label>
                  <textarea
                    value={enforcementNotes}
                    onChange={(e) => setEnforcementNotes(e.target.value)}
                    placeholder="Enter reason details for audit log logs..."
                    rows="3"
                    className="w-full bg-[#0B0A19] border border-white/5 rounded-lg p-2.5 text-xs text-slate-300 placeholder:text-slate-500 focus:outline-none focus:border-[var(--gm-brand)]"
                  />
                </div>
              </div>

              <div className="flex gap-2.5 pt-4 border-t border-white/5">
                <button
                  onClick={() => setShowEnforceModal(false)}
                  className="flex-1 py-2.5 text-xs font-semibold rounded-lg bg-[#1B1936] hover:bg-[#25224A] text-slate-300 hover:text-white border border-white/5 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleResolveReport(selectedReport.id, 'enforce')}
                  className="flex-1 py-2.5 text-xs font-bold rounded-lg bg-red-500 hover:bg-red-600 text-white shadow-lg transition-all"
                >
                  Apply & Resolve Report
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: CREATOR PROCESS DIALOG */}
      {showCreatorModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#131129] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative">
            <button 
              onClick={() => setShowCreatorModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="p-6 md:p-8 space-y-6">
              <div>
                <h4 className="text-base font-bold text-white">Process Creator Application</h4>
                <p className="text-xs text-slate-400 mt-1">Applicant: @{selectedUser.username}</p>
              </div>

              <div className="bg-[#0B0A19] border border-white/5 rounded-xl p-4 flex flex-col gap-2">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-mono font-bold">Proof Document Scan</span>
                <div className="h-28 w-full bg-[#1B1936] border border-dashed border-white/10 rounded-lg flex flex-col items-center justify-center text-slate-400 text-xs">
                  <FileText className="w-8 h-8 text-[var(--gm-brand-light)] mb-1.5" />
                  <span className="font-semibold text-white">{selectedUser.document_type}</span>
                  <span className="text-[10px] text-slate-500 mt-0.5">Verified Identity File</span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-300">Creator Decision Notes</label>
                <textarea
                  value={creatorNotes}
                  onChange={(e) => setCreatorNotes(e.target.value)}
                  placeholder="Notes sent to applicant..."
                  rows="3"
                  className="w-full bg-[#0B0A19] border border-white/5 rounded-lg p-2.5 text-xs text-slate-300 placeholder:text-slate-500 focus:outline-none focus:border-[var(--gm-brand)]"
                />
              </div>

              <div className="flex gap-2.5 pt-4 border-t border-white/5">
                <button
                  onClick={() => handleCreatorApplication(selectedUser, 'rejected')}
                  className="flex-1 py-2.5 text-xs font-bold rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-all uppercase tracking-wider"
                >
                  Reject Request
                </button>
                <button
                  onClick={() => handleCreatorApplication(selectedUser, 'approved')}
                  className="flex-1 py-2.5 text-xs font-bold rounded-lg bg-green-500 hover:bg-green-600 text-white shadow-lg transition-all uppercase tracking-wider"
                >
                  Approve Verification
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
