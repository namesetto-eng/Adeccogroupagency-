import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { JobCard } from './components/JobCard';
import { JobDetailModal } from './components/JobDetailModal';
import { ApplicationWizardModal } from './components/ApplicationWizardModal';
import { AuthModal } from './components/AuthModal';
import { UserApplicationsModal } from './components/UserApplicationsModal';
import { SavedJobsModal } from './components/SavedJobsModal';
import { AboutSection } from './components/AboutSection';
import { TestimonialsSection } from './components/TestimonialsSection';
import { AdminDashboard } from './components/AdminDashboard';
import { Footer } from './components/Footer';
import { Job, Application } from './types';
import { api } from './lib/api';
import { Briefcase, AlertCircle, RefreshCw, CheckCircle2, Shield } from 'lucide-react';

function MainApp() {
  const { user } = useAuth();

  // Navigation view
  const [currentView, setCurrentView] = useState<'jobs' | 'admin' | 'about'>('jobs');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('all');
  const [selectedRegionCounty, setSelectedRegionCounty] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Pagination & Jobs data
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [errorJobs, setErrorJobs] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalJobs, setTotalJobs] = useState(0);

  // Saved Jobs Bookmarks State
  const [savedJobIds, setSavedJobIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('adecco_saved_jobs');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [savedJobsModalOpen, setSavedJobsModalOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('adecco_saved_jobs', JSON.stringify(savedJobIds));
    } catch (e) {
      console.error('Failed to sync saved jobs', e);
    }
  }, [savedJobIds]);

  const handleToggleSaveJob = (job: Job) => {
    setSavedJobIds((prev) =>
      prev.includes(job.id) ? prev.filter((id) => id !== job.id) : [...prev, job.id]
    );
  };

  const handleRemoveSavedJob = (jobId: string) => {
    setSavedJobIds((prev) => prev.filter((id) => id !== jobId));
  };

  const safeJobs = Array.isArray(jobs) ? jobs : [];
  const savedJobsList = safeJobs.filter((j) => savedJobIds.includes(j.id));

  // Modals state
  const [selectedJobForDetail, setSelectedJobForDetail] = useState<Job | null>(null);
  const [selectedJobForApply, setSelectedJobForApply] = useState<Job | null>(null);

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authDefaultTab, setAuthDefaultTab] = useState<'login' | 'register'>('login');

  const [myAppsModalOpen, setMyAppsModalOpen] = useState(false);

  // Load jobs from backend with pagination
  const fetchJobs = async (targetPage = 1) => {
    setLoadingJobs(true);
    setErrorJobs(null);
    try {
      const res = await api.getJobs({
        country: selectedCountry,
        region_county: selectedRegionCounty,
        category: selectedCategory,
        search: searchQuery,
        status: 'active',
        page: targetPage,
        limit: 24,
      });
      const jobsList = Array.isArray(res) ? res : (Array.isArray(res?.jobs) ? res.jobs : []);
      setJobs(jobsList);
      setTotalPages(res.totalPages);
      setTotalJobs(res.total);
      setCurrentPage(res.page);
    } catch (err: any) {
      setErrorJobs(err.message || 'Failed to load job listings.');
    } finally {
      setLoadingJobs(false);
    }
  };

  useEffect(() => {
    fetchJobs(1);
  }, [selectedCountry, selectedCategory]);

  const handleSearchClick = () => {
    fetchJobs(1);
  };

  const handleOpenAuth = (tab: 'login' | 'register' = 'login') => {
    setAuthDefaultTab(tab);
    setAuthModalOpen(true);
  };

  const handleApplyClick = (job: Job) => {
    if (!user) {
      setAuthDefaultTab('login');
      setAuthModalOpen(true);
      return;
    }
    setSelectedJobForApply(job);
  };

  const handlePayForExistingApp = (app: Application) => {
    if (app.job) {
      setSelectedJobForApply(app.job);
    }
  };

  const isAdmin =
    user?.role === 'admin' ||
    user?.email?.toLowerCase().trim() === 'bettkiplagatmicah@gmail.com' ||
    user?.email?.toLowerCase().includes('admin');

  const handleAuthSuccess = (role: 'applicant' | 'admin') => {
    if (role === 'admin' || user?.email?.toLowerCase().trim() === 'bettkiplagatmicah@gmail.com') {
      setCurrentView('admin');
    } else {
      setCurrentView('jobs');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-red-500 selection:text-white transition-colors duration-200">
      
      {/* Navigation Header */}
      <Navbar
        onOpenAuth={handleOpenAuth}
        onOpenMyApps={() => setMyAppsModalOpen(true)}
        onOpenSavedJobs={() => setSavedJobsModalOpen(true)}
        savedJobsCount={savedJobIds.length}
        currentView={currentView}
        setCurrentView={setCurrentView}
      />

      {/* Main View Area */}
      <main className="flex-grow">
        
        {currentView === 'admin' ? (
          isAdmin ? (
            <AdminDashboard />
          ) : (
            <div className="max-w-md mx-auto my-20 p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl text-center space-y-4 shadow-xl">
              <Shield className="w-12 h-12 text-red-500 mx-auto" />
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">Access Restricted</h2>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Admin credentials are required to view the management portal. Please sign in as an administrator.
              </p>
              <button
                onClick={() => handleOpenAuth('login')}
                className="px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl shadow-lg"
              >
                Sign In as Administrator
              </button>
            </div>
          )
        ) : currentView === 'about' ? (
          <AboutSection />
        ) : (
          /* Jobs View */
          <div>
            {/* Hero Search Section */}
            <HeroSection
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              selectedCountry={selectedCountry}
              setSelectedCountry={setSelectedCountry}
              selectedRegionCounty={selectedRegionCounty}
              setSelectedRegionCounty={setSelectedRegionCounty}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              onSearchClick={handleSearchClick}
              jobs={jobs}
            />

            {/* Featured Job Vacancies Grid */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
              
              <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                    Featured International & Local Vacancies
                    {totalJobs > 0 && (
                      <span className="text-xs px-2.5 py-1 bg-red-600/10 dark:bg-red-600/20 text-red-600 dark:text-red-400 border border-red-500/30 rounded-full font-mono">
                        {totalJobs.toLocaleString()} Total Roles
                      </span>
                    )}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 font-medium">
                    Verified job opportunities with employer-funded visa processing and M-Pesa STK push fee settlement
                  </p>
                </div>

                <button
                  onClick={() => fetchJobs(currentPage)}
                  className="px-4 py-2 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingJobs ? 'animate-spin' : ''}`} />
                  Refresh Vacancies
                </button>
              </div>

              {loadingJobs ? (
                <div className="py-20 text-center space-y-3">
                  <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Loading verified job opportunities...</p>
                </div>
              ) : errorJobs ? (
                <div className="p-6 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-500/50 rounded-2xl text-center space-y-3 max-w-lg mx-auto">
                  <AlertCircle className="w-8 h-8 text-red-500 dark:text-red-400 mx-auto" />
                  <p className="text-sm font-bold text-red-800 dark:text-red-200">{errorJobs}</p>
                  <button
                    onClick={() => fetchJobs(currentPage)}
                    className="px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-xl"
                  >
                    Try Again
                  </button>
                </div>
              ) : jobs.length === 0 ? (
                <div className="py-16 text-center bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 max-w-xl mx-auto space-y-3 shadow-md">
                  <Briefcase className="w-10 h-10 text-slate-400 dark:text-slate-600 mx-auto" />
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">No Vacancies Found</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    No active job listings match your current search query or filter. Try clearing filters or searching for another keyword.
                  </p>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCountry('all');
                      setSelectedRegionCounty('');
                      setSelectedCategory('all');
                      fetchJobs(1);
                    }}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700"
                  >
                    Clear All Search Filters
                  </button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {safeJobs.map((job) => (
                      <JobCard
                        key={job.id}
                        job={job}
                        isSaved={savedJobIds.includes(job.id)}
                        onToggleSave={handleToggleSaveJob}
                        onSelectJob={(j) => setSelectedJobForDetail(j)}
                        onApplyNow={(j) => handleApplyClick(j)}
                      />
                    ))}
                  </div>

                  {/* Pagination Bar */}
                  {totalPages > 1 && (
                    <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-md">
                      <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                        Showing page <span className="text-slate-900 dark:text-white font-bold">{currentPage}</span> of{' '}
                        <span className="text-slate-900 dark:text-white font-bold">{totalPages}</span> ({totalJobs.toLocaleString()} total listings)
                      </p>

                      <div className="flex items-center gap-2">
                        <button
                          disabled={currentPage <= 1 || loadingJobs}
                          onClick={() => fetchJobs(currentPage - 1)}
                          className="px-3.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-800 dark:text-white text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 transition-colors"
                        >
                          Previous
                        </button>

                        <div className="flex items-center gap-1 font-mono text-xs">
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pNum = currentPage;
                            if (currentPage <= 3) {
                              pNum = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                              pNum = totalPages - 4 + i;
                            } else {
                              pNum = currentPage - 2 + i;
                            }
                            if (pNum < 1 || pNum > totalPages) return null;

                            return (
                              <button
                                key={pNum}
                                onClick={() => fetchJobs(pNum)}
                                className={`w-8 h-8 rounded-xl font-bold transition-colors ${
                                  currentPage === pNum
                                    ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                                    : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                                }`}
                              >
                                {pNum}
                              </button>
                            );
                          })}
                        </div>

                        <button
                          disabled={currentPage >= totalPages || loadingJobs}
                          onClick={() => fetchJobs(currentPage + 1)}
                          className="px-3.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-800 dark:text-white text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 transition-colors"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

            </section>

            {/* Candidate Testimonials Section */}
            <TestimonialsSection
              onOpenAuth={() => handleOpenAuth('login')}
              currentUser={user}
            />
          </div>
        )}

      </main>

      {/* Footer */}
      <Footer />

      {/* MODALS */}
      <JobDetailModal
        job={selectedJobForDetail}
        onClose={() => setSelectedJobForDetail(null)}
        onApply={(j) => handleApplyClick(j)}
      />

      <ApplicationWizardModal
        job={selectedJobForApply}
        onClose={() => setSelectedJobForApply(null)}
        onSuccess={() => {
          fetchJobs();
          setMyAppsModalOpen(true);
        }}
        onOpenAuth={() => {
          setSelectedJobForApply(null);
          handleOpenAuth('login');
        }}
      />

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        defaultTab={authDefaultTab}
        onLoginSuccess={handleAuthSuccess}
      />

      <UserApplicationsModal
        isOpen={myAppsModalOpen}
        onClose={() => setMyAppsModalOpen(false)}
        onPayForApp={handlePayForExistingApp}
      />

      <SavedJobsModal
        isOpen={savedJobsModalOpen}
        onClose={() => setSavedJobsModalOpen(false)}
        savedJobs={savedJobsList}
        onRemoveSavedJob={handleRemoveSavedJob}
        onSelectJob={(j) => setSelectedJobForDetail(j)}
        onApplyNow={(j) => handleApplyClick(j)}
      />

    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ThemeProvider>
  );
}
