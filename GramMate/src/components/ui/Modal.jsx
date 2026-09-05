import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  maxWidth = 'max-w-lg' 
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="fixed inset-0" 
        onClick={onClose} 
        aria-hidden="true" 
      />
      <div 
        className={`relative w-full ${maxWidth} gm-card bg-[var(--gm-surface)] p-6 shadow-2xl z-10 border border-[var(--gm-border-strong)] animate-in zoom-in-95 duration-150`}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-[var(--gm-border)]">
          <h2 className="text-lg font-bold text-[var(--gm-text)] tracking-tight">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[var(--gm-text-secondary)] hover:text-[var(--gm-text)] hover:bg-[var(--gm-surface-elevated)] transition-colors"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>
        <div className="text-[var(--gm-text)]">
          {children}
        </div>
      </div>
    </div>
  );
}
