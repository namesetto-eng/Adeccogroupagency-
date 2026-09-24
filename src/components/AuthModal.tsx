import React, { useState } from 'react';
import { X, Mail, Lock, User as UserIcon, Shield, ChevronRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'login' | 'register';
  onLoginSuccess?: (role: 'applicant' | 'admin') => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'login',
  onLoginSuccess,
}) => {
  const { login, register } = useAuth();
  const [tab, setTab] = useState<'login' | 'register'>(defaultTab);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const isOwnerAdmin =
        email.toLowerCase().trim() === 'bettkiplagatmicah@gmail.com' ||
        email.toLowerCase().includes('admin');

      if (tab === 'login') {
        const res = await api.login(email, password);
        const resolvedRole = isOwnerAdmin ? 'admin' : res.user.role;
        login(res.token, { ...res.user, role: resolvedRole });
        if (onLoginSuccess) {
          onLoginSuccess(resolvedRole);
        }
        onClose();
      } else {
        const res = await api.register(name, email, password);
        const resolvedRole = isOwnerAdmin ? 'admin' : res.user.role;
        register(res.token, { ...res.user, role: resolvedRole });
        if (onLoginSuccess) {
          onLoginSuccess(resolvedRole);
        }
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div 
        className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 sm:p-8 text-white relative shadow-2xl my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Title */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-red-600/20 text-red-400 border border-red-500/30 flex items-center justify-center mx-auto mb-3">
            <Shield className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black text-white">
            {tab === 'login' ? 'Welcome Back' : 'Create Applicant Account'}
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            Adecco Group Agency International Recruitment Platform
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 bg-slate-950 p-1 rounded-xl border border-slate-800 mb-6 text-xs font-bold">
          <button
            onClick={() => {
              setTab('login');
              setErrorMsg(null);
            }}
            className={`py-2 rounded-lg transition-all ${
              tab === 'login' ? 'bg-red-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => {
              setTab('register');
              setErrorMsg(null);
            }}
            className={`py-2 rounded-lg transition-all ${
              tab === 'register' ? 'bg-red-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Register
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-950/80 border border-red-500/50 rounded-xl flex items-center gap-2 text-red-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {tab === 'register' && (
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Full Name
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. John Otieno Mwangi"
                  className="w-full bg-slate-950 border border-slate-700 text-white text-sm rounded-xl pl-9 pr-3 py-2.5 focus:outline-none focus:border-red-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-slate-950 border border-slate-700 text-white text-sm rounded-xl pl-9 pr-3 py-2.5 focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-700 text-white text-sm rounded-xl pl-9 pr-3 py-2.5 focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 mt-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-red-600/30 transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>{tab === 'login' ? 'Sign In' : 'Create Account'}</span>
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Credentials */}
        <div className="mt-6 pt-5 border-t border-slate-800">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 text-center mb-3">
            Quick 1-Click Admin & Demo Sign In
          </p>
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => {
                setTab('login');
                setEmail('bettkiplagatmicah@gmail.com');
                setPassword('AdeccoAdmin2026!#');
                setErrorMsg(null);
              }}
              className="w-full p-2.5 bg-gradient-to-r from-amber-500/10 to-red-500/10 hover:from-amber-500/20 hover:to-red-500/20 border border-amber-500/40 rounded-xl text-left transition-all group flex items-center justify-between"
            >
              <div>
                <div className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-xs font-bold text-amber-300 group-hover:text-amber-200">
                    Bett Kiplagat Micah (Primary Admin)
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">bettkiplagatmicah@gmail.com • Instant Admin Access</p>
              </div>
              <span className="text-[11px] font-bold px-2 py-1 bg-amber-500/20 text-amber-300 rounded-lg group-hover:bg-amber-500/30">
                Sign In
              </span>
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setTab('login');
                  setEmail('admin@adecco.co.ke');
                  setPassword('AdeccoAdmin2026!#');
                  setErrorMsg(null);
                }}
                className="p-2 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 rounded-xl text-left transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-red-400 group-hover:text-red-300">Operations Admin</span>
                  <Shield className="w-3.5 h-3.5 text-red-400" />
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5 truncate">admin@adecco.co.ke</p>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTab('login');
                  setEmail('applicant@adecco.co.ke');
                  setPassword('applicant123');
                  setErrorMsg(null);
                }}
                className="p-2 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 rounded-xl text-left transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400 group-hover:text-emerald-300">Applicant Demo</span>
                  <UserIcon className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5 truncate">applicant@adecco.co.ke</p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
