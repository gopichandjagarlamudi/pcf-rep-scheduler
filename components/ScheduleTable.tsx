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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-1">
        <div>
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Work Schedule</h2>
          <p className="text-xs text-slate-400 font-medium mt-1">Generated assignments and logistics</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64 bg-white border border-slate-200 rounded-lg shadow-sm flex items-center px-3">
            <Search className="w-4 h-4 text-slate-300" />
            <input 
              type="text" 
              placeholder="Search reps or stores..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent border-none outline-none text-sm h-10 w-full ml-2 placeholder:text-slate-300 font-medium"
            />
          </div>
          <button 
            onClick={() => exportScheduleToCSV(schedule)}
            className="h-10 px-4 bg-white border border-slate-200 rounded-lg text-slate-600 font-bold text-xs flex items-center gap-2 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            CSV
          </button>
        </div>
      </div>

      <div className="space-y-10">
        {grouped.map(([date, entries]) => (
          <div key={date} className="animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex items-center gap-4 mb-4 px-1">
               <div className="h-px bg-slate-200 flex-1" />
               <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] whitespace-nowrap">
                  {format(new Date(date.replace(/-/g, '/')), 'EEEE, MMMM do')}
               </p>
               <div className="h-px bg-slate-200 flex-1" />
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Team Member</th>
                      <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Deployment</th>
                      <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Shift Window</th>
                      <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Metrics</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {entries.map((entry) => (
                      <tr key={entry.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
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
                            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 rounded text-slate-700">
                              <Clock className="w-3.5 h-3.5" />
                              <span className="text-[11px] font-bold">{entry.start_time} - {entry.end_time}</span>
                            </div>
                            <span className="text-[10px] font-black text-slate-300 uppercase">{entry.shift_type}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2">
                             <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${entry.distance_km > 5 ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-500'}`}>
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
          <div className="text-center py-20 bg-white rounded-xl border border-slate-200 border-dashed">
            <p className="text-slate-400 font-bold text-sm">No assignments match your search</p>
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