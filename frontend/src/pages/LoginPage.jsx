import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Sparkles, 
  Lock, 
  Mail, 
  User, 
  ArrowRight, 
  Flame, 
  Check, 
  AlertCircle 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { loginWithEmail, signUpWithEmail } from '../services/firebase';

// 3D Canvas Animated Constellation Mesh
const ParticleConstellationCanvas = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationId;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const particles = [];
    const count = 65;

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8,
        radius: Math.random() * 2 + 1,
        color: i % 3 === 0 ? '#FF2E63' : i % 3 === 1 ? '#08D9D6' : '#ffffff'
      });
    }

    const animate = () => {
      ctx.fillStyle = 'rgba(9, 9, 11, 0.25)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = p.color;
        ctx.fill();

        // Connect nearby points
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 130) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(255, 46, 99, ${0.15 * (1 - dist / 130)})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-0" />;
};

export default function LoginPage() {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleDemoLogin = (role) => {
    setLoading(true);
    setSuccess(`Entering GramMate as demo ${role}...`);
    setTimeout(() => {
      navigate('/');
    }, 800);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      setError('Please provide email and password.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (isSignUp) {
        if (!formData.displayName) {
          setError('Please provide your name.');
          setLoading(false);
          return;
        }
        await signUpWithEmail(formData.email, formData.password, formData.displayName);
        setSuccess('Account created! Welcome to GramMate.');
      } else {
        await loginWithEmail(formData.email, formData.password);
        setSuccess('Logged in successfully!');
      }
      setTimeout(() => navigate('/'), 1200);
    } catch (err) {
      // Graceful fallback for local development without live Firebase config
      setError(err.message || 'Authentication error. You can also use Demo Login below.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-zinc-950 flex items-center justify-center p-4 overflow-hidden select-none">
      {/* 3D Particle Constellation Background */}
      <ParticleConstellationCanvas />

      {/* Glow Orbs */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-primary/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-secondary/15 blur-[120px] rounded-full pointer-events-none" />

      {/* Main Glass Card */}
      <motion.div 
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-md bg-zinc-900/70 backdrop-blur-2xl border border-zinc-800/80 rounded-3xl p-6 sm:p-8 shadow-2xl"
      >
        {/* Brand Logo & Title */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary to-rose-400 text-white font-black text-xl shadow-lg shadow-primary/30 mb-3">
            GM
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Gram<span className="text-primary">Mate</span>
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            {isSignUp ? 'Create your creator account & start earning' : 'The Next-Gen Short-Form Video & Watch-to-Earn Platform'}
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex bg-zinc-950/80 p-1 rounded-2xl border border-zinc-800 mb-6">
          <button
            type="button"
            onClick={() => { setIsSignUp(false); setError(''); }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
              !isSignUp ? 'bg-primary text-white shadow-md shadow-primary/30' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setIsSignUp(true); setError(''); }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
              isSignUp ? 'bg-primary text-white shadow-md shadow-primary/30' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Create Account
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
            <Check size={16} className="shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="text-xs font-bold text-zinc-300 block mb-1.5">Full Name</label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input 
                  type="text"
                  name="displayName"
                  value={formData.displayName}
                  onChange={handleInputChange}
                  placeholder="e.g. Alex Rivera"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-xs sm:text-sm text-white focus:outline-none focus:border-primary transition-colors placeholder:text-zinc-600"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-zinc-300 block mb-1.5">Email Address</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input 
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="you@example.com"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-xs sm:text-sm text-white focus:outline-none focus:border-primary transition-colors placeholder:text-zinc-600"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-zinc-300 block mb-1.5">Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input 
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="••••••••"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-xs sm:text-sm text-white focus:outline-none focus:border-primary transition-colors placeholder:text-zinc-600"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-primary to-rose-600 hover:from-primary/90 hover:to-rose-600/90 text-white font-extrabold rounded-xl shadow-lg shadow-primary/25 text-sm transition-all flex items-center justify-center gap-2 mt-2"
          >
            <span>{loading ? 'Authenticating...' : isSignUp ? 'Sign Up & Start Earning' : 'Sign In'}</span>
            <ArrowRight size={16} />
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-zinc-800" />
          </div>
          <span className="relative bg-zinc-900 px-3 text-[11px] font-bold text-zinc-500 uppercase">
            Instant Zero-Friction Demo
          </span>
        </div>

        {/* Demo Fast Access Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => handleDemoLogin('Creator')}
            className="p-3 rounded-2xl bg-zinc-950 hover:bg-zinc-800/80 border border-zinc-800 text-left transition-all group"
          >
            <span className="flex items-center gap-1 text-[11px] font-bold text-primary mb-0.5">
              <Sparkles size={12} /> Creator Mode
            </span>
            <p className="text-xs font-semibold text-white group-hover:text-primary transition-colors">
              Explore as Alex Rivera
            </p>
          </button>

          <button
            type="button"
            onClick={() => handleDemoLogin('Viewer')}
            className="p-3 rounded-2xl bg-zinc-950 hover:bg-zinc-800/80 border border-zinc-800 text-left transition-all group"
          >
            <span className="flex items-center gap-1 text-[11px] font-bold text-secondary mb-0.5">
              <Flame size={12} /> Watch & Earn
            </span>
            <p className="text-xs font-semibold text-white group-hover:text-secondary transition-colors">
              Explore as Viewer
            </p>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
