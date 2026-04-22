import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import { apiFetch } from '../lib/api';
import { Lock, User, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import WelcomeOverlay from '../components/WelcomeOverlay';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState<string | null>(null);
  const { login, config } = useAuth();
  const navigate = useNavigate();

  const { BRAND_CONFIG, INSTITUTIONAL_CONTACTS } = config;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });
      
      // Setup welcome state first
      setLoggedInUser(data.user.username);
      setShowWelcome(true);
      
      // Delay navigation to show welcome message
      setTimeout(() => {
        login(data.token, data.user);
        navigate('/');
      }, 4000);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-light-orange flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <AnimatePresence>
        {showWelcome && loggedInUser && (
          <WelcomeOverlay username={loggedInUser} />
        )}
      </AnimatePresence>

      {/* Background Orbs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-orange/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand-orange/10 rounded-full blur-[120px]"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full glass-panel p-10 border-brand-soft-orange relative z-10"
      >
        <div className="text-center mb-10">
          <div className="flex justify-center mb-8">
            <img 
              src={BRAND_CONFIG.LOGO_URL} 
              alt={`${BRAND_CONFIG.NAME} Logo`}
              className="h-28 w-auto" 
              referrerPolicy="no-referrer"
            />
          </div>
          <p className="text-brand-orange font-bold uppercase text-[11px] tracking-[0.4em]">Integrated Analytics Hub</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-red-500/10 text-red-400 p-4 rounded-xl text-xs font-bold uppercase tracking-wider border border-red-500/20 text-center"
            >
              {error}
            </motion.div>
          )}

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Jurisdictional Identity ID</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input-field pl-12"
                placeholder="YOUR LOGIN ID"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Security Passkey</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field pl-12 pr-12"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-brand-orange transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-4 rounded-xl font-bold uppercase tracking-[0.2em] text-xs shadow-2xl shadow-brand-orange/20 disabled:grayscale transition-all"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-3">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Authenticating
              </div>
            ) : 'Establish Connection'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
            Unable to login / No access / Forgot credentials?<br/>
            Contact <a href={`mailto:${INSTITUTIONAL_CONTACTS.TECHNICAL_SUPPORT}`} className="text-brand-orange hover:underline decoration-brand-orange/30 underline-offset-4 font-extrabold tracking-tight italic">{INSTITUTIONAL_CONTACTS.TECHNICAL_SUPPORT}</a>
          </p>
        </div>

        <div className="mt-8 pt-8 border-t border-brand-soft-orange text-center">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed">
            {BRAND_CONFIG.NAME} High-Trust Infrastructure<br/>
            Secure Encryption Protocols Active
          </p>
        </div>
      </motion.div>
      
      <p className="mt-8 text-[11px] text-slate-500 font-medium relative z-10">
        &copy; {new Date().getFullYear()} {BRAND_CONFIG.NAME} Intellect. Unauthorized access is strictly logged.
      </p>
    </div>
  );
}
