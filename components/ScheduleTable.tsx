import React, { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { ScheduleEntry } from '../types';
import { exportScheduleToCSV } from '../utils/fileHelpers';

interface ScheduleTableProps {
  schedule: ScheduleEntry[];
}

export const ScheduleTable: React.FC<ScheduleTableProps> = ({ schedule }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSchedule = useMemo(() => {
    return schedule.filter(
      (item) =>
        item.rep_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.location_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.date.includes(searchTerm)
    );
  }, [schedule, searchTerm]);

  const grouped = useMemo(() => {
    const groups: Record<string, ScheduleEntry[]> = {};
    filteredSchedule.forEach((entry) => {
      if (!groups[entry.date]) groups[entry.date] = [];
      groups[entry.date].push(entry);
    });
    return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filteredSchedule]);

  if (schedule.length === 0) return null;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Work Schedule</h2>
          <p className="text-xs text-slate-500 mt-1">Generated assignments and logistics</p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Search reps or stores..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-64 border border-slate-300 rounded-md px-3 py-2 text-sm"
          />
          <button
            onClick={() => exportScheduleToCSV(schedule)}
            className="px-3 py-2 border border-slate-300 rounded-md text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            CSV
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {grouped.map(([date, entries]) => (
          <div key={date}>
            <p className="text-xs font-semibold text-slate-600 mb-2">{format(new Date(date.replace(/-/g, '/')), 'EEEE, MMMM do')}</p>

            <div className="bg-white border border-slate-200 rounded-lg overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-3 text-[11px] font-semibold text-slate-600 uppercase">Team Member</th>
                    <th className="px-4 py-3 text-[11px] font-semibold text-slate-600 uppercase">Deployment</th>
                    <th className="px-4 py-3 text-[11px] font-semibold text-slate-600 uppercase">Shift Window</th>
                    <th className="px-4 py-3 text-[11px] font-semibold text-slate-600 uppercase">Metrics</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {entries.map((entry) => (
                    <tr key={entry.id}>
                      <td className="px-4 py-3 text-sm font-medium text-slate-800">{entry.rep_name}</td>
                      <td className="px-4 py-3 text-sm text-slate-700">{entry.location_name}</td>
                      <td className="px-4 py-3 text-sm text-slate-700">
                        {entry.start_time} - {entry.end_time} ({entry.shift_type})
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700">{entry.distance_km}km transit</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}

        {filteredSchedule.length === 0 && (
          <div className="text-center py-10 bg-white rounded-lg border border-slate-200">
            <p className="text-slate-500 text-sm">No assignments match your search</p>
            <button onClick={() => setSearchTerm('')} className="mt-3 text-xs font-semibold text-indigo-600 hover:underline">
              Clear all filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
