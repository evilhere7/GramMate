import React from 'react';
import { ShieldAlert, ArrowLeft, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ForbiddenPage() {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-[var(--gm-bg)] text-[var(--gm-text)] flex items-center justify-center p-4">
      <div className="w-full max-w-md gm-card p-8 text-center border border-[var(--gm-border-strong)] shadow-xl">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center mx-auto mb-5">
          <ShieldAlert size={32} />
        </div>

        <h1 className="text-2xl font-black tracking-tight mb-2">
          403 — Access Denied
        </h1>

        <p className="text-sm text-[var(--gm-text-secondary)] leading-relaxed mb-6">
          The administrator platform is strictly restricted. Your current authenticated account (
          <span className="font-semibold text-[var(--gm-text)]">{user?.email || 'Anonymous'}</span>
          ) does not hold administrative authorization.
        </p>

        <div className="space-y-3">
          <Link
            to="/"
            className="gm-btn-primary w-full text-sm py-2.5 flex items-center justify-center gap-2"
          >
            <ArrowLeft size={16} />
            <span>Return to Feed</span>
          </Link>

          {user && (
            <button
              onClick={() => signOut()}
              className="gm-btn-secondary w-full text-sm py-2.5 flex items-center justify-center gap-2 text-[var(--gm-text-secondary)]"
            >
              <Lock size={15} />
              <span>Switch Account</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
