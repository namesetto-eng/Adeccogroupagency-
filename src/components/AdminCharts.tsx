import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Application } from '../types';
import { TrendingUp, PieChart as PieIcon, Calendar, CheckCircle2, Clock, XCircle, ArrowUpRight } from 'lucide-react';

interface AdminChartsProps {
  applications: Application[];
  className?: string;
}

const STATUS_COLORS: Record<string, { bg: string; text: string; hex: string }> = {
  paid: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', hex: '#10B981' },
  approved: { bg: 'bg-green-500/10', text: 'text-green-400', hex: '#22C55E' },
  pending_payment: { bg: 'bg-amber-500/10', text: 'text-amber-400', hex: '#F59E0B' },
  under_review: { bg: 'bg-blue-500/10', text: 'text-blue-400', hex: '#3B82F6' },
  submitted: { bg: 'bg-indigo-500/10', text: 'text-indigo-400', hex: '#6366F1' },
  failed: { bg: 'bg-rose-500/10', text: 'text-rose-400', hex: '#F43F5E' },
  rejected: { bg: 'bg-slate-500/10', text: 'text-slate-400', hex: '#64748B' },
};

const DEFAULT_COLOR = '#94A3B8';

export const AdminCharts: React.FC<AdminChartsProps> = ({ applications, className = '' }) => {
  const [timeRange, setTimeRange] = useState<'7d' | '14d' | '30d'>('14d');

  // Compute daily application trends
  const trendData = useMemo(() => {
    const days = timeRange === '7d' ? 7 : timeRange === '14d' ? 14 : 30;
    const now = new Date();
    const dateMap = new Map<string, { date: string; displayDate: string; total: number; paid: number; pending: number }>();

    // Seed all days in range so chart is continuous
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      const displayDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      dateMap.set(key, { date: key, displayDate, total: 0, paid: 0, pending: 0 });
    }

    // Tally applications
    applications.forEach((app) => {
      if (!app.created_at) return;
      const appDate = app.created_at.split('T')[0];
      if (dateMap.has(appDate)) {
        const item = dateMap.get(appDate)!;
        item.total += 1;
        if (app.current_status === 'paid' || app.current_status === 'approved') {
          item.paid += 1;
        } else {
          item.pending += 1;
        }
      }
    });

    return Array.from(dateMap.values());
  }, [applications, timeRange]);

  // Compute applications by status for Pie Chart
  const statusData = useMemo(() => {
    const counts: Record<string, number> = {};
    applications.forEach((app) => {
      const s = (app.current_status || 'submitted').toLowerCase();
      counts[s] = (counts[s] || 0) + 1;
    });

    const formatLabel = (status: string) => {
      switch (status) {
        case 'paid':
          return 'Paid / Settled';
        case 'pending_payment':
          return 'Pending Payment';
        case 'failed':
          return 'Failed / Timeout';
        case 'approved':
          return 'Approved';
        case 'under_review':
          return 'Under Review';
        case 'rejected':
          return 'Rejected';
        default:
          return status.replace(/_/g, ' ').toUpperCase();
      }
    };

    return Object.entries(counts).map(([status, count]) => ({
      name: formatLabel(status),
      statusKey: status,
      value: count,
      color: STATUS_COLORS[status]?.hex || DEFAULT_COLOR,
    }));
  }, [applications]);

  const totalApplicationsCount = applications.length;
  const paidCount = applications.filter((a) => a.current_status === 'paid' || a.current_status === 'approved').length;
  const pendingCount = applications.filter((a) => a.current_status === 'pending_payment').length;
  const failedCount = applications.filter((a) => a.current_status === 'failed').length;
  const successRate = totalApplicationsCount > 0 ? Math.round((paidCount / totalApplicationsCount) * 100) : 0;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Visual Analytics Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Trend Line Chart (2 Columns Wide on large screens) */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">
                  <TrendingUp className="w-4 h-4" />
                </span>
                <h3 className="text-base font-bold text-white">Daily Job Application Trends</h3>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Real-time volume tracking of candidate registrations and payment settlements
              </p>
            </div>

            {/* Time Range Selector */}
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
              {(['7d', '14d', '30d'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setTimeRange(r)}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    timeRange === r
                      ? 'bg-red-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {r === '7d' ? '7 Days' : r === '14d' ? '14 Days' : '30 Days'}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-3 gap-3 mb-6 bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Total Submissions</p>
              <p className="text-xl font-black text-white mt-0.5">{totalApplicationsCount}</p>
            </div>
            <div>
              <p className="text-[10px] font-mono uppercase tracking-wider text-emerald-400">Paid Candidates</p>
              <p className="text-xl font-black text-emerald-400 mt-0.5">{paidCount}</p>
            </div>
            <div>
              <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Settlement Rate</p>
              <p className="text-xl font-black text-amber-400 mt-0.5">{successRate}%</p>
            </div>
          </div>

          {/* Recharts Line Chart */}
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="totalGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#E30613" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#E30613" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="paidGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis
                  dataKey="displayDate"
                  stroke="#64748B"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#334155' }}
                />
                <YAxis
                  stroke="#64748B"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#334155' }}
                  allowDecimals={false}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-2xl text-xs space-y-1">
                          <p className="font-bold text-white border-b border-slate-800 pb-1 flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            {label}
                          </p>
                          <p className="text-red-400 font-semibold flex items-center justify-between gap-4">
                            <span>Total Applied:</span>
                            <span className="font-mono font-bold text-white">{payload[0]?.value || 0}</span>
                          </p>
                          <p className="text-emerald-400 font-semibold flex items-center justify-between gap-4">
                            <span>Paid / Confirmed:</span>
                            <span className="font-mono font-bold text-white">{payload[1]?.value || 0}</span>
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend
                  verticalAlign="top"
                  align="right"
                  iconType="circle"
                  wrapperStyle={{ paddingBottom: '12px', fontSize: '11px' }}
                />
                <Line
                  type="monotone"
                  name="Total Applications"
                  dataKey="total"
                  stroke="#E30613"
                  strokeWidth={3}
                  dot={{ r: 3, fill: '#E30613' }}
                  activeDot={{ r: 6, fill: '#FF2E3D' }}
                />
                <Line
                  type="monotone"
                  name="Paid (M-Pesa Verified)"
                  dataKey="paid"
                  stroke="#10B981"
                  strokeWidth={2.5}
                  strokeDasharray="4 2"
                  dot={{ r: 3, fill: '#10B981' }}
                  activeDot={{ r: 5, fill: '#34D399' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution Pie Chart (1 Column Wide) */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <PieIcon className="w-4 h-4" />
              </span>
              <h3 className="text-base font-bold text-white">Applications by Status</h3>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Breakdown of fee payments & review progress
            </p>

            {/* Recharts Pie Chart */}
            <div className="h-52 w-full relative">
              {statusData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0];
                          const percent = totalApplicationsCount > 0
                            ? Math.round(((data.value as number) / totalApplicationsCount) * 100)
                            : 0;
                          return (
                            <div className="bg-slate-900 border border-slate-700 p-2.5 rounded-xl shadow-xl text-xs space-y-1">
                              <p className="font-bold text-white">{data.name}</p>
                              <p className="text-slate-300 font-mono">
                                <span className="font-bold text-white">{data.value}</span> candidates ({percent}%)
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="#0B132B" strokeWidth={2} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-500">
                  No application data available yet
                </div>
              )}

              {/* Center Donut Label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-black text-white">{totalApplicationsCount}</span>
                <span className="text-[10px] uppercase font-mono text-slate-400">Total</span>
              </div>
            </div>
          </div>

          {/* Custom Status Legend List */}
          <div className="space-y-2 pt-4 border-t border-slate-800 text-xs">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                Paid / Settled
              </span>
              <span className="font-mono font-bold text-emerald-400">{paidCount}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                Pending Payment
              </span>
              <span className="font-mono font-bold text-amber-400">{pendingCount}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                Failed / Cancelled
              </span>
              <span className="font-mono font-bold text-rose-400">{failedCount}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
