import React, { useState } from 'react';
import { Briefcase, User as UserIcon, Shield, FileText, LogOut, LayoutDashboard, ChevronRight, Menu, X, CheckCircle2, Heart, Sun, Moon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

interface NavbarProps {
  onOpenAuth: (defaultTab?: 'login' | 'register') => void;
  onOpenMyApps: () => void;
  onOpenSavedJobs: () => void;
  savedJobsCount: number;
  currentView: 'jobs' | 'admin' | 'about';
  setCurrentView: (view: 'jobs' | 'admin' | 'about') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenAuth,
  onOpenMyApps,
  onOpenSavedJobs,
  savedJobsCount,
  currentView,
  setCurrentView,
}) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#0a0a0a]/95 backdrop-blur-md border-b border-slate-200 dark:border-[#1a1a1a] text-slate-900 dark:text-white shadow-md dark:shadow-xl transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Brand Logo */}
          <div 
            onClick={() => setCurrentView('jobs')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 bg-[#E30613] rounded-sm flex items-center justify-center font-bold text-white shadow-lg shadow-[#E30613]/30 group-hover:scale-105 transition-transform">
              <span className="serif text-xl font-bold">A</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="serif text-xl font-bold tracking-tight text-slate-900 dark:text-white uppercase">
                  ADECCO GROUP <span className="font-light opacity-60">AGENCY</span>
                </span>
                <span className="bg-[#E30613]/10 text-[#E30613] text-[9px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-sm border border-[#E30613]/30">
                  LICENSED
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-gray-400 flex items-center gap-1 font-medium">
                <Shield className="w-3 h-3 text-emerald-500 inline" /> International & Local Recruitment
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8">
            <button
              onClick={() => setCurrentView('jobs')}
              className={`text-sm font-semibold transition-colors flex items-center gap-2 ${
                currentView === 'jobs' ? 'text-[#E30613] border-b-2 border-[#E30613] py-1' : 'text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Briefcase className="w-4 h-4" /> Explore Vacancies
            </button>

            <a
              href="#testimonials"
              onClick={() => setCurrentView('jobs')}
              className="text-sm font-semibold text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Testimonials
            </a>

            <button
              onClick={() => setCurrentView('about')}
              className={`text-sm font-semibold transition-colors flex items-center gap-2 ${
                currentView === 'about' ? 'text-[#E30613] border-b-2 border-[#E30613] py-1' : 'text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Shield className="w-4 h-4" /> About Agency
            </button>

            {user?.role === 'admin' && (
              <button
                onClick={() => setCurrentView('admin')}
                className={`text-sm font-semibold px-3 py-1.5 rounded-lg border transition-all flex items-center gap-2 ${
                  currentView === 'admin'
                    ? 'bg-[#E30613] text-white border-[#E30613] shadow-md shadow-[#E30613]/20'
                    : 'bg-slate-100 dark:bg-[#111] text-slate-800 dark:text-gray-200 border-slate-200 dark:border-[#222] hover:bg-slate-200 dark:hover:bg-[#1a1a1a] hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <LayoutDashboard className="w-4 h-4 text-amber-500 dark:text-amber-400" /> Admin Portal
              </button>
            )}
          </nav>

          {/* User Right Action Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="p-2 rounded-lg bg-slate-100 dark:bg-[#111] text-slate-700 dark:text-gray-200 hover:bg-slate-200 dark:hover:bg-[#1a1a1a] border border-slate-200 dark:border-[#222] transition-colors flex items-center justify-center gap-1.5 text-xs font-semibold"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span className="hidden lg:inline text-xs">Light</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-indigo-600" />
                  <span className="hidden lg:inline text-xs">Dark</span>
                </>
              )}
            </button>

            {/* Saved Jobs Button */}
            <button
              onClick={onOpenSavedJobs}
              className="flex items-center gap-1.5 text-xs font-semibold bg-slate-100 dark:bg-[#111] hover:bg-slate-200 dark:hover:bg-[#1a1a1a] text-slate-800 dark:text-gray-200 px-3 py-2 rounded-lg border border-slate-200 dark:border-[#222] transition-all relative"
            >
              <Heart className="w-4 h-4 text-[#E30613] fill-[#E30613]/30" />
              <span>Saved Jobs</span>
              {savedJobsCount > 0 && (
                <span className="bg-[#E30613] text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full min-w-[18px] text-center">
                  {savedJobsCount}
                </span>
              )}
            </button>

            {user ? (
              <div className="flex items-center gap-3">
                <button
                  onClick={onOpenMyApps}
                  className="flex items-center gap-2 text-xs font-semibold bg-slate-100 dark:bg-[#111] hover:bg-slate-200 dark:hover:bg-[#1a1a1a] text-slate-800 dark:text-gray-200 px-3.5 py-2 rounded-lg border border-slate-200 dark:border-[#222] transition-all"
                >
                  <FileText className="w-4 h-4 text-[#E30613]" />
                  My Applications
                </button>

                <div className="h-6 w-px bg-slate-200 dark:bg-[#222]" />

                <div className="flex items-center gap-2 bg-slate-100 dark:bg-[#111] px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#222]">
                  <div className="w-8 h-8 rounded-md bg-[#E30613]/20 text-[#E30613] flex items-center justify-center font-bold text-sm border border-[#E30613]/30">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-slate-900 dark:text-white max-w-[120px] truncate">{user.name}</p>
                    <p className="text-[10px] text-slate-500 dark:text-gray-400 capitalize font-mono flex items-center gap-1">
                      {user.role === 'admin' ? (
                        <span className="text-amber-600 dark:text-amber-400 font-semibold">Administrator</span>
                      ) : (
                        <span className="text-green-600 dark:text-green-400 font-semibold">Applicant</span>
                      )}
                    </p>
                  </div>
                  <button
                    onClick={logout}
                    title="Log Out"
                    className="ml-2 text-slate-400 dark:text-gray-400 hover:text-[#E30613] p-1 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => onOpenAuth('login')}
                  className="text-sm font-semibold text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white px-3 py-2 transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={() => onOpenAuth('register')}
                  className="text-xs font-bold bg-[#E30613] hover:bg-red-700 text-white px-5 py-2.5 rounded-sm uppercase tracking-wider shadow-lg transition-all flex items-center gap-1.5"
                >
                  Create Account <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button & Quick Actions */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="p-2 bg-slate-100 dark:bg-[#111] text-slate-700 dark:text-gray-200 rounded-lg text-xs font-semibold flex items-center gap-1 border border-slate-200 dark:border-[#222]"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-600" />
              )}
            </button>

            <button
              onClick={onOpenSavedJobs}
              className="p-2 bg-slate-100 dark:bg-[#111] text-[#E30613] rounded-lg text-xs font-semibold flex items-center gap-1 relative border border-slate-200 dark:border-[#222]"
            >
              <Heart className="w-4 h-4 fill-[#E30613]/30" />
              {savedJobsCount > 0 && (
                <span className="bg-[#E30613] text-white text-[9px] font-bold px-1 rounded-full">
                  {savedJobsCount}
                </span>
              )}
            </button>

            {user && (
              <button
                onClick={onOpenMyApps}
                className="p-2 bg-slate-100 dark:bg-[#111] text-[#E30613] rounded-lg text-xs font-semibold flex items-center gap-1 border border-slate-200 dark:border-[#222]"
              >
                <FileText className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-700 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-[#111] rounded-lg border border-slate-200 dark:border-[#222]"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white dark:bg-[#0a0a0a] border-b border-slate-200 dark:border-[#1a1a1a] px-4 pt-3 pb-6 space-y-3">
          <button
            onClick={() => {
              setCurrentView('jobs');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 rounded-lg text-slate-800 dark:text-gray-200 hover:bg-slate-100 dark:hover:bg-[#111] font-semibold flex items-center gap-2"
          >
            <Briefcase className="w-4 h-4 text-[#E30613]" /> Explore Vacancies
          </button>
          
          <button
            onClick={() => {
              onOpenSavedJobs();
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 rounded-lg text-slate-800 dark:text-gray-200 hover:bg-slate-100 dark:hover:bg-[#111] font-semibold flex items-center justify-between"
          >
            <span className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-[#E30613]" /> Saved Jobs
            </span>
            {savedJobsCount > 0 && (
              <span className="bg-[#E30613] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                {savedJobsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              setCurrentView('about');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 rounded-lg text-slate-800 dark:text-gray-200 hover:bg-slate-100 dark:hover:bg-[#111] font-semibold flex items-center gap-2"
          >
            <Shield className="w-4 h-4 text-emerald-500" /> About Agency
          </button>

          <button
            onClick={() => {
              toggleTheme();
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 rounded-lg text-slate-800 dark:text-gray-200 hover:bg-slate-100 dark:hover:bg-[#111] font-semibold flex items-center justify-between"
          >
            <span className="flex items-center gap-2">
              {theme === 'dark' ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400" /> Theme: Dark Mode
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-indigo-600" /> Theme: Light Mode
                </>
              )}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">Switch</span>
          </button>

          {user?.role === 'admin' && (
            <button
              onClick={() => {
                setCurrentView('admin');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-lg text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 font-semibold flex items-center gap-2"
            >
              <LayoutDashboard className="w-4 h-4" /> Admin Portal
            </button>
          )}

          <div className="pt-2 border-t border-slate-200 dark:border-[#1a1a1a]">
            {user ? (
              <div className="space-y-2">
                <button
                  onClick={() => {
                    onOpenMyApps();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 bg-slate-100 dark:bg-[#111] rounded-lg text-slate-800 dark:text-gray-200 font-semibold flex items-center gap-2"
                >
                  <FileText className="w-4 h-4 text-[#E30613]" /> My Applications
                </button>
                <div className="flex items-center justify-between px-3 py-2 bg-slate-50 dark:bg-[#050505] rounded-lg border border-slate-200 dark:border-[#1a1a1a]">
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">{user.name}</p>
                    <p className="text-[10px] text-slate-500 dark:text-gray-400">{user.email}</p>
                  </div>
                  <button
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                    className="text-xs text-[#E30613] font-semibold flex items-center gap-1 bg-[#E30613]/10 px-2 py-1 rounded border border-[#E30613]/30"
                  >
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => {
                    onOpenAuth('login');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2 bg-slate-100 dark:bg-[#111] text-slate-800 dark:text-gray-200 font-semibold text-sm rounded-lg text-center"
                >
                  Sign In
                </button>
                <button
                  onClick={() => {
                    onOpenAuth('register');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2 bg-[#E30613] text-white font-semibold text-sm rounded-lg text-center"
                >
                  Register
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

