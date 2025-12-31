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

  const [dateRange, setDateRange] = useState<{ start: string, end: string }>({
    start: '',
    end: ''
  });

  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
  const [stats, setStats] = useState<ScheduleStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // Check for existing session on load
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setIsAuthenticated(true);
          setUser(session.user.email || 'User');

          // Load saved schedule for this user
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
        }
      } catch (error) {
        console.error('Session check error:', error);
      } finally {
        setIsCheckingSession(false);
      }
    };

    checkSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setIsAuthenticated(true);
        setUser(session.user.email || 'User');

        // Load saved schedule for this user
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
      } else {
        setIsAuthenticated(false);
        setUser(null);
        // Clear schedule data on logout
        setSchedule([]);
        setStats(null);
      }
    });

    const { start, end } = getDefaultDateRange();
    setDateRange({
      start: format(start, 'yyyy-MM-dd'),
      end: format(end, 'yyyy-MM-dd')
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
    setTimeout(async () => {
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

        // Save schedule to database
        const saveResult = await saveSchedule(
          result.schedule,
          result.stats,
          dateRange.start,
          dateRange.end
        );

        if (!saveResult.success) {
          console.error('Failed to save schedule:', saveResult.error);
          // Don't show error to user - schedule is still displayed
        }
      } catch (err) {
        setError("Error generating schedule. Verify your data integrity.");
      } finally {
        setIsProcessing(false);
      }
    }, 600);
  };

  if (isCheckingSession) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-sm text-slate-500 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  const canGenerate = files.rep && files.location && files.availability;

  return (
    <div className="min-h-screen">
      {/* Top Header */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-900 tracking-tight leading-none">PCF Rep Scheduler</h1>
              <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider mt-0.5">Operations Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
             <div className="hidden md:flex gap-4">
                <span className="text-xs font-semibold text-indigo-600 flex items-center gap-1.5 px-3 py-1 bg-indigo-50 rounded-full">
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  Planner
                </span>
                <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5 px-3 py-1">
                  <Database className="w-3.5 h-3.5" />
                  Fleet Management
                </span>
             </div>
             <div className="h-4 w-px bg-slate-200 hidden md:block" />
             <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="text-right hidden sm:block">
                    <p className="text-[10px] font-black text-slate-400 uppercase leading-none">Logged in as</p>
                    <p className="text-xs font-bold text-slate-700 leading-tight">{user}</p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-bold">
                    {user?.charAt(0).toUpperCase()}
                  </div>
                </div>
                <button 
                  onClick={handleLogout}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
             </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Controls Panel */}
          <div className="lg:col-span-4 space-y-6">
            <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Database className="w-4 h-4 text-slate-400" />
                  Data Pipeline
                </h2>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Input Required</span>
              </div>
              <div className="p-2 space-y-1">
                <Dropzone label="Representatives" type="rep" file={files.rep} onFileSelect={handleFileSelect} required />
                <Dropzone label="Store Locations" type="location" file={files.location} onFileSelect={handleFileSelect} required />
                <Dropzone label="Staff Availability" type="availability" file={files.availability} onFileSelect={handleFileSelect} required />
                <Dropzone label="Time Off Records" type="timeoff" file={files.timeoff} onFileSelect={handleFileSelect} />
              </div>
            </section>

            <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  Scheduling Window
                </h2>
              </div>
              <div className="p-5 space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">Period Start</label>
                    <input 
                      type="date" 
                      value={dateRange.start}
                      onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">Period End</label>
                    <input 
                      type="date" 
                      value={dateRange.end}
                      onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                    />
                  </div>
                </div>

                <button
                  onClick={handleGenerate}
                  disabled={!canGenerate || isProcessing}
                  className={`
                    w-full py-3 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2.5
                    ${canGenerate && !isProcessing
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm active:translate-y-px' 
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed'}
                  `}
                >
                  {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
                  {isProcessing ? 'Generating Schedule...' : 'Generate Weekly Plan'}
                </button>
                
                {error && (
                  <div className="px-4 py-3 bg-red-50 text-red-600 border border-red-100 rounded-lg flex items-center gap-2">
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
              <div className="h-full flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-slate-100 card-shadow text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                  <LayoutDashboard className="w-8 h-8 text-slate-200" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">No Active Schedule</h3>
                <p className="text-slate-500 text-sm max-w-sm">
                  Upload the required representative and location data to generate an optimized weekly work plan.
                </p>
              </div>
            )}
          </div>

        </div>
      </main>
      
      <footer className="max-w-7xl mx-auto px-4 py-12 text-center text-slate-400">
        <p className="text-xs font-medium">PCF Internal Operations System &bull; v1.2.0</p>
      </footer>
    </div>
  );
};

export default App;
