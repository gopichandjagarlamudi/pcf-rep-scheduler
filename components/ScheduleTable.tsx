import React, { useMemo, useState } from 'react';
import { ScheduleEntry } from '../types';
import { Search, MapPin, Clock, Download, ArrowRight, User } from 'lucide-react';
import { exportScheduleToCSV } from '../utils/fileHelpers';
import { format } from 'date-fns';

interface ScheduleTableProps {
  schedule: ScheduleEntry[];
}

export const ScheduleTable: React.FC<ScheduleTableProps> = ({ schedule }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSchedule = useMemo(() => {
    return schedule.filter(item => 
      item.rep_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.location_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.date.includes(searchTerm)
    );
  }, [schedule, searchTerm]);

  const grouped = useMemo(() => {
    const groups: Record<string, ScheduleEntry[]> = {};
    filteredSchedule.forEach(entry => {
      if (!groups[entry.date]) groups[entry.date] = [];
      groups[entry.date].push(entry);
    });
    return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filteredSchedule]);

  if (schedule.length === 0) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 px-1 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-slate-900">Work Schedule</h2>
          <p className="mt-1 text-xs font-medium text-slate-400">Generated assignments and logistics</p>
        </div>
        <div className="flex w-full items-center gap-3 sm:w-auto">
          <div className="field-shell relative flex flex-1 items-center rounded-2xl px-3 shadow-soft sm:w-72">
            <Search className="w-4 h-4 text-slate-300" />
            <input 
              type="text" 
              placeholder="Search reps or stores..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="ml-2 h-11 w-full border-none bg-transparent text-sm font-medium text-slate-700 outline-none placeholder:text-slate-300"
            />
          </div>
          <button 
            onClick={() => exportScheduleToCSV(schedule)}
            className="secondary-button flex h-11 items-center gap-2 rounded-2xl px-4 text-xs font-bold text-slate-600 transition-colors hover:bg-white"
          >
            <Download className="w-3.5 h-3.5" />
            CSV
          </button>
        </div>
      </div>

      <div className="space-y-10">
        {grouped.map(([date, entries]) => (
          <div key={date} className="animate-in">
            <div className="flex items-center gap-4 mb-4 px-1">
               <div className="h-px flex-1 bg-slate-200/80" />
               <p className="whitespace-nowrap text-[11px] font-extrabold uppercase tracking-[0.22em] text-slate-400">
                  {format(new Date(date.replace(/-/g, '/')), 'EEEE, MMMM do')}
               </p>
               <div className="h-px flex-1 bg-slate-200/80" />
            </div>

            <div className="panel-surface overflow-hidden rounded-[var(--radius-panel)]">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="panel-soft subtle-divider border-b">
                    <tr>
                      <th className="px-6 py-3 text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-400">Team Member</th>
                      <th className="px-6 py-3 text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-400">Deployment</th>
                      <th className="px-6 py-3 text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-400">Shift Window</th>
                      <th className="px-6 py-3 text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-400">Metrics</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100/90">
                    {entries.map((entry) => (
                      <tr key={entry.id} className="transition-colors hover:bg-slate-50/70">
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 shadow-soft">
                              <User className="w-4 h-4 text-slate-400" />
                            </div>
                            <p className="text-sm font-bold text-slate-800">{entry.rep_name}</p>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2 text-slate-600">
                            <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                            <span className="text-sm font-medium">{entry.location_name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-slate-700">
                              <Clock className="w-3.5 h-3.5" />
                              <span className="text-[11px] font-bold">{entry.start_time} - {entry.end_time}</span>
                            </div>
                            <span className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-300">{entry.shift_type}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2">
                             <span className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${entry.distance_km > 5 ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-500'}`}>
                                {entry.distance_km}km Transit
                             </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ))}

        {filteredSchedule.length === 0 && (
          <div className="panel-surface rounded-[var(--radius-panel)] border border-dashed border-slate-200 py-20 text-center">
            <p className="text-sm font-bold text-slate-400">No assignments match your search</p>
            <button 
              onClick={() => setSearchTerm('')}
              className="mt-4 text-xs font-bold text-indigo-600 hover:underline"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
