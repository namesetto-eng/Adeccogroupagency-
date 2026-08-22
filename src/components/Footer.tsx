import React from 'react';
import { Briefcase, Shield, Mail, MapPin, Smartphone, Award } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-950 border-t border-slate-800 text-slate-400 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Col 1: Brand Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white font-bold">
                <Briefcase className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-white text-lg tracking-tight">
                ADECCO GROUP AGENCY
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Licensed international workforce recruitment & employment agency based in Nairobi, Kenya. Partnered with foreign labor ministries and employers across Qatar, UAE, Saudi Arabia, Germany, and Poland.
            </p>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 pt-1">
              <Award className="w-4 h-4 text-amber-400" />
              <span>NEA License No: NEA/092/2026</span>
            </div>
          </div>

          {/* Col 2: Destination Countries */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
              Top Destination Countries
            </h4>
            <ul className="space-y-2 text-xs">
              <li className="hover:text-white cursor-pointer transition-colors">🇶🇦 Qatar (Doha & Lusail)</li>
              <li className="hover:text-white cursor-pointer transition-colors">🇦🇪 UAE (Dubai & Abu Dhabi)</li>
              <li className="hover:text-white cursor-pointer transition-colors">🇸🇦 Saudi Arabia (Riyadh & Jeddah)</li>
              <li className="hover:text-white cursor-pointer transition-colors">🇩🇪 Germany (Frankfurt & Berlin)</li>
              <li className="hover:text-white cursor-pointer transition-colors">🇵🇱 Poland (Warsaw & Krakow)</li>
            </ul>
          </div>

          {/* Col 3: Pay Hero M-Pesa Security */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
              Pay Hero M-Pesa Integration
            </h4>
            <div className="bg-slate-900 p-3.5 rounded-2xl border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <Smartphone className="w-4 h-4" /> Instant STK Push
              </div>
              <p className="text-[11px] text-slate-400">
                Application and medical verification fees are authorized securely via Pay Hero M-Pesa STK push directly from your mobile device.
              </p>
            </div>
          </div>

          {/* Col 4: Corporate Office */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
              Nairobi Agency Office
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>Adecco Agency House, 4th Floor, Upper Hill, Nairobi, Kenya</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-red-400 shrink-0" />
                <span>recruitment@adeccogroup.co.ke</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-900 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 Adecco Group Agency. All Rights Reserved.</p>
          <div className="flex items-center gap-4 text-slate-400">
            <span className="hover:text-white cursor-pointer">Terms of Service</span>
            <span>•</span>
            <span className="hover:text-white cursor-pointer">Privacy Policy</span>
            <span>•</span>
            <span className="hover:text-white cursor-pointer">Anti-Trafficking Policy</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
