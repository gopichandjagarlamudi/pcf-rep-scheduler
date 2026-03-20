import React, { useState, useEffect } from 'react';
import { parseExcelFile, mapDataToRep, mapDataToLocation, mapDataToAvailability, mapDataToTimeOff } from './utils/fileHelpers';
import { generateSchedule, getDefaultDateRange } from './utils/scheduler';
import { Dropzone } from './components/Dropzone';
import { ScheduleTable } from './components/ScheduleTable';
import { StatsPanel } from './components/StatsPanel';
import { Login } from './components/Login';
import { FileData, FileType, ScheduleEntry, ScheduleStats } from './types';
import { Calendar, LayoutDashboard, Database, AlertCircle, Loader2, Sparkles, LogOut } from 'lucide-react';
import { format } from 'date-fns';
import { supabase, supabaseConfigError } from './lib/supabase';
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

  const [dateRange, setDateRange] = useState<{ start: string, end: string }>({
    start: '',
    end: ''
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
    const { start, end } = getDefaultDateRange();
    setDateRange({
      start: format(start, 'yyyy-MM-dd'),
      end: format(end, 'yyyy-MM-dd')
    });
  }, []);

  useEffect(() => {
    if (!supabase) {
      setIsCheckingSession(false);
      return;
    }

    let isMounted = true;

    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!isMounted) {
          return;
        }

        setIsAuthenticated(Boolean(session?.user));
        setUser(session?.user?.email || null);
      } catch (error) {
        console.error('Session check error:', error);

        if (!isMounted) {
          return;
        }

        setIsAuthenticated(false);
        setUser(null);
      } finally {
        if (isMounted) {
          setIsCheckingSession(false);
        }
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) {
        return;
      }

      setIsAuthenticated(Boolean(session?.user));
      setUser(session?.user?.email || null);

      if (!session?.user) {
        setSchedule([]);
        setStats(null);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    loadSavedSchedule();
  }, [isAuthenticated]);

  const handleLogin = (email: string) => {
    setIsAuthenticated(true);
    setUser(email);
  };

  const handleLogout = async () => {
    if (!supabase) {
      return;
    }

    await supabase.auth.signOut();
    setIsAuthenticated(false);
    setUser(null);
  };

  const handleFileSelect = async (type: FileType, file: File) => {
    setFiles(prev => ({ ...prev, [type]: file }));
    setError(null);
    try {
      const rawData = await parseExcelFile<any>(file);
      let parsedData: any[] = [];
      switch (type) {
        case 'rep':
          parsedData = mapDataToRep(rawData);
          setData(prev => ({ ...prev, reps: parsedData }));
          break;
        case 'location':
          parsedData = mapDataToLocation(rawData);
          setData(prev => ({ ...prev, locations: parsedData }));
          break;
        case 'availability':
          parsedData = mapDataToAvailability(rawData);
          setData(prev => ({ ...prev, availability: parsedData }));
          break;
        case 'timeoff':
          parsedData = mapDataToTimeOff(rawData);
          setData(prev => ({ ...prev, timeOff: parsedData }));
          break;
      }
    } catch (err) {
      setError(`Import failed: ${type}`);
    }
  };

  const handleGenerate = async () => {
    if (!files.rep || !files.location || !files.availability) {
      setError("Please complete all required data uploads.");
      return;
    }
    setIsProcessing(true);
    try {
      const sParts = dateRange.start.split('-').map(Number);
      const eParts = dateRange.end.split('-').map(Number);
      const sDate = new Date(sParts[0], sParts[1]-1, sParts[2]);
      const eDate = new Date(eParts[0], eParts[1]-1, eParts[2]);

      const result = generateSchedule(
        data.reps,
        data.locations,
        data.availability,
        data.timeOff,
        sDate,
        eDate
      );
      setSchedule(result.schedule);
      setStats(result.stats);
      setError(null);

      const saveResult = await saveSchedule(
        result.schedule,
        result.stats,
        dateRange.start,
        dateRange.end
      );

      if (!saveResult.success) {
        console.error('Failed to save schedule:', saveResult.error);
      }
    } catch (err) {
      setError("Error generating schedule. Verify your data integrity.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (supabaseConfigError) {
    return (
      <div className="app-shell min-h-screen flex items-center justify-center px-4">
        <div className="login-shell max-w-md w-full panel-surface rounded-[var(--radius-panel)] p-8">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-50/90 text-amber-600 flex items-center justify-center shadow-soft">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-slate-950">Configuration Required</h1>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {supabaseConfigError}
              </p>
              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                For Netlify deployments, add these values in Site configuration &gt; Environment variables and redeploy.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isCheckingSession) {
    return (
      <div className="app-shell min-h-screen flex items-center justify-center px-4">
        <div className="login-shell panel-surface rounded-[var(--radius-panel)] px-10 py-9 text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--accent-soft)] shadow-glow">
            <Loader2 className="h-7 w-7 animate-spin text-indigo-600" />
          </div>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.24em] text-slate-400">Initializing Workspace</p>
          <p className="mt-2 text-sm font-medium text-slate-500">Loading your planning environment...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  const canGenerate = files.rep && files.location && files.availability;

  return (
    <div className="app-shell min-h-screen">
      {/* Top Header */}
      <nav className="glass-nav sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-600 shadow-glow">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-extrabold text-slate-950 tracking-tight leading-none">PCF Rep Scheduler</h1>
              <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Operations Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
             <div className="hidden md:flex gap-4">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-100 bg-[var(--accent-soft)] px-3 py-1.5 text-xs font-semibold text-indigo-700 shadow-soft">
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  Planner
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-slate-400">
                  <Database className="w-3.5 h-3.5" />
                  Fleet Management
                </span>
             </div>
             <div className="hidden h-4 w-px bg-slate-200/70 md:block" />
             <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 rounded-full border border-slate-200/70 bg-white/65 px-2 py-1 shadow-soft backdrop-blur">
                  <div className="text-right hidden sm:block">
                    <p className="text-[10px] font-extrabold uppercase leading-none tracking-[0.18em] text-slate-400">Logged in as</p>
                    <p className="text-xs font-bold leading-tight text-slate-700">{user}</p>
                  </div>
                  <div className="flex h-9 w-9 items-center justify-center rounded-full border border-indigo-100 bg-gradient-to-br from-white to-indigo-50 text-xs font-bold text-indigo-700">
                    {user?.charAt(0).toUpperCase()}
                  </div>
                </div>
                <button 
                  onClick={handleLogout}
                  className="secondary-button rounded-2xl p-2.5 text-slate-500 transition-all hover:bg-red-50 hover:text-red-500"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
             </div>
          </div>
        </div>
      </nav>

      <main className="dashboard-shell max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Controls Panel */}
          <div className="lg:col-span-4 space-y-6">
            <section className="panel-surface overflow-hidden rounded-[var(--radius-panel)]">
              <div className="panel-soft subtle-divider flex items-center justify-between border-b px-5 py-4">
                <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                  <Database className="w-4 h-4 text-slate-500" />
                  Data Pipeline
                </h2>
                <span className="rounded-full bg-white/80 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-400 shadow-soft">Input Required</span>
              </div>
              <div className="p-3 space-y-2">
                <Dropzone label="Representatives" type="rep" file={files.rep} onFileSelect={handleFileSelect} required />
                <Dropzone label="Store Locations" type="location" file={files.location} onFileSelect={handleFileSelect} required />
                <Dropzone label="Staff Availability" type="availability" file={files.availability} onFileSelect={handleFileSelect} required />
                <Dropzone label="Time Off Records" type="timeoff" file={files.timeoff} onFileSelect={handleFileSelect} />
              </div>
            </section>

            <section className="panel-surface overflow-hidden rounded-[var(--radius-panel)]">
              <div className="panel-soft subtle-divider border-b px-5 py-4">
                <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                  <Calendar className="w-4 h-4 text-slate-500" />
                  Scheduling Window
                </h2>
              </div>
              <div className="p-5 space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-500">Period Start</label>
                    <input 
                      type="date" 
                      value={dateRange.start}
                      onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                      className="field-shell w-full rounded-2xl px-3.5 py-3 text-sm font-medium text-slate-700 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-500">Period End</label>
                    <input 
                      type="date" 
                      value={dateRange.end}
                      onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                      className="field-shell w-full rounded-2xl px-3.5 py-3 text-sm font-medium text-slate-700 outline-none transition-all"
                    />
                  </div>
                </div>

                <button
                  onClick={handleGenerate}
                  disabled={!canGenerate || isProcessing}
                  className={`
                    flex w-full items-center justify-center gap-2.5 rounded-2xl py-3.5 text-sm font-bold transition-all
                    ${canGenerate && !isProcessing
                      ? 'primary-button text-white active:translate-y-px' 
                      : 'cursor-not-allowed bg-slate-100 text-slate-400 shadow-none'}
                  `}
                >
                  {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
                  {isProcessing ? 'Generating Schedule...' : 'Generate Weekly Plan'}
                </button>
                
                {error && (
                  <div className="flex items-center gap-2 rounded-2xl border border-red-100 bg-red-50/90 px-4 py-3 text-red-600">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <p className="text-xs font-semibold">{error}</p>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Results Display */}
          <div className="lg:col-span-8">
            {schedule.length > 0 && stats ? (
              <div className="space-y-8">
                <StatsPanel stats={stats} />
                <ScheduleTable schedule={schedule} />
              </div>
            ) : (
              <div className="panel-surface muted-grid flex h-full flex-col items-center justify-center rounded-[var(--radius-panel)] border border-slate-100/80 p-12 text-center">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-white/80 shadow-soft">
                  <LayoutDashboard className="w-8 h-8 text-slate-300" />
                </div>
                <p className="mb-3 text-[11px] font-extrabold uppercase tracking-[0.24em] text-slate-400">Planner Idle</p>
                <h3 className="mb-2 text-xl font-extrabold tracking-tight text-slate-900">No Active Schedule</h3>
                <p className="max-w-sm text-sm leading-6 text-slate-500">
                  Upload the required representative and location data to generate an optimized weekly work plan.
                </p>
              </div>
            )}
          </div>

        </div>
      </main>
      
      <footer className="max-w-7xl mx-auto px-4 py-12 text-center text-slate-400">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em]">PCF Internal Operations System &bull; v1.2.0</p>
      </footer>
    </div>
  );
};

export default App;
