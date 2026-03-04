import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { parseExcelFile, mapDataToRep, mapDataToLocation, mapDataToAvailability, mapDataToTimeOff } from './utils/fileHelpers';
import { generateSchedule, getDefaultDateRange } from './utils/scheduler';
import { Dropzone } from './components/Dropzone';
import { ScheduleTable } from './components/ScheduleTable';
import { StatsPanel } from './components/StatsPanel';
import { Login } from './components/Login';
import { FileData, FileType, ScheduleEntry, ScheduleStats } from './types';
import { supabase } from './lib/supabase';
import { saveSchedule, loadSchedule } from './lib/scheduleDb';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<string | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  const [files, setFiles] = useState<{ [key in FileType]: File | null }>({
    rep: null,
    location: null,
    availability: null,
    timeoff: null,
  });

  const [data, setData] = useState<FileData>({
    reps: [],
    locations: [],
    availability: [],
    timeOff: [],
  });

  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: '',
    end: '',
  });

  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
  const [stats, setStats] = useState<ScheduleStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const loadSavedSchedule = async () => {
    const result = await loadSchedule();
    if (result.success && result.schedule && result.stats) {
      setSchedule(result.schedule);
      setStats(result.stats);
      if (result.dateRange) {
        setDateRange({
          start: result.dateRange.start,
          end: result.dateRange.end,
        });
      }
    }
  };

  useEffect(() => {
    const checkSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          setIsAuthenticated(true);
          setUser(session.user.email || 'User');
          await loadSavedSchedule();
        }
      } catch (sessionError) {
        console.error('Session check error:', sessionError);
      } finally {
        setIsCheckingSession(false);
      }
    };

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setIsAuthenticated(true);
        setUser(session.user.email || 'User');
        await loadSavedSchedule();
      } else {
        setIsAuthenticated(false);
        setUser(null);
        setSchedule([]);
        setStats(null);
      }
    });

    const { start, end } = getDefaultDateRange();
    setDateRange({
      start: format(start, 'yyyy-MM-dd'),
      end: format(end, 'yyyy-MM-dd'),
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLogin = (email: string) => {
    setIsAuthenticated(true);
    setUser(email);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    setUser(null);
  };

  const handleFileSelect = async (type: FileType, file: File) => {
    setFiles((prev) => ({ ...prev, [type]: file }));
    setError(null);

    try {
      const rawData = await parseExcelFile<any>(file);
      let parsedData: any[] = [];

      switch (type) {
        case 'rep':
          parsedData = mapDataToRep(rawData);
          setData((prev) => ({ ...prev, reps: parsedData }));
          break;
        case 'location':
          parsedData = mapDataToLocation(rawData);
          setData((prev) => ({ ...prev, locations: parsedData }));
          break;
        case 'availability':
          parsedData = mapDataToAvailability(rawData);
          setData((prev) => ({ ...prev, availability: parsedData }));
          break;
        case 'timeoff':
          parsedData = mapDataToTimeOff(rawData);
          setData((prev) => ({ ...prev, timeOff: parsedData }));
          break;
      }
    } catch (_err) {
      setError(`Import failed: ${type}`);
    }
  };

  const handleGenerate = async () => {
    if (!files.rep || !files.location || !files.availability) {
      setError('Please complete all required data uploads.');
      return;
    }

    setIsProcessing(true);
    try {
      const sParts = dateRange.start.split('-').map(Number);
      const eParts = dateRange.end.split('-').map(Number);
      const sDate = new Date(sParts[0], sParts[1] - 1, sParts[2]);
      const eDate = new Date(eParts[0], eParts[1] - 1, eParts[2]);

      const result = generateSchedule(data.reps, data.locations, data.availability, data.timeOff, sDate, eDate);

      setSchedule(result.schedule);
      setStats(result.stats);
      setError(null);

      const saveResult = await saveSchedule(result.schedule, result.stats, dateRange.start, dateRange.end);
      if (!saveResult.success) {
        console.error('Failed to save schedule:', saveResult.error);
      }
    } catch (_err) {
      setError('Error generating schedule. Verify your data integrity.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isCheckingSession) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-sm text-slate-600 font-medium">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  const canGenerate = files.rep && files.location && files.availability;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold text-slate-900">PCF Rep Scheduler</h1>
            <p className="text-xs text-slate-500">Operations Dashboard</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-[11px] text-slate-500">Logged in as</p>
              <p className="text-sm font-semibold text-slate-800">{user}</p>
            </div>
            <button
              onClick={handleLogout}
              className="px-3 py-2 text-sm text-slate-700 border border-slate-300 rounded-md hover:bg-slate-100"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 space-y-6">
            <section className="bg-white rounded-lg border border-slate-200 overflow-hidden">
              <div className="p-4 border-b border-slate-100">
                <h2 className="text-sm font-bold text-slate-900">Data Pipeline</h2>
                <p className="text-xs text-slate-500 mt-1">Input Required</p>
              </div>
              <div className="p-4 space-y-3">
                <Dropzone label="Representatives" type="rep" file={files.rep} onFileSelect={handleFileSelect} required />
                <Dropzone label="Store Locations" type="location" file={files.location} onFileSelect={handleFileSelect} required />
                <Dropzone
                  label="Staff Availability"
                  type="availability"
                  file={files.availability}
                  onFileSelect={handleFileSelect}
                  required
                />
                <Dropzone label="Time Off Records" type="timeoff" file={files.timeoff} onFileSelect={handleFileSelect} />
              </div>
            </section>

            <section className="bg-white rounded-lg border border-slate-200 overflow-hidden">
              <div className="p-4 border-b border-slate-100">
                <h2 className="text-sm font-bold text-slate-900">Scheduling Window</h2>
              </div>
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">Period Start</label>
                    <input
                      type="date"
                      value={dateRange.start}
                      onChange={(e) => setDateRange((prev) => ({ ...prev, start: e.target.value }))}
                      className="mt-1 w-full bg-slate-50 border border-slate-300 rounded-md px-2 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">Period End</label>
                    <input
                      type="date"
                      value={dateRange.end}
                      onChange={(e) => setDateRange((prev) => ({ ...prev, end: e.target.value }))}
                      className="mt-1 w-full bg-slate-50 border border-slate-300 rounded-md px-2 py-2 text-sm"
                    />
                  </div>
                </div>

                <button
                  onClick={handleGenerate}
                  disabled={!canGenerate || isProcessing}
                  className={`w-full py-2.5 rounded-md font-semibold text-sm ${
                    canGenerate && !isProcessing
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {isProcessing ? 'Generating Schedule...' : 'Generate Weekly Plan'}
                </button>

                {error && (
                  <div className="px-3 py-2 bg-red-50 text-red-700 border border-red-200 rounded-md">
                    <p className="text-xs font-medium">{error}</p>
                  </div>
                )}
              </div>
            </section>
          </div>

          <div className="lg:col-span-8">
            {schedule.length > 0 && stats ? (
              <div className="space-y-6">
                <StatsPanel stats={stats} />
                <ScheduleTable schedule={schedule} />
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-slate-200 p-10 text-center">
                <h3 className="text-lg font-bold text-slate-900 mb-2">No Active Schedule</h3>
                <p className="text-sm text-slate-600">
                  Upload the required representative and location data to generate an optimized weekly work plan.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
