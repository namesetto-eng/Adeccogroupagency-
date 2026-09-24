import React, { useState, useMemo } from 'react';
import {
  MapPin,
  Globe2,
  Briefcase,
  Search,
  Plus,
  Filter,
  CheckCircle2,
  Clock,
  ArrowRight,
  Building,
  DollarSign,
  ChevronRight,
  TrendingUp,
  Tag,
  Shield,
  Layers,
} from 'lucide-react';
import { Job } from '../types';

interface AdminLocationJobsViewProps {
  jobs: Job[];
  onOpenCreateJobForLocation: (country: string, region: string) => void;
  onOpenEditJob: (job: Job) => void;
  onToggleJobStatus: (job: Job) => void;
}

const KENYA_COUNTIES = [
  'All Kenya Counties',
  'Baringo', 'Bomet', 'Bungoma', 'Busia', 'Elgeyo-Marakwet', 'Embu', 'Garissa',
  'Homa Bay', 'Isiolo', 'Kajiado', 'Kakamega', 'Kericho', 'Kiambu', 'Kilifi',
  'Kirinyaga', 'Kisii', 'Kisumu', 'Kitui', 'Kwale', 'Laikipia', 'Lamu',
  'Machakos', 'Makueni', 'Mandera', 'Marsabit', 'Meru', 'Migori', 'Mombasa',
  "Murang'a", 'Nairobi', 'Nakuru', 'Nandi', 'Narok', 'Nyamira', 'Nyandarua',
  'Nyeri', 'Samburu', 'Siaya', 'Taita Taveta', 'Tana River', 'Tharaka-Nithi',
  'Trans Nzoia', 'Turkana', 'Uasin Gishu', 'Vihiga', 'Wajir', 'West Pokot'
];

