import React from 'react';
import { X, MapPin, Briefcase, DollarSign, ShieldCheck, CheckCircle2, FileText, Smartphone, ArrowRight, Building2, Users } from 'lucide-react';
import { Job } from '../types';

interface JobDetailModalProps {
  job: Job | null;
  onClose: () => void;
  onApply: (job: Job) => void;
}

export const JobDetailModal: React.FC<JobDetailModalProps> = ({ job, onClose, onApply }) => {
  if (!job) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div 
        className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 text-white relative shadow-2xl my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-6">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="px-3 py-1 bg-[#E30613]/10 text-[#E30613] border border-[#E30613]/20 rounded-full text-xs font-bold">
              {job.country} {job.region_county ? `(${job.region_county})` : ''}
            </span>
            <span className="px-3 py-1 bg-slate-800 text-slate-300 border border-slate-700 rounded-full text-xs font-medium">
              {job.category}
            </span>
            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-bold">
              Pay Hero M-Pesa Verified
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight mb-2">
            {job.title}
          </h2>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 font-medium">
            {job.salary_range && (
              <span className="flex items-center gap-1 text-emerald-400 font-semibold bg-emerald-950/40 px-3 py-1 rounded-lg border border-emerald-900/50">
                <DollarSign className="w-4 h-4" /> {job.salary_range}
              </span>
            )}
            <span className="flex items-center gap-1 bg-slate-800 px-3 py-1 rounded-lg">
              <Users className="w-4 h-4 text-amber-400" /> {job.positions_available || 15} Slots Available
            </span>
            <span className="flex items-center gap-1 bg-slate-800 px-3 py-1 rounded-lg">
              <Smartphone className="w-4 h-4 text-rose-400" /> {job.fee_amount > 0 ? `Application Fee: Ksh ${job.fee_amount.toLocaleString()}` : 'Free Application'}
            </span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="space-y-6 text-sm text-slate-300 border-t border-b border-slate-800 py-6 my-6">
          
          {/* Job Overview */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-red-400" /> Position Overview
            </h4>
            <p className="leading-relaxed bg-slate-950/50 p-4 rounded-2xl border border-slate-800/80 text-slate-200">
              {job.description}
            </p>
          </div>

          {/* Key Requirements */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-amber-400" /> Candidate Requirements
            </h4>
            <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800/80">
              <p className="leading-relaxed whitespace-pre-line text-slate-200 font-mono text-xs">
                {job.requirements}
              </p>
            </div>
          </div>

          {/* Placement Benefits & Guarantee */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Benefits Included by Employer
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-800/50 p-2.5 rounded-xl border border-slate-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Work Visa & Entry Clearance</span>
              </div>
              <div className="bg-slate-800/50 p-2.5 rounded-xl border border-slate-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Company Accommodation & Transport</span>
              </div>
              <div className="bg-slate-800/50 p-2.5 rounded-xl border border-slate-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Full Medical & Life Insurance</span>
              </div>
              <div className="bg-slate-800/50 p-2.5 rounded-xl border border-slate-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Annual Flight Ticket Back Home</span>
              </div>
            </div>
          </div>

          {/* Pay Hero M-Pesa Application Fee Note */}
          <div className="bg-gradient-to-r from-red-950/40 via-rose-950/30 to-slate-900 border border-red-500/30 p-4 rounded-2xl flex items-start gap-3">
            <Smartphone className="w-6 h-6 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-red-300 text-xs mb-0.5">Pay Hero M-Pesa Fee Notice</p>
              <p className="text-xs text-slate-300 leading-snug">
                An application and embassy processing fee of <strong className="text-white">KES {job.fee_amount.toLocaleString()}</strong> is required upon submitting your application. Payments are processed instantly via Pay Hero M-Pesa STK push.
              </p>
            </div>
          </div>

        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold rounded-xl transition-colors"
          >
            Close
          </button>
          <button
            onClick={() => {
              onClose();
              onApply(job);
            }}
            className="px-6 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-red-600/30 transition-all flex items-center gap-2 hover:scale-[1.02]"
          >
            Start Application <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
