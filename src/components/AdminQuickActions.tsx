import React from 'react';
import {
  PlusCircle,
  Smartphone,
  Users,
  MapPin,
  Download,
  Zap,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle,
} from 'lucide-react';
import { Application, Job } from '../types';

interface AdminQuickActionsProps {
  onOpenCreateJob: () => void;
  onOpenPaymentTester: () => void;
  onViewPendingApplicants: () => void;
  onViewLocationJobs: () => void;
  onViewIndexes: () => void;
  applications: Application[];
  jobs: Job[];
}

export const AdminQuickActions: React.FC<AdminQuickActionsProps> = ({
  onOpenCreateJob,
  onOpenPaymentTester,
  onViewPendingApplicants,
  onViewLocationJobs,
  onViewIndexes,
  applications,
  jobs,
}) => {
  // Export applications to CSV
  const handleExportCSV = () => {
    if (!applications || applications.length === 0) {
      alert('No application records to export.');
      return;
    }

    const headers = [
      'Application ID',
      'Candidate Name',
      'Email',
      'Phone Number',
      'Passport Number',
      'Job Title',
      'Destination Country',
      'County/Region',
      'Fee Amount (KES)',
      'Payment Reference',
      'Status',
      'Date Submitted',
    ];

    const rows = applications.map((a) => [
      `"${a.id}"`,
      `"${a.full_name || a.user?.name || 'Applicant'}"`,
      `"${a.email || a.user?.email || ''}"`,
      `"${a.phone_number || ''}"`,
      `"${a.passport_number}"`,
      `"${a.job?.title || 'General Position'}"`,
      `"${a.job?.country || 'N/A'}"`,
      `"${a.job?.region_county || ''}"`,
      `"${a.job?.fee_amount || 0}"`,
      `"${a.payment_reference || 'Pending'}"`,
      `"${a.current_status}"`,
      `"${a.created_at}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `adecco_applications_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const pendingAppsCount = applications.filter((a) => a.current_status === 'pending_payment').length;
  const activeJobsCount = jobs.filter((j) => j.status === 'active').length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" /> Administrative Quick Action Hub
          </h3>
          <p className="text-xs text-slate-500">Fast one-click shortcuts for primary operational workflows</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {/* 1. Post New Vacancy */}
        <button
          onClick={onOpenCreateJob}
          className="p-4 bg-gradient-to-br from-red-950/40 to-slate-900 border border-red-500/30 hover:border-red-500/60 rounded-2xl text-left transition-all group hover:scale-[1.02] shadow-lg shadow-red-950/20"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="p-2 rounded-xl bg-red-600/20 text-red-400 border border-red-500/30 group-hover:bg-red-600 group-hover:text-white transition-colors">
              <PlusCircle className="w-4 h-4" />
            </span>
            <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-red-400 transition-colors" />
          </div>
          <p className="text-xs font-bold text-white group-hover:text-red-300">Post Vacancy</p>
          <p className="text-[10px] text-slate-400 mt-1">Add international or Kenya county job</p>
        </button>

        {/* 2. Review Pending Applicants */}
        <button
          onClick={onViewPendingApplicants}
          className="p-4 bg-gradient-to-br from-amber-950/40 to-slate-900 border border-amber-500/30 hover:border-amber-500/60 rounded-2xl text-left transition-all group hover:scale-[1.02] shadow-lg shadow-amber-950/20"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="p-2 rounded-xl bg-amber-600/20 text-amber-400 border border-amber-500/30 group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <Users className="w-4 h-4" />
            </span>
            {pendingAppsCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40">
                {pendingAppsCount}
              </span>
            )}
          </div>
          <p className="text-xs font-bold text-white group-hover:text-amber-300">Pending Review</p>
          <p className="text-[10px] text-slate-400 mt-1">Check unpaid & active submissions</p>
        </button>

        {/* 3. Browse Locations & 47 Counties */}
        <button
          onClick={onViewLocationJobs}
          className="p-4 bg-gradient-to-br from-emerald-950/40 to-slate-900 border border-emerald-500/30 hover:border-emerald-500/60 rounded-2xl text-left transition-all group hover:scale-[1.02] shadow-lg shadow-emerald-950/20"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="p-2 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <MapPin className="w-4 h-4" />
            </span>
            <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
              47 Counties
            </span>
          </div>
          <p className="text-xs font-bold text-white group-hover:text-emerald-300">County & Global Jobs</p>
          <p className="text-[10px] text-slate-400 mt-1">Manage jobs by regional destination</p>
        </button>

        {/* 4. Pay Hero STK Live Test */}
        <button
          onClick={onOpenPaymentTester}
          className="p-4 bg-gradient-to-br from-indigo-950/40 to-slate-900 border border-indigo-500/30 hover:border-indigo-500/60 rounded-2xl text-left transition-all group hover:scale-[1.02] shadow-lg shadow-indigo-950/20"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <Smartphone className="w-4 h-4" />
            </span>
            <span className="px-1.5 py-0.5 rounded-full text-[9px] font-mono bg-indigo-500/20 text-indigo-300">
              Live API
            </span>
          </div>
          <p className="text-xs font-bold text-white group-hover:text-indigo-300">Test M-Pesa STK</p>
          <p className="text-[10px] text-slate-400 mt-1">Send probe prompt to Safaricom</p>
        </button>

        {/* 5. Database Performance */}
        <button
          onClick={onViewIndexes}
          className="p-4 bg-gradient-to-br from-cyan-950/40 to-slate-900 border border-cyan-500/30 hover:border-cyan-500/60 rounded-2xl text-left transition-all group hover:scale-[1.02] shadow-lg shadow-cyan-950/20"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="p-2 rounded-xl bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 group-hover:bg-cyan-600 group-hover:text-white transition-colors">
              <Zap className="w-4 h-4" />
            </span>
            <span className="px-1.5 py-0.5 rounded-full text-[9px] font-mono bg-cyan-500/20 text-cyan-300">
              &lt;0.35ms
            </span>
          </div>
          <p className="text-xs font-bold text-white group-hover:text-cyan-300">B-Tree Indexes</p>
          <p className="text-[10px] text-slate-400 mt-1">Sub-millisecond query benchmark</p>
        </button>

        {/* 6. Export Applications CSV */}
        <button
          onClick={handleExportCSV}
          className="p-4 bg-gradient-to-br from-purple-950/40 to-slate-900 border border-purple-500/30 hover:border-purple-500/60 rounded-2xl text-left transition-all group hover:scale-[1.02] shadow-lg shadow-purple-950/20"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="p-2 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30 group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <Download className="w-4 h-4" />
            </span>
            <span className="text-[9px] font-mono text-purple-400">CSV</span>
          </div>
          <p className="text-xs font-bold text-white group-hover:text-purple-300">Export Report</p>
          <p className="text-[10px] text-slate-400 mt-1">Download candidate data snapshot</p>
        </button>
      </div>
    </div>
  );
};
