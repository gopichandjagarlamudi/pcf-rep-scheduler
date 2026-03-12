import React from 'react';
import { ScheduleStats } from '../types';
import { Clock, CheckCircle2, AlertTriangle, Users } from 'lucide-react';

interface StatsPanelProps {
  stats: ScheduleStats;
}

export const StatsPanel: React.FC<StatsPanelProps> = ({ stats }) => {
  const repsByHours = [...stats.repStats]
    .sort((a, b) => b.totalHours - a.totalHours)
    .map((repStat) => ({
      ...repStat,
      isBelowMin: stats.hourGaps.some((gap) => gap.rep_name === repStat.rep_name),
    }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-xl border border-slate-200 card-shadow">
          <div className="flex items-center gap-2.5 mb-3">
             <div className="p-2 bg-indigo-50 rounded-lg"><Clock className="w-4 h-4 text-indigo-600" /></div>
             <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Output</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{stats.totalShifts}</p>
          <p className="text-xs text-slate-400 font-medium mt-1">Assignments scheduled</p>
        </div>
        
        <div className="bg-white p-5 rounded-xl border border-slate-200 card-shadow">
          <div className="flex items-center gap-2.5 mb-3">
             <div className="p-2 bg-indigo-50 rounded-lg"><Users className="w-4 h-4 text-indigo-600" /></div>
             <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Active Staff</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{stats.repStats.length}</p>
          <p className="text-xs text-slate-400 font-medium mt-1">Field representatives</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 card-shadow">
          <div className="flex items-center gap-2.5 mb-3">
             <div className={`p-2 rounded-lg ${stats.hourGaps.length === 0 ? 'bg-green-50' : 'bg-amber-50'}`}>
                {stats.hourGaps.length === 0 ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <AlertTriangle className="w-4 h-4 text-amber-600" />}
             </div>
             <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Health Score</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">
            {stats.hourGaps.length === 0 ? '100%' : `${Math.round(100 - (stats.hourGaps.length / stats.repStats.length) * 100)}%`}
          </p>
          <p className="text-xs text-slate-400 font-medium mt-1">Hour target compliance</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Workload Distribution</h3>
            <p className="text-xs text-slate-400 font-medium mt-1">Hours generated per representative</p>
          </div>
          <div className="flex gap-4">
             <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                <span className="text-[10px] font-bold text-slate-400 uppercase">Standard</span>
             </div>
             <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                <span className="text-[10px] font-bold text-slate-400 uppercase">Below Min</span>
             </div>
          </div>
        </div>
        <div className="border border-slate-100 rounded-xl overflow-hidden">
          <div className="hidden sm:grid grid-cols-[minmax(0,1.8fr)_auto_auto_auto] gap-4 px-4 py-3 bg-slate-50 border-b border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Representative</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Hours</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Shifts</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Status</span>
          </div>
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {repsByHours.map((rep) => (
              <div
                key={rep.rep_id}
                className="px-4 py-3 flex flex-col sm:grid sm:grid-cols-[minmax(0,1.8fr)_auto_auto_auto] gap-2 sm:gap-4 sm:items-center hover:bg-slate-50 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">{rep.rep_name}</p>
                  <p className="text-xs text-slate-400 font-medium sm:hidden">
                    {rep.totalHours}h across {rep.shiftCount} shifts
                  </p>
                </div>
                <div className="hidden sm:block text-right">
                  <span className="text-sm font-bold text-slate-900">{rep.totalHours}h</span>
                </div>
                <div className="hidden sm:block text-right">
                  <span className="text-xs font-bold text-slate-500">{rep.shiftCount}</span>
                </div>
                <div className="flex justify-between items-center sm:justify-end">
                  <div className="sm:hidden flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                      rep.isBelowMin
                        ? 'bg-slate-100 text-slate-500'
                        : 'bg-indigo-50 text-indigo-600'
                    }`}
                  >
                    {rep.isBelowMin ? 'Below Min' : 'Standard'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {stats.hourGaps.length > 0 && (
        <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
           <div className="px-5 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Compliance Adjustments Required</h3>
              <AlertTriangle className="w-4 h-4 text-amber-500" />
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100">
             {stats.hourGaps.map((gap, i) => (
                <div key={i} className="px-5 py-4 hover:bg-slate-50 transition-colors">
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-sm font-bold text-slate-900">{gap.rep_name}</p>
                    <span className="text-xs font-bold px-2 py-0.5 bg-amber-50 text-amber-700 rounded-md">{gap.actual}h Assigned</span>
                  </div>
                  <p className="text-xs text-slate-400 font-medium leading-relaxed italic">{gap.reason}</p>
                </div>
             ))}
           </div>
        </section>
      )}
    </div>
  );
};
