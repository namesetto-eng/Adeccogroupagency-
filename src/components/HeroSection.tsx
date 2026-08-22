import React, { useState, useEffect, useRef } from 'react';
import { Search, Globe, ShieldCheck, Zap, Award, MapPin, Building2, Smartphone, Loader2, X, Briefcase, Sparkles, ArrowRight } from 'lucide-react';
import { Job } from '../types';

interface HeroSectionProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedCountry: string;
  setSelectedCountry: (c: string) => void;
  selectedRegionCounty?: string;
  setSelectedRegionCounty?: (rc: string) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  onSearchClick: () => void;
  jobs?: Job[];
}

interface SuggestionItem {
  id: string;
  title: string;
  type: 'job' | 'keyword' | 'category';
  category?: string;
  country?: string;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  searchQuery,
  setSearchQuery,
  selectedCountry,
  setSelectedCountry,
  selectedRegionCounty,
  setSelectedRegionCounty,
  selectedCategory,
  setSelectedCategory,
  onSearchClick,
  jobs = [],
}) => {
  const [inputValue, setInputValue] = useState(searchQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(searchQuery);
  const [isDebouncing, setIsDebouncing] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Sync internal state if parent searchQuery changes externally
  useEffect(() => {
    setInputValue(searchQuery);
  }, [searchQuery]);

  // Debounce logic: 300ms delay before pushing to parent searchQuery
  useEffect(() => {
    if (inputValue.trim() !== searchQuery.trim()) {
      setIsDebouncing(true);
    }
    const timer = setTimeout(() => {
      setDebouncedQuery(inputValue);
      setSearchQuery(inputValue);
      setIsDebouncing(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [inputValue]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute keyword suggestions based on job titles and categories
  const getSuggestions = (): SuggestionItem[] => {
    const query = inputValue.trim().toLowerCase();
    if (!query) return [];

    const results: SuggestionItem[] = [];
    const seenTitles = new Set<string>();

    // 1. Direct Job Title Matches
    jobs.forEach((job) => {
      if (job.title.toLowerCase().includes(query) && !seenTitles.has(job.title.toLowerCase())) {
        seenTitles.add(job.title.toLowerCase());
        results.push({
          id: `job-${job.id}`,
          title: job.title,
          type: 'job',
          category: job.category,
          country: job.country,
        });
      }
    });

    // 2. Default popular industry job keywords fallback if no exact job title or to enrich
    const popularKeywords = [
      'Heavy Equipment Driver',
      'Hotel Receptionist',
      'Registered Nurse',
      'Security Officer',
      'Plumber & Pipefitter',
      'Certified Electrician',
      'Store Keeper',
      'Catering Supervisor',
      'Housekeeping Assistant',
      'Logistics Coordinator',
      'HVAC Technician',
      'Construction Inspector',
      'Executive Assistant',
      'Warehouse Operator',
    ];

    popularKeywords.forEach((keyword) => {
      if (keyword.toLowerCase().includes(query) && !seenTitles.has(keyword.toLowerCase())) {
        seenTitles.add(keyword.toLowerCase());
        results.push({
          id: `kw-${keyword}`,
          title: keyword,
          type: 'keyword',
        });
      }
    });

    return results.slice(0, 6);
  };

  const suggestions = getSuggestions();

  const handleSelectSuggestion = (item: SuggestionItem) => {
    setInputValue(item.title);
    setSearchQuery(item.title);
    setIsOpen(false);
    setSelectedIndex(-1);
    onSearchClick();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) {
      if (e.key === 'Enter') {
        onSearchClick();
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
        handleSelectSuggestion(suggestions[selectedIndex]);
      } else {
        onSearchClick();
        setIsOpen(false);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleClearInput = () => {
    setInputValue('');
    setSearchQuery('');
    setIsOpen(false);
  };

  const countries = [
    { id: 'all', name: 'All Destinations', flag: '🌍' },
    { id: 'Canada', name: 'Canada', flag: '🇨🇦' },
    { id: 'Australia', name: 'Australia', flag: '🇦🇺' },
    { id: 'Singapore', name: 'Singapore', flag: '🇸🇬' },
    { id: 'Kuwait', name: 'Kuwait', flag: '🇰🇼' },
    { id: 'UK', name: 'United Kingdom (UK)', flag: '🇬🇧' },
    { id: 'USA', name: 'United States (USA)', flag: '🇺🇸' },
    { id: 'Qatar', name: 'Qatar', flag: '🇶🇦' },
    { id: 'Saudi Arabia', name: 'Saudi Arabia', flag: '🇸🇦' },
    { id: 'UAE', name: 'United Arab Emirates (UAE)', flag: '🇦🇪' },
    { id: 'Oman', name: 'Oman', flag: '🇴🇲' },
    { id: 'Germany', name: 'Germany', flag: '🇩🇪' },
    { id: 'Poland', name: 'Poland', flag: '🇵🇱' },
    { id: 'Finland', name: 'Finland', flag: '🇫🇮' },
    { id: 'Turkey', name: 'Turkey', flag: '🇹🇷' },
    { id: 'Iraq', name: 'Iraq', flag: '🇮🇶' },
    { id: 'Iran', name: 'Iran', flag: '🇮🇷' },
    { id: 'Kenya', name: 'Kenya (Local)', flag: '🇰🇪' },
  ];

  const categories = [
    'All Categories',
    'Healthcare',
    'Logistics & Supply Chain',
    'Agriculture & Farming',
    'Hospitality & Culinary',
    'Construction & Engineering',
    'IT & Software Development',
    'Customer Care & Sales',
    'General Manual Labor',
    'Administrative Support',
    'Finance & Accounting',
    'Education & Training',
    'Oil & Gas Engineering',
    'Manufacturing & Assembly',
    'Automotive Services',
    'Retail Management',
  ];

  // Helper to highlight matching text in suggestions
  const renderHighlightedText = (text: string, highlight: string) => {
    if (!highlight.trim()) return <span>{text}</span>;
    const parts = text.split(new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return (
      <span>
        {parts.map((part, index) =>
          part.toLowerCase() === highlight.toLowerCase() ? (
            <span key={index} className="text-[#E30613] font-bold underline bg-[#E30613]/10 px-0.5 rounded">
              {part}
            </span>
          ) : (
            <span key={index}>{part}</span>
          )
        )}
      </span>
    );
  };

  return (
    <div className="relative bg-[#0a0a0a] border-b border-[#1a1a1a] pt-10 pb-16 overflow-hidden">
      {/* Background Accent Glows */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#E30613]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Top Badges */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold bg-[#E30613]/10 text-[#E30613] border border-[#E30613]/20">
            <Award className="w-3.5 h-3.5 text-amber-400" /> Government Accredited Manpower Agency
          </span>
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Smartphone className="w-3.5 h-3.5 text-emerald-400" /> Instant M-Pesa STK Push via Pay Hero
          </span>
        </div>

        {/* Main Headline */}
        <div className="text-center max-w-4xl mx-auto mb-10">
          <h1 className="serif text-3xl sm:text-5xl font-normal text-white tracking-tight leading-tight mb-4">
            Your Gateway to <span className="italic text-[#E30613]">Global & Local</span> Career Opportunities
          </h1>
          <p className="text-gray-300 text-base sm:text-lg max-w-2xl mx-auto font-normal">
            Adecco Group Agency connects skilled job seekers with verified employers across the Gulf Region, Europe, and Kenya. Apply online with instant M-Pesa application fee processing.
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="glass-card p-4 sm:p-5 rounded-xl shadow-2xl max-w-5xl mx-auto accent-border">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            
            {/* Keyword Search with Debounced Suggestions */}
            <div className="md:col-span-5 relative" ref={searchContainerRef}>
              <label className="block text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1 flex items-center justify-between">
                <span>Job Title / Keywords</span>
                {isDebouncing && (
                  <span className="text-[9px] text-[#E30613] flex items-center gap-1 normal-case font-mono">
                    <Loader2 className="w-3 h-3 animate-spin" /> Debouncing (300ms)...
                  </span>
                )}
              </label>
              
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => {
                    setInputValue(e.target.value);
                    setIsOpen(true);
                  }}
                  onFocus={() => setIsOpen(true)}
                  onKeyDown={handleKeyDown}
                  placeholder="e.g. Heavy Driver, Receptionist, Nurse..."
                  className="w-full bg-[#050505] border border-[#222] text-white text-sm rounded-lg pl-9 pr-9 py-2.5 focus:outline-none focus:border-[#E30613] focus:ring-1 focus:ring-[#E30613] transition-all"
                />

                {inputValue && (
                  <button
                    onClick={handleClearInput}
                    className="absolute right-3 top-3 text-gray-400 hover:text-white p-0.5"
                    title="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Debounced Suggestion Auto-complete Dropdown */}
              {isOpen && inputValue.trim().length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-[#0c0c0c] border border-[#222] rounded-lg shadow-2xl z-50 overflow-hidden divide-y divide-[#1a1a1a] animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="px-3 py-1.5 bg-[#111] text-[10px] uppercase font-bold tracking-wider text-gray-400 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-[#E30613]" /> Suggested Vacancy Titles
                    </span>
                    <span className="text-[9px] font-normal text-gray-500 font-mono">
                      Auto-filtered
                    </span>
                  </div>

                  {suggestions.length === 0 ? (
                    <div className="px-4 py-3 text-xs text-gray-400 text-center">
                      No matching job titles found for <span className="text-white font-semibold">"{inputValue}"</span>.
                      <p className="text-[10px] text-gray-500 mt-1">Press Enter to search all vacancies.</p>
                    </div>
                  ) : (
                    <div className="max-h-60 overflow-y-auto">
                      {suggestions.map((item, index) => (
                        <div
                          key={item.id}
                          onClick={() => handleSelectSuggestion(item)}
                          onMouseEnter={() => setSelectedIndex(index)}
                          className={`px-3.5 py-2.5 cursor-pointer text-xs flex items-center justify-between transition-colors ${
                            index === selectedIndex
                              ? 'bg-[#E30613]/15 text-white font-medium border-l-2 border-[#E30613]'
                              : 'text-gray-300 hover:bg-[#111]'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            <Briefcase className="w-3.5 h-3.5 text-[#E30613] shrink-0" />
                            <span className="truncate">
                              {renderHighlightedText(item.title, inputValue)}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {item.category && (
                              <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-[#111] text-gray-400 border border-[#222]">
                                {item.category}
                              </span>
                            )}
                            {item.country && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#111] text-gray-300 border border-[#222]">
                                {item.country}
                              </span>
                            )}
                            <ArrowRight className="w-3 h-3 text-gray-500" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="px-3 py-1.5 bg-[#080808] text-[9px] text-gray-500 flex items-center justify-between font-mono">
                    <span>Press ↵ Enter to apply search</span>
                    <span>300ms Debounce</span>
                  </div>
                </div>
              )}
            </div>

            {/* Destination Country */}
            <div className="md:col-span-3">
              <label className="block text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">
                Destination Country
              </label>
              <div className="relative">
                <Globe className="w-4 h-4 text-gray-400 absolute left-3 top-3 pointer-events-none" />
                <select
                  value={selectedCountry}
                  onChange={(e) => setSelectedCountry(e.target.value)}
                  className="w-full bg-[#050505] border border-[#222] text-white text-sm rounded-lg pl-9 pr-3 py-2.5 focus:outline-none focus:border-[#E30613] focus:ring-1 focus:ring-[#E30613] appearance-none cursor-pointer"
                >
                  {countries.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.flag} {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* County / Region Text Input */}
            <div className="md:col-span-2">
              <label className="block text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">
                County / Region
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-gray-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="text"
                  placeholder="e.g. Nairobi, London..."
                  value={selectedRegionCounty || ''}
                  onChange={(e) => setSelectedRegionCounty?.(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && onSearchClick()}
                  className="w-full bg-[#050505] border border-[#222] text-white text-sm rounded-lg pl-9 pr-3 py-2.5 focus:outline-none focus:border-[#E30613] focus:ring-1 focus:ring-[#E30613]"
                />
              </div>
            </div>

            {/* Job Category */}
            <div className="md:col-span-2">
              <label className="block text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">
                Sector / Industry
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-gray-400 absolute left-3 top-3 pointer-events-none" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full bg-[#050505] border border-[#222] text-white text-sm rounded-lg pl-9 pr-[28px] py-2.5 focus:outline-none focus:border-[#E30613] focus:ring-1 focus:ring-[#E30613] appearance-none cursor-pointer"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat === 'All Categories' ? 'all' : cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

          </div>

          {/* Quick Filter Country Chips */}
          <div className="mt-4 pt-3 border-t border-[#1a1a1a] flex flex-wrap items-center gap-2">
            <span className="text-xs text-gray-400 font-semibold flex items-center gap-1 mr-1">
              <MapPin className="w-3.5 h-3.5 text-[#E30613]" /> Popular Destinations:
            </span>
            {countries.slice(1).map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCountry(c.id)}
                className={`text-xs px-3 py-1 rounded transition-all flex items-center gap-1.5 ${
                  selectedCountry === c.id
                    ? 'bg-[#E30613] text-white font-bold shadow-md shadow-[#E30613]/20'
                    : 'bg-[#050505] text-gray-300 border border-[#222] hover:bg-[#111]'
                }`}
              >
                <span>{c.flag}</span>
                <span>{c.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Agency Trust Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 pt-8 border-t border-[#1a1a1a] max-w-5xl mx-auto">
          <div className="text-center p-3 rounded-lg bg-[#050505] border border-[#1a1a1a]">
            <p className="serif text-2xl sm:text-3xl text-[#E30613]">12,500+</p>
            <p className="text-xs text-gray-400 font-medium">Successful Placements</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-[#050505] border border-[#1a1a1a]">
            <p className="serif text-2xl sm:text-3xl text-amber-400">15+</p>
            <p className="text-xs text-gray-400 font-medium">International Countries</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-[#050505] border border-[#1a1a1a]">
            <p className="serif text-2xl sm:text-3xl text-emerald-400">100%</p>
            <p className="text-xs text-gray-400 font-medium">Pay Hero M-Pesa Secured</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-[#050505] border border-[#1a1a1a]">
            <p className="serif text-2xl sm:text-3xl text-blue-400">24/7</p>
            <p className="text-xs text-gray-400 font-medium">Applicant Support</p>
          </div>
        </div>

      </div>
    </div>
  );
};

