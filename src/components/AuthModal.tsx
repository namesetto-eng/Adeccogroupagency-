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
      if (tab === 'login') {
        const res = await api.login(email, password);
        login(res.token, res.user);
        if (onLoginSuccess) {
          onLoginSuccess(res.user.role);
        }
        onClose();
      } else {
        const res = await api.register(name, email, password);
        register(res.token, res.user);
        if (onLoginSuccess) {
          onLoginSuccess(res.user.role);
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

      </div>
    </div>
  );
};
