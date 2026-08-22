import React from 'react';
import { Heart, X, Briefcase, MapPin, DollarSign, ArrowRight, Trash2, Smartphone, ShieldCheck } from 'lucide-react';
import { Job } from '../types';

interface SavedJobsModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedJobs: Job[];
  onRemoveSavedJob: (jobId: string) => void;
  onSelectJob: (job: Job) => void;
  onApplyNow: (job: Job) => void;
}

export const SavedJobsModal: React.FC<SavedJobsModalProps> = ({
  isOpen,
  onClose,
  savedJobs,
  onRemoveSavedJob,
  onSelectJob,
  onApplyNow,
}) => {
  if (!isOpen) return null;

  const getCountryFlag = (country: string) => {
    switch (country.toLowerCase()) {
      case 'qatar': return '🇶🇦';
      case 'united arab emirates':
      case 'uae': return '🇦🇪';
      case 'saudi arabia': return '🇸🇦';
      case 'germany': return '🇩🇪';
      case 'poland': return '🇵🇱';
      case 'kenya': return '🇰🇪';
      default: return '🌍';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="glass-card w-full max-w-2xl rounded-lg border border-[#222] p-6 shadow-2xl relative my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#222] pb-4 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-md bg-[#E30613]/10 border border-[#E30613]/30 flex items-center justify-center text-[#E30613]">
              <Heart className="w-5 h-5 fill-[#E30613]" />
            </div>
            <div>
              <h2 className="serif text-xl text-white font-normal">
                Saved Job Bookmarks
              </h2>
              <p className="text-xs text-gray-500">
                {savedJobs.length} {savedJobs.length === 1 ? 'vacancy' : 'vacancies'} saved to your personal shortlist
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white bg-[#111] hover:bg-[#1a1a1a] rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Saved Jobs List */}
        {savedJobs.length === 0 ? (
          <div className="py-12 text-center space-y-3 bg-[#050505] rounded border border-[#1a1a1a] p-8">
            <Heart className="w-10 h-10 text-gray-600 mx-auto" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">No Saved Vacancies</h3>
            <p className="text-xs text-gray-400 max-w-md mx-auto">
              You haven't bookmarked any job listings yet. Click the heart icon on any job card to save it for quick access later.
            </p>
          </div>
        ) : (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            {savedJobs.map((job) => (
              <div
                key={job.id}
                className="bg-[#050505] p-4 rounded border border-[#1a1a1a] hover:border-[#333] transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-medium px-2 py-0.5 rounded bg-[#111] text-gray-200 border border-[#222]">
                      {getCountryFlag(job.country)} {job.country}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-[#E30613] bg-[#E30613]/10 px-2 py-0.5 rounded border border-[#E30613]/20">
                      {job.category}
                    </span>
                    {job.salary_range && (
                      <span className="text-xs text-green-400 font-mono font-semibold">
                        {job.salary_range}
                      </span>
                    )}
                  </div>

                  <h3
                    onClick={() => {
                      onClose();
                      onSelectJob(job);
                    }}
                    className="serif text-base text-white hover:text-[#E30613] cursor-pointer transition-colors"
                  >
                    {job.title}
                  </h3>

                  <p className="text-xs text-gray-400 line-clamp-1">
                    {job.description}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    onClick={() => {
                      onClose();
                      onSelectJob(job);
                    }}
                    className="text-xs font-semibold px-3 py-1.5 bg-[#111] hover:bg-[#1a1a1a] text-gray-200 rounded transition-colors"
                  >
                    View
                  </button>

                  <button
                    onClick={() => {
                      onClose();
                      onApplyNow(job);
                    }}
                    className="text-xs font-bold px-3 py-1.5 bg-[#E30613] hover:bg-red-700 text-white rounded-sm uppercase tracking-wider transition-colors flex items-center gap-1"
                  >
                    Apply <ArrowRight className="w-3 h-3" />
                  </button>

                  <button
                    onClick={() => onRemoveSavedJob(job.id)}
                    title="Remove bookmark"
                    className="p-1.5 text-gray-500 hover:text-[#E30613] bg-[#111] hover:bg-[#1a1a1a] rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-[#222] flex items-center justify-between text-xs text-gray-500">
          <span>Bookmarks saved in your browser</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#111] hover:bg-[#1a1a1a] text-gray-300 rounded text-xs font-semibold"
          >
            Close Window
          </button>
        </div>

      </div>
    </div>
  );
};
