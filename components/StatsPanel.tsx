import React from 'react';
import { ScheduleStats } from '../types';

interface StatsPanelProps {
  stats: ScheduleStats;
}

export const StatsPanel: React.FC<StatsPanelProps> = ({ stats }) => {
  const compliance =
    stats.repStats.length === 0
      ? 100
      : Math.max(0, Math.round(100 - (stats.hourGaps.length / stats.repStats.length) * 100));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <p className="text-xs text-slate-500 uppercase">Total Output</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{stats.totalShifts}</p>
          <p className="text-xs text-slate-500 mt-1">Assignments scheduled</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <p className="text-xs text-slate-500 uppercase">Active Staff</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{stats.repStats.length}</p>
          <p className="text-xs text-slate-500 mt-1">Field representatives</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <p className="text-xs text-slate-500 uppercase">Health Score</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{compliance}%</p>
          <p className="text-xs text-slate-500 mt-1">Hour target compliance</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-4">
        <h3 className="text-sm font-bold text-slate-900">Workload Summary</h3>
        <p className="text-xs text-slate-500 mt-1">Hours assigned per representative.</p>
        <div className="mt-3 space-y-2">
          {stats.repStats.slice(0, 10).map((rep) => (
            <div key={`${rep.rep_id}-${rep.rep_name}`} className="flex items-center justify-between text-sm">
              <span className="text-slate-700">{rep.rep_name}</span>
              <span className="font-semibold text-slate-900">{rep.totalHours}h</span>
            </div>
          ))}
        </div>
      </div>

      {stats.hourGaps.length > 0 && (
        <section className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Compliance Adjustments Required</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {stats.hourGaps.map((gap, idx) => (
              <div key={`${gap.rep_name}-${gap.week_start}-${idx}`} className="px-4 py-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-900">{gap.rep_name}</p>
                  <span className="text-xs text-slate-600">{gap.actual}h assigned</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">{gap.reason}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
