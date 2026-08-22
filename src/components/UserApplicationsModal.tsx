import React, { useState, useEffect } from 'react';
import { X, FileText, CheckCircle2, Clock, Smartphone, AlertCircle, RefreshCw, ExternalLink } from 'lucide-react';
import { Application } from '../types';
import { api } from '../lib/api';

interface UserApplicationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPayForApp: (app: Application) => void;
}

export const UserApplicationsModal: React.FC<UserApplicationsModalProps> = ({
  isOpen,
  onClose,
  onPayForApp,
}) => {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchMyApps = async () => {
    setLoading(true);
    try {
      const data = await api.getMyApplications();
      setApps(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load applications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchMyApps();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const getStatusBadge = (status: Application['current_status']) => {
    switch (status) {
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" /> Fee Paid
          </span>
        );
      case 'under_review':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Clock className="w-3.5 h-3.5" /> Under Embassy Review
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" /> Visa Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/20">
            <AlertCircle className="w-3.5 h-3.5" /> Rejected
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-500/20 text-red-300 border border-red-500/40">
            <AlertCircle className="w-3.5 h-3.5 text-red-400" /> Payment Failed / Timed Out
          </span>
        );
      case 'pending_payment':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <Smartphone className="w-3.5 h-3.5" /> Payment Pending
          </span>
        );
    }
  };

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
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">My Applications</h2>
              <p className="text-xs text-slate-400">Track application status & M-Pesa payment records</p>
            </div>
          </div>
          <button
            onClick={fetchMyApps}
            className="text-xs text-slate-400 hover:text-white p-2 bg-slate-800 rounded-lg flex items-center gap-1"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>

        {/* Modal Body */}
        {loading ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            Loading your application records...
          </div>
        ) : apps.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm bg-slate-950/60 rounded-2xl border border-slate-800">
            You have not submitted any job applications yet.
          </div>
        ) : (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            {apps.map((app) => (
              <div 
                key={app.id} 
                className="bg-slate-950 p-5 rounded-2xl border border-slate-800 hover:border-slate-700 transition-colors space-y-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-white text-base">
                      {app.job?.title || 'Job Listing'}
                    </h4>
                    <p className="text-xs text-slate-400">
                      Destination: <span className="text-amber-300 font-semibold">{app.job?.country || 'International'}</span>
                    </p>
                  </div>
                  <div>
                    {getStatusBadge(app.current_status)}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-slate-900/80 p-3 rounded-xl text-xs font-mono">
                  <div>
                    <span className="block text-[10px] text-slate-500 uppercase">App Ref:</span>
                    <span className="text-slate-200 font-bold">{app.id}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-500 uppercase">
                      {app.job?.country?.toLowerCase() === 'kenya' ? 'National ID:' : 'Passport No:'}
                    </span>
                    <span className="text-amber-300 font-bold">{app.passport_number}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-500 uppercase">M-Pesa Ref:</span>
                    <span className="text-emerald-400 font-bold truncate block">{app.payment_reference || 'N/A'}</span>
                  </div>
                </div>

                {(app.current_status === 'pending_payment' || app.current_status === 'failed') && (
                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => {
                        onClose();
                        if (app.job) {
                          onPayForApp(app);
                        }
                      }}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5"
                    >
                      <Smartphone className="w-3.5 h-3.5" /> {app.current_status === 'failed' ? 'Retry Pay Hero M-Pesa Payment' : 'Complete Pay Hero M-Pesa Payment'}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};
