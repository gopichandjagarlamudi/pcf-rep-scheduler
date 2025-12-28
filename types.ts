export interface Rep {
  id: string | number;
  name: string;
  home_address?: string;
  home_lat: number;
  home_lng: number;
  status: string; // "active" | "inactive"
  employment_type: 'full-time' | 'part-time';
}

export interface Location {
  id: string | number;
  name: string;
  address?: string;
  lat: number;
  lng: number;
}

export interface Availability {
  id: string | number;
  rep_id: string | number;
  date: string; // YYYY-MM-DD
  start_time: string;
  end_time: string;
}

export interface TimeOff {
  id: string | number;
  rep_id: string | number;
  date: string; // YYYY-MM-DD
  reason?: string;
}

export interface ScheduleEntry {
  id: string; // Unique ID for the schedule entry
  date: string; // YYYY-MM-DD
  rep_id: string | number;
  rep_name: string;
  location_id: string | number;
  location_name: string;
  start_time: string;
  end_time: string;
  distance_km: number;
  hours: number;
  shift_type: '8h' | '6h';
}

export interface HourGapReport {
  rep_name: string;
  week_start: string;
  target: string;
  actual: number;
  reason: string;
}

export interface ScheduleStats {
  totalShifts: number;
  repStats: {
    rep_id: string | number;
    rep_name: string;
    shiftCount: number;
    totalHours: number;
  }[];
  unassignedDays: {
    date: string;
    rep_name: string;
    reason: string;
  }[];
  overflowDays: {
    date: string;
    location_name: string;
    count: number;
  }[];
  hourGaps: HourGapReport[];
  dateRange: string;
}

export type FileType = 'rep' | 'location' | 'availability' | 'timeoff';

export interface FileData {
  reps: Rep[];
  locations: Location[];
  availability: Availability[];
  timeOff: TimeOff[];
}
