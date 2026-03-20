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
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div className="panel-surface rounded-[var(--radius-panel)] p-5">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="rounded-2xl bg-[var(--accent-soft)] p-2.5 shadow-soft">
              <Clock className="w-4 h-4 text-indigo-600" />
            </div>
            <span className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-500">Total Output</span>
          </div>
          <p className="text-3xl font-extrabold tracking-tight text-slate-950">{stats.totalShifts}</p>
          <p className="mt-1 text-xs font-medium text-slate-400">Assignments scheduled</p>
        </div>

        <div className="panel-surface rounded-[var(--radius-panel)] p-5">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="rounded-2xl bg-[var(--accent-soft)] p-2.5 shadow-soft">
              <Users className="w-4 h-4 text-indigo-600" />
            </div>
            <span className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-500">Active Staff</span>
          </div>
          <p className="text-3xl font-extrabold tracking-tight text-slate-950">{stats.repStats.length}</p>
          <p className="mt-1 text-xs font-medium text-slate-400">Field representatives</p>
        </div>

        <div className="panel-surface rounded-[var(--radius-panel)] p-5">
          <div className="flex items-center gap-2.5 mb-3">
            <div className={`rounded-2xl p-2.5 shadow-soft ${stats.hourGaps.length === 0 ? 'bg-green-50' : 'bg-amber-50'}`}>
              {stats.hourGaps.length === 0 ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <AlertTriangle className="w-4 h-4 text-amber-600" />}
            </div>
            <span className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-500">Health Score</span>
          </div>
          <p className="text-3xl font-extrabold tracking-tight text-slate-950">
            {stats.hourGaps.length === 0 ? '100%' : `${Math.round(100 - (stats.hourGaps.length / stats.repStats.length) * 100)}%`}
          </p>
          <p className="mt-1 text-xs font-medium text-slate-400">Hour target compliance</p>
        </div>
      </div>

      <div className="panel-surface rounded-[var(--radius-panel)] p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-slate-900">Workload Distribution</h3>
            <p className="mt-1 text-xs font-medium text-slate-400">Hours generated per representative</p>
          </div>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-indigo-600" />
              <span className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400">Standard</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-slate-200" />
              <span className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400">Below Min</span>
            </div>
          </div>
        </div>
        <div className="overflow-hidden rounded-3xl border border-slate-100/90">
          <div className="panel-soft subtle-divider hidden grid-cols-[minmax(0,1.8fr)_auto_auto_auto] gap-4 border-b px-4 py-3 sm:grid">
            <span className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-400">Representative</span>
            <span className="text-[10px] text-right font-extrabold uppercase tracking-[0.18em] text-slate-400">Hours</span>
            <span className="text-[10px] text-right font-extrabold uppercase tracking-[0.18em] text-slate-400">Shifts</span>
            <span className="text-[10px] text-right font-extrabold uppercase tracking-[0.18em] text-slate-400">Status</span>
          </div>
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100/90">
            {repsByHours.map((rep) => (
              <div
                key={rep.rep_id}
                className="flex flex-col gap-2 px-4 py-3 transition-colors hover:bg-slate-50/70 sm:grid sm:grid-cols-[minmax(0,1.8fr)_auto_auto_auto] sm:gap-4 sm:items-center"
              >
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">{rep.rep_name}</p>
                  <p className="text-xs font-medium text-slate-400 sm:hidden">
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
                    <span className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400">Status</span>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.16em] ${
                      rep.isBelowMin
                        ? 'bg-slate-100 text-slate-500'
                        : 'bg-[var(--accent-soft)] text-indigo-700'
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
        <section className="panel-surface overflow-hidden rounded-[var(--radius-panel)]">
          <div className="panel-soft subtle-divider flex items-center justify-between border-b px-5 py-4">
            <h3 className="text-xs font-extrabold uppercase tracking-[0.18em] text-slate-700">Compliance Adjustments Required</h3>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="grid grid-cols-1 divide-y divide-slate-100/90 md:grid-cols-2 md:divide-x md:divide-y-0">
            {stats.hourGaps.map((gap, i) => (
              <div key={i} className="px-5 py-4 transition-colors hover:bg-slate-50/70">
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-sm font-bold text-slate-900">{gap.rep_name}</p>
                    <span className="rounded-lg bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-700">{gap.actual}h Assigned</span>
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
