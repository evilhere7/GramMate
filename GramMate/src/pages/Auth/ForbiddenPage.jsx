import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ShieldAlert, ArrowLeft, LogOut } from 'lucide-react';

export default function ForbiddenPage() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0A19] flex items-center justify-center p-4 selection:bg-[var(--gm-brand)]/30 selection:text-white">
      {/* Decorative background gradients */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[var(--gm-brand)]/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[var(--gm-accent)]/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative w-full max-w-md bg-[#131129]/80 backdrop-blur-xl border border-white/5 rounded-2xl p-8 md:p-10 shadow-2xl text-center">
        {/* Icon Container */}
        <div className="mx-auto w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center mb-6">
          <ShieldAlert className="w-8 h-8 text-red-500" />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-white mb-3 tracking-tight">
          Access Denied
        </h1>
        
        {/* Subtitle / Status */}
        <div className="inline-block bg-red-500/10 text-red-400 text-xs px-3 py-1 rounded-full font-mono font-medium mb-6">
          403 FORBIDDEN
        </div>

        {/* Description */}
        <p className="text-slate-400 text-sm leading-relaxed mb-6">
          Your account <span className="text-white font-medium font-mono text-xs">{user?.email}</span> does not have the required administrative permissions to access this area.
        </p>

        <div className="bg-[#1B1936] rounded-xl p-4 mb-8 text-left border border-white/5">
          <h2 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            Security Policy Notice
          </h2>
          <p className="text-xs text-slate-400 leading-normal">
            Only designated administrators (<span className="text-[var(--gm-accent-light)] font-mono">evilmc777@gmail.com</span>) are authorized to view or manage the administration console. Unsuccessful authorization attempts are logged.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate('/')}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#1B1936] hover:bg-[#25224A] text-slate-300 hover:text-white border border-white/5 hover:border-white/10 text-sm font-medium transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Return Home
          </button>
          
          <button
            onClick={handleSignOut}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/20 text-sm font-medium transition-all"
          >
            <LogOut className="w-4 h-4" />
            Switch Account
          </button>
        </div>
      </div>
    </div>
  );
}
