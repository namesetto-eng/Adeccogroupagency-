import React from 'react';
import { MapPin, Briefcase, DollarSign, Calendar, ArrowRight, ShieldCheck, Smartphone, Users, Heart } from 'lucide-react';
import { Job } from '../types';

interface JobCardProps {
  job: Job;
  onSelectJob: (job: Job) => void;
  onApplyNow: (job: Job) => void;
  isSaved?: boolean;
  onToggleSave?: (job: Job) => void;
}

export const JobCard: React.FC<JobCardProps> = ({
  job,
  onSelectJob,
  onApplyNow,
  isSaved = false,
  onToggleSave,
}) => {
  const getCountryFlag = (country: string) => {
    switch (country.toLowerCase()) {
      case 'canada': return '🇨🇦';
      case 'australia': return '🇦🇺';
      case 'singapore': return '🇸🇬';
      case 'kuwait': return '🇰🇼';
      case 'uk':
      case 'united kingdom': return '🇬🇧';
      case 'usa':
      case 'united states': return '🇺🇸';
      case 'kenya': return '🇰🇪';
      case 'qatar': return '🇶🇦';
      case 'united arab emirates':
      case 'uae': return '🇦🇪';
      case 'saudi arabia': return '🇸🇦';
      case 'germany': return '🇩🇪';
      case 'poland': return '🇵🇱';
      default: return '🌍';
    }
  };

  return (
    <div className="group bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-[#1a1a1a] hover:border-[#E30613]/50 rounded-lg p-6 transition-all duration-300 flex flex-col justify-between relative overflow-hidden accent-border shadow-md dark:shadow-xl">
      
      <div>
        {/* Header Badges & Heart Bookmark Button */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-medium bg-slate-100 dark:bg-[#111] text-slate-800 dark:text-gray-200 border border-slate-200 dark:border-[#222]">
              <span>{getCountryFlag(job.country)}</span>
              <span>{job.country}</span>
              {job.region_county && (
                <span className="text-slate-500 dark:text-gray-400 font-normal">({job.region_county})</span>
              )}
            </span>

            <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#E30613]/10 text-[#E30613] border border-[#E30613]/20">
              <Smartphone className="w-3 h-3" />
              {job.fee_amount > 0 ? `Ksh ${job.fee_amount.toLocaleString()}` : 'Free Application'}
            </span>
          </div>

          {/* Bookmark Heart Button */}
          {onToggleSave && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleSave(job);
              }}
              title={isSaved ? 'Remove from Saved Jobs' : 'Save Job Bookmark'}
              className={`p-1.5 rounded transition-colors ${
                isSaved
                  ? 'bg-[#E30613]/20 text-[#E30613] border border-[#E30613]/40'
                  : 'bg-slate-100 dark:bg-[#111] text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-[#222] hover:border-slate-300 dark:hover:border-[#333]'
              }`}
            >
              <Heart className={`w-4 h-4 ${isSaved ? 'fill-[#E30613]' : ''}`} />
            </button>
          )}
        </div>

        {/* Job Title */}
        <h3 
          onClick={() => onSelectJob(job)}
          className="serif text-lg font-normal text-slate-900 dark:text-white group-hover:text-[#E30613] transition-colors cursor-pointer leading-snug mb-2"
        >
          {job.title}
        </h3>

        {/* Category & Salary */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-gray-400 mb-4 font-medium">
          <span className="flex items-center gap-1 text-slate-700 dark:text-gray-300 bg-slate-100 dark:bg-[#111] px-2.5 py-1 rounded">
            <Briefcase className="w-3.5 h-3.5 text-[#E30613]" />
            {job.category}
          </span>
          {job.salary_range && (
            <span className="flex items-center gap-1 text-emerald-700 dark:text-green-400 bg-emerald-50 dark:bg-green-950/20 px-2.5 py-1 rounded border border-emerald-200 dark:border-green-900/30 font-semibold">
              <DollarSign className="w-3.5 h-3.5" />
              {job.salary_range}
            </span>
          )}
        </div>

        {/* Short Description */}
        <p className="text-slate-600 dark:text-gray-400 text-xs line-clamp-2 leading-relaxed mb-4">
          {job.description}
        </p>

        {/* Requirements Snippet */}
        <div className="bg-slate-50 dark:bg-[#050505] p-3 rounded border border-slate-200 dark:border-[#1a1a1a] mb-5">
          <p className="text-[10px] uppercase tracking-widest text-slate-500 dark:text-gray-500 mb-1 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-amber-500 dark:text-amber-400" /> Requirements Highlight:
          </p>
          <p className="text-xs text-slate-700 dark:text-gray-300 line-clamp-2 font-mono">
            {job.requirements}
          </p>
        </div>
      </div>

      {/* Footer Info & CTA */}
      <div className="pt-4 border-t border-slate-200 dark:border-[#1a1a1a] flex items-center justify-between gap-3">
        <div className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-gray-500 font-medium flex items-center gap-1">
          <Users className="w-3.5 h-3.5 text-slate-400 dark:text-gray-500" />
          <span>{job.positions_available || 10} Slots Left</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onSelectJob(job)}
            className="text-xs font-semibold text-slate-700 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white px-3 py-1.5 bg-slate-100 dark:bg-[#111] hover:bg-slate-200 dark:hover:bg-[#1a1a1a] rounded transition-colors"
          >
            Details
          </button>
          <button
            onClick={() => onApplyNow(job)}
            className="text-xs font-bold bg-[#E30613] hover:bg-red-700 text-white px-3.5 py-1.5 rounded-sm uppercase tracking-wider transition-all flex items-center gap-1"
          >
            Apply Now <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

    </div>
  );
};

