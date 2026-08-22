import React from 'react';
import { ShieldCheck, Globe, CheckCircle2, Award, FileText, Smartphone, Users, MapPin, Building2, PhoneCall } from 'lucide-react';

export const AboutSection: React.FC = () => {
  return (
    <div className="bg-slate-900 py-12 text-slate-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto">
          <span className="text-xs font-bold text-red-400 uppercase tracking-widest block mb-2">
            Licensed Recruitment Platform
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
            About Adecco Group Agency
          </h2>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed font-medium">
            Adecco Group Agency is a leading accredited manpower recruitment firm in East Africa. Inspired by trusted international agency models, we bridge Kenya's talented workforce with top employers across the Middle East, Europe, and locally.
          </p>
        </div>

        {/* Core Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-3 hover:border-red-500/40 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 flex items-center justify-center font-bold">
              <Award className="w-6 h-6 text-amber-400" />
            </div>
            <h3 className="text-lg font-bold text-white">Government Accredited</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Fully registered with NEA (National Employment Authority) & Labor Ministry clearance. We enforce transparent, ethical recruitment guidelines.
            </p>
          </div>

          <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-3 hover:border-red-500/40 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-bold">
              <Smartphone className="w-6 h-6 text-emerald-400" />
            </div>
            <h3 className="text-lg font-bold text-white">Pay Hero M-Pesa Integration</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Seamless application and medical processing fee settlement via Pay Hero STK Push directly from your phone with instant payment verification logs.
            </p>
          </div>

          <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-3 hover:border-red-500/40 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center font-bold">
              <Globe className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="text-lg font-bold text-white">End-to-End Visa Care</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              From contract signing, passport submission, and GAMCA medical screening to embassy visa stamping and airport departure assistance.
            </p>
          </div>

        </div>

        {/* Application Process Timeline */}
        <div className="bg-slate-950 p-8 rounded-3xl border border-slate-800">
          <h3 className="text-xl font-extrabold text-white mb-6 text-center">
            How The Application Process Works
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 relative">
            <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 space-y-2">
              <span className="w-7 h-7 rounded-full bg-red-600 text-white font-bold text-xs flex items-center justify-center">1</span>
              <h4 className="font-bold text-white text-sm">Select & Apply</h4>
              <p className="text-xs text-slate-400">Browse international or local job vacancies and click "Apply Now".</p>
            </div>

            <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 space-y-2">
              <span className="w-7 h-7 rounded-full bg-red-600 text-white font-bold text-xs flex items-center justify-center">2</span>
              <h4 className="font-bold text-white text-sm">Pay Hero STK Push</h4>
              <p className="text-xs text-slate-400">Enter your M-Pesa phone number to authorize the processing fee via Pay Hero STK Push.</p>
            </div>

            <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 space-y-2">
              <span className="w-7 h-7 rounded-full bg-red-600 text-white font-bold text-xs flex items-center justify-center">3</span>
              <h4 className="font-bold text-white text-sm">Passport Review</h4>
              <p className="text-xs text-slate-400">Our HR officers verify your passport and submit credentials for visa approval.</p>
            </div>

            <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 space-y-2">
              <span className="w-7 h-7 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">4</span>
              <h4 className="font-bold text-white text-sm">Deployment</h4>
              <p className="text-xs text-slate-400">Collect your work visa, attend briefing, and depart to your host country.</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