const INTERNATIONAL_COUNTRIES = [
  { name: 'Canada', flag: '🇨🇦', fee: 'KES 30,000', regions: ['Ontario', 'British Columbia', 'Alberta', 'Quebec', 'Nova Scotia'] },
  { name: 'Australia', flag: '🇦🇺', fee: 'KES 30,000', regions: ['Queensland', 'New South Wales', 'Victoria', 'Western Australia'] },
  { name: 'UK', flag: '🇬🇧', fee: 'KES 30,000', regions: ['Greater London', 'Manchester', 'Birmingham', 'Edinburgh'] },
  { name: 'USA', flag: '🇺🇸', fee: 'KES 30,000', regions: ['Texas', 'California', 'New York', 'Florida'] },
  { name: 'Germany', flag: '🇩🇪', fee: 'KES 5,000', regions: ['Berlin', 'Munich', 'Hamburg', 'Frankfurt'] },
  { name: 'Poland', flag: '🇵🇱', fee: 'KES 5,000', regions: ['Warsaw', 'Krakow', 'Wroclaw', 'Gdansk'] },
  { name: 'Qatar', flag: '🇶🇦', fee: 'KES 1,500 - 3,500', regions: ['Doha', 'Al Rayyan', 'Al Wakrah', 'Lusail'] },
  { name: 'UAE', flag: '🇦🇪', fee: 'KES 1,500 - 3,500', regions: ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman'] },
  { name: 'Saudi Arabia', flag: '🇸🇦', fee: 'KES 1,500 - 3,500', regions: ['Riyadh', 'Jeddah', 'Dammam', 'Mecca'] },
  { name: 'Singapore', flag: '🇸🇬', fee: 'KES 30,000', regions: ['Central Region', 'Jurong East', 'Changi'] },
  { name: 'Finland', flag: '🇫🇮', fee: 'KES 5,000', regions: ['Helsinki', 'Espoo', 'Tampere', 'Oulu'] },
  { name: 'Turkey', flag: '🇹🇷', fee: 'KES 5,000', regions: ['Istanbul', 'Ankara', 'Izmir', 'Antalya'] },
];

export const AdminLocationJobsView: React.FC<AdminLocationJobsViewProps> = ({
  jobs,
  onOpenCreateJobForLocation,
  onOpenEditJob,
  onToggleJobStatus,
}) => {
  const [selectedCountry, setSelectedCountry] = useState<string>('Kenya');
  const [selectedCounty, setSelectedCounty] = useState<string>('All Kenya Counties');
  const [selectedIntlRegion, setSelectedIntlRegion] = useState<string>('all');
  const [countySearch, setCountySearch] = useState('');
  const [jobSearch, setJobSearch] = useState('');

  // Tally counts per country
  const countryCounts = useMemo(() => {
    const map: Record<string, number> = {};
    jobs.forEach((j) => {
      const c = j.country || 'Other';
      map[c] = (map[c] || 0) + 1;
    });
    return map;
  }, [jobs]);

  // Tally counts per Kenya county
  const countyCounts = useMemo(() => {
    const map: Record<string, number> = {};
    jobs
      .filter((j) => (j.country || '').toLowerCase() === 'kenya')
      .forEach((j) => {
        const rc = j.region_county || 'Unspecified';
        map[rc] = (map[rc] || 0) + 1;
      });
    return map;
  }, [jobs]);

  // Filtered Kenya counties by search query
  const filteredCounties = useMemo(() => {
    if (!countySearch.trim()) return KENYA_COUNTIES;
    const q = countySearch.toLowerCase().trim();
    return KENYA_COUNTIES.filter((c) => c.toLowerCase().includes(q));
  }, [countySearch]);

  // Current jobs matching country and county/region filter
  const currentFilteredJobs = useMemo(() => {
    let list = jobs.filter((j) => (j.country || '').toLowerCase() === selectedCountry.toLowerCase());

    if (selectedCountry === 'Kenya') {
      if (selectedCounty !== 'All Kenya Counties') {
        const qrc = selectedCounty.toLowerCase().replace(/county/gi, '').trim();
        list = list.filter((j) => (j.region_county || '').toLowerCase().includes(qrc));
      }
    } else if (selectedIntlRegion !== 'all') {
      list = list.filter((j) => (j.region_county || '').toLowerCase() === selectedIntlRegion.toLowerCase());
    }

    if (jobSearch.trim()) {
      const q = jobSearch.toLowerCase().trim();
      list = list.filter(
        (j) =>
          j.title.toLowerCase().includes(q) ||
          (j.category || '').toLowerCase().includes(q) ||
          (j.region_county || '').toLowerCase().includes(q) ||
          (j.description || '').toLowerCase().includes(q)
      );
    }

    return list;
  }, [jobs, selectedCountry, selectedCounty, selectedIntlRegion, jobSearch]);

  const activeInLocation = currentFilteredJobs.filter((j) => j.status === 'active').length;
  const currentIntlConfig = INTERNATIONAL_COUNTRIES.find((c) => c.name === selectedCountry);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-3xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-red-600/20 text-red-400 border border-red-500/30">
              <MapPin className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-black text-white">Location & Country Job Management</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Browse and administer vacancy postings across all 47 Kenyan counties and international partner destinations
          </p>
        </div>

        <button
          onClick={() =>
            onOpenCreateJobForLocation(
              selectedCountry,
              selectedCountry === 'Kenya' && selectedCounty !== 'All Kenya Counties' ? selectedCounty : ''
            )
          }
          className="px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-red-600/30 flex items-center gap-2 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add Job in {selectedCountry === 'Kenya' && selectedCounty !== 'All Kenya Counties' ? `${selectedCounty}, Kenya` : selectedCountry}</span>
        </button>
      </div>

      {/* Main Grid: Left Side Menu (Countries & Counties) | Right Main Content (Job Listings) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* SIDE MENU (4 Columns Wide) */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-3xl p-4 space-y-5 shadow-xl sticky top-24">
          
          {/* Countries Selector */}
          <div>
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Globe2 className="w-3.5 h-3.5 text-red-400" /> Select Country
              </span>
              <span className="text-[10px] text-slate-500 font-mono">{jobs.length} Total Jobs</span>
            </div>

            <div className="space-y-1 max-h-52 overflow-y-auto pr-1">
              {/* Primary Kenya Button */}
              <button
                onClick={() => {
                  setSelectedCountry('Kenya');
                  setSelectedCounty('All Kenya Counties');
                }}
                className={`w-full px-3 py-2.5 rounded-xl text-left text-xs font-bold transition-all flex items-center justify-between border ${
                  selectedCountry === 'Kenya'
                    ? 'bg-red-600/20 text-red-300 border-red-500/50 shadow-md'
                    : 'bg-slate-950/60 text-slate-300 hover:bg-slate-800/80 border-slate-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">🇰🇪</span>
                  <span>Kenya (47 Counties)</span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-red-500/20 text-red-400 border border-red-500/30">
                  {countryCounts['Kenya'] || 0}
                </span>
              </button>

              {/* International Country Buttons */}
              {INTERNATIONAL_COUNTRIES.map((c) => {
                const count = countryCounts[c.name] || 0;
                const isSelected = selectedCountry === c.name;
                return (
                  <button
                    key={c.name}
                    onClick={() => {
                      setSelectedCountry(c.name);
                      setSelectedIntlRegion('all');
                    }}
                    className={`w-full px-3 py-2 rounded-xl text-left text-xs font-semibold transition-all flex items-center justify-between border ${
                      isSelected
                        ? 'bg-red-600/20 text-red-300 border-red-500/50 shadow-md'
                        : 'bg-slate-950/40 text-slate-400 hover:text-white hover:bg-slate-800/60 border-slate-800/80'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{c.flag}</span>
                      <span>{c.name}</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* SUB-MENU FOR SELECTED COUNTRY */}
          {selectedCountry === 'Kenya' ? (
            <div className="pt-3 border-t border-slate-800">
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" /> Kenya Counties ({KENYA_COUNTIES.length - 1})
                </span>
                <span className="text-[10px] text-emerald-400 font-mono">KES 500 App Fee</span>
              </div>

              {/* County Search Box */}
              <div className="relative mb-2">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter 47 counties..."
                  value={countySearch}
                  onChange={(e) => setCountySearch(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl pl-8 pr-3 py-1.5 focus:outline-none focus:border-red-500"
                />
              </div>

              {/* Counties List */}
              <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
                {filteredCounties.map((county) => {
                  const isSelected = selectedCounty === county;
                  const cCount = county === 'All Kenya Counties' ? countryCounts['Kenya'] || 0 : countyCounts[county] || 0;
                  return (
                    <button
                      key={county}
                      onClick={() => setSelectedCounty(county)}
                      className={`w-full px-2.5 py-1.5 rounded-lg text-left text-xs transition-all flex items-center justify-between ${
                        isSelected
                          ? 'bg-emerald-600 text-white font-bold shadow-md'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                      }`}
                    >
                      <span className="truncate">{county}</span>
                      <span className={`text-[10px] font-mono ${isSelected ? 'text-white' : 'text-slate-500'}`}>
                        {cCount}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            currentIntlConfig && (
              <div className="pt-3 border-t border-slate-800">
                <div className="flex items-center justify-between mb-2 px-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Regions & Provinces
                  </span>
                  <span className="text-[10px] text-amber-400 font-mono">{currentIntlConfig.fee}</span>
                </div>

                <div className="space-y-1">
                  <button
                    onClick={() => setSelectedIntlRegion('all')}
                    className={`w-full px-3 py-2 rounded-xl text-left text-xs font-bold transition-all flex items-center justify-between ${
                      selectedIntlRegion === 'all'
                        ? 'bg-red-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <span>All {selectedCountry} Regions</span>
                    <span className="text-[10px] font-mono">{countryCounts[selectedCountry] || 0}</span>
                  </button>

                  {currentIntlConfig.regions.map((reg) => (
                    <button
                      key={reg}
                      onClick={() => setSelectedIntlRegion(reg)}
                      className={`w-full px-3 py-1.5 rounded-lg text-left text-xs transition-all flex items-center justify-between ${
                        selectedIntlRegion === reg
                          ? 'bg-red-600 text-white font-bold shadow-md'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                      }`}
                    >
                      <span>{reg}</span>
                      <ChevronRight className="w-3.5 h-3.5 opacity-50" />
                    </button>
                  ))}
                </div>
              </div>
            )
          )}
        </div>

        {/* MAIN JOBS PANEL (8 Columns Wide) */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* Active Location Info & Metrics Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">
                    {selectedCountry === 'Kenya' ? '🇰🇪' : currentIntlConfig?.flag || '🌍'}
                  </span>
                  <h3 className="text-lg font-black text-white">
                    {selectedCountry === 'Kenya'
                      ? selectedCounty === 'All Kenya Counties'
                        ? 'All 47 Kenyan Counties'
                        : `${selectedCounty} County, Kenya`
                      : `${selectedCountry} (${selectedIntlRegion === 'all' ? 'All Regions' : selectedIntlRegion})`}
                  </h3>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Showing {currentFilteredJobs.length} listings ({activeInLocation} active candidates recruitment)
                </p>
              </div>

              {/* Job Search Input */}
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search in this location..."
                  value={jobSearch}
                  onChange={(e) => setJobSearch(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white text-xs rounded-xl pl-8 pr-3 py-2 focus:outline-none focus:border-red-500"
                />
              </div>
            </div>
          </div>

          {/* Job Listings Grid */}
          {currentFilteredJobs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentFilteredJobs.slice(0, 30).map((job) => (
                <div
                  key={job.id}
                  className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 transition-all space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-bold text-white line-clamp-1">{job.title}</h4>
                      <button
                        onClick={() => onToggleJobStatus(job)}
                        className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase shrink-0 border cursor-pointer ${
                          job.status === 'active'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        {job.status}
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <Building className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="truncate">{job.category}</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <MapPin className="w-3.5 h-3.5 text-red-400 shrink-0" />
                      <span>{job.region_county ? `${job.region_county}, ` : ''}{job.country}</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-mono block">Application Fee</span>
                      <span className="font-mono font-bold text-emerald-400">
                        KES {job.fee_amount.toLocaleString()}
                      </span>
                    </div>

                    <button
                      onClick={() => onOpenEditJob(job)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors"
                    >
                      Edit Vacancy
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center space-y-3">
              <MapPin className="w-10 h-10 text-slate-600 mx-auto" />
              <h4 className="text-base font-bold text-white">No Vacancies in this Location</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                There are currently no job listings recorded for {selectedCountry} {selectedCounty !== 'All Kenya Counties' ? `(${selectedCounty})` : ''}.
              </p>
              <button
                onClick={() =>
                  onOpenCreateJobForLocation(
                    selectedCountry,
                    selectedCountry === 'Kenya' && selectedCounty !== 'All Kenya Counties' ? selectedCounty : ''
                  )
                }
                className="mt-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-red-600/30 inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Add First Listing Here
              </button>
            </div>
          )}

          {currentFilteredJobs.length > 30 && (
            <p className="text-center text-xs text-slate-500 pt-2 font-mono">
              Showing first 30 of {currentFilteredJobs.length} listings in this region
            </p>
          )}

        </div>

      </div>
    </div>
  );
};
