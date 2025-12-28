
import { addDays, format, eachDayOfInterval } from 'date-fns';
import { Rep, Location, Availability, TimeOff, ScheduleEntry, ScheduleStats, HourGapReport } from '../types';

// Local implementation of startOfWeek to handle missing export from date-fns
const startOfWeek = (date: Date, options?: { weekStartsOn?: number }): Date => {
  const d = new Date(date);
  const weekStartsOn = options?.weekStartsOn || 0;
  const day = d.getDay();
  const diff = (day < weekStartsOn ? 7 : 0) + day - weekStartsOn;
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

// Local implementation of endOfWeek to handle missing export from date-fns
const endOfWeek = (date: Date, options?: { weekStartsOn?: number }): Date => {
  const d = startOfWeek(date, options);
  const result = new Date(d);
  result.setDate(result.getDate() + 6);
  result.setHours(23, 59, 59, 999);
  return result;
};

const SHIFT_A_START = '11:00';
const SHIFT_A_HOURS = 8;
const SHIFT_B_START = '13:00';
const SHIFT_B_HOURS = 6;
const SHIFT_END = '19:00';

const getDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const generateSchedule = (
  reps: Rep[],
  locations: Location[],
  availability: Availability[],
  timeOff: TimeOff[],
  startDate: Date,
  endDate: Date
): { schedule: ScheduleEntry[]; stats: ScheduleStats } => {
  
  const schedule: ScheduleEntry[] = [];
  const repLastLocation: Record<string | number, string | number> = {};
  const unassignedDays: { date: string; rep_name: string; reason: string }[] = [];
  const overflowDays: { date: string; location_name: string; count: number }[] = [];
  const hourGaps: HourGapReport[] = [];

  // Lookup maps
  const availabilityMap = new Map<string, Set<string | number>>();
  availability.forEach(a => {
    const d = a.date.split('T')[0]; 
    if (!availabilityMap.has(d)) availabilityMap.set(d, new Set());
    availabilityMap.get(d)?.add(a.rep_id);
  });

  const timeOffMap = new Map<string, Set<string | number>>();
  timeOff.forEach(t => {
    const d = t.date.split('T')[0];
    if (!timeOffMap.has(d)) timeOffMap.set(d, new Set());
    timeOffMap.get(d)?.add(t.rep_id);
  });

  // Split date range into Sunday-Saturday weeks
  const weeks: { start: Date; end: Date; days: string[] }[] = [];
  let currentStart = startOfWeek(startDate, { weekStartsOn: 0 }); // Sunday
  while (currentStart <= endDate) {
    const currentEnd = endOfWeek(currentStart, { weekStartsOn: 0 }); // Saturday
    const daysInInterval = eachDayOfInterval({ 
      start: currentStart < startDate ? startDate : currentStart, 
      end: currentEnd > endDate ? endDate : currentEnd 
    }).map(d => format(d, 'yyyy-MM-dd'));
    
    weeks.push({
      start: currentStart,
      end: currentEnd,
      days: daysInInterval
    });
    // Move to the start of the next week
    currentStart = addDays(currentEnd, 1);
    currentStart.setHours(0, 0, 0, 0);
  }

  // Process week by week
  weeks.forEach(week => {
    const weekKey = format(week.start, 'yyyy-MM-dd');
    const weeklyHours: Record<string | number, number> = {};
    const weeklyMode: Record<string | number, number> = {}; // 8 or 6

    // Pre-calculate weekly modes for Part-Timers based on availability
    reps.forEach(rep => {
      weeklyHours[rep.id] = 0;
      if (rep.employment_type === 'part-time') {
        const availableDaysCount = week.days.filter(d => 
          availabilityMap.get(d)?.has(rep.id) && !timeOffMap.get(d)?.has(rep.id)
        ).length;

        // If available for 4+ days, prioritize 6h mode to reach 24.
        // If only 3 days, must be 8h mode.
        // If < 3, prefer 8h to get as close as possible.
        weeklyMode[rep.id] = availableDaysCount >= 4 ? 6 : 8;
      } else {
        // Full-timers always prefer 8h shifts initially
        weeklyMode[rep.id] = 8;
      }
    });

    // Track daily location occupancy
    const dailyOccupancy: Record<string, Record<string | number, number>> = {};
    week.days.forEach(day => {
      dailyOccupancy[day] = {};
      locations.forEach(l => dailyOccupancy[day][l.id] = 0);
    });

    // Schedule each day in the week
    week.days.forEach(dayStr => {
      // 1. Get eligible active reps
      let eligibleReps = reps.filter(rep => {
        if (rep.status !== 'active') return false;
        if (!availabilityMap.get(dayStr)?.has(rep.id)) return false;
        if (timeOffMap.get(dayStr)?.has(rep.id)) return false;
        return true;
      });

      // Determine overflow mode for the day
      const maxPerLocation = eligibleReps.length > locations.length ? 2 : 1;

      // 2. Prioritize reps furthest below target
      eligibleReps.sort((a, b) => {
        const aTarget = a.employment_type === 'full-time' ? 40 : 24;
        const bTarget = b.employment_type === 'full-time' ? 40 : 24;
        const aDeficit = aTarget - weeklyHours[a.id];
        const bDeficit = bTarget - weeklyHours[b.id];
        
        if (aDeficit !== bDeficit) return bDeficit - aDeficit; // Higher deficit first
        return String(a.id).localeCompare(String(b.id)); // Tiebreaker
      });

      // 3. Assign shifts
      eligibleReps.forEach(rep => {
        const currentHours = weeklyHours[rep.id];
        const isFT = rep.employment_type === 'full-time';
        const target = isFT ? 40 : 24;
        const maxLimit = isFT ? 44 : 24;

        // Skip if max reached
        if (currentHours >= maxLimit) return;

        // Determine shift candidates based on mode and remaining hours
        let shiftCandidates: { type: '8h' | '6h'; hours: number; start: string }[] = [];
        const mode = weeklyMode[rep.id];

        if (isFT) {
          // FT: Prefer 8h. Try 6h only if 8h exceeds max or to bridge 40->44 gap.
          if (currentHours + SHIFT_A_HOURS <= maxLimit) {
            shiftCandidates.push({ type: '8h', hours: SHIFT_A_HOURS, start: SHIFT_A_START });
          }
          if (currentHours + SHIFT_B_HOURS <= maxLimit) {
            shiftCandidates.push({ type: '6h', hours: SHIFT_B_HOURS, start: SHIFT_B_START });
          }
        } else {
          // PT: Strictly follow mode unless target reached
          const candidateHours = mode === 8 ? SHIFT_A_HOURS : SHIFT_B_HOURS;
          const candidateStart = mode === 8 ? SHIFT_A_START : SHIFT_B_START;
          const candidateType = mode === 8 ? '8h' : '6h';

          if (currentHours + candidateHours <= maxLimit) {
            shiftCandidates.push({ type: candidateType, hours: candidateHours, start: candidateStart });
          }
        }

        if (shiftCandidates.length === 0) return;

        // Location selection
        const potentialLocations = locations.filter(loc => {
          if (repLastLocation[rep.id] === loc.id) return false;
          if (dailyOccupancy[dayStr][loc.id] >= maxPerLocation) return false;
          return true;
        }).map(loc => ({
          ...loc,
          dist: getDistanceKm(rep.home_lat, rep.home_lng, loc.lat, loc.lng)
        }));

        const localLocations = potentialLocations.filter(l => l.dist <= 5.0).sort((a, b) => a.dist - b.dist);
        const distantLocations = potentialLocations.filter(l => l.dist > 5.0).sort((a, b) => a.dist - b.dist);

        let chosenLocation: (Location & { dist: number }) | undefined = undefined;

        // Try standard local search first
        const localEmpty = localLocations.find(l => dailyOccupancy[dayStr][l.id] === 0);
        if (localEmpty) {
          chosenLocation = localEmpty;
        } else if (localLocations.length > 0) {
          chosenLocation = localLocations[0];
        } else if (currentHours < target) {
          // Fallback logic: Ignore 5km if hours are needed to hit minimum target
          const distantEmpty = distantLocations.find(l => dailyOccupancy[dayStr][l.id] === 0);
          if (distantEmpty) {
            chosenLocation = distantEmpty;
          } else if (distantLocations.length > 0) {
            chosenLocation = distantLocations[0];
          }
        }

        if (chosenLocation) {
          const shift = shiftCandidates[0];
          schedule.push({
            id: `${dayStr}-${rep.id}`,
            date: dayStr,
            rep_id: rep.id,
            rep_name: rep.name,
            location_id: chosenLocation.id,
            location_name: chosenLocation.name,
            start_time: shift.start,
            end_time: SHIFT_END,
            distance_km: parseFloat(chosenLocation.dist.toFixed(2)),
            hours: shift.hours,
            shift_type: shift.type,
          });

          weeklyHours[rep.id] += shift.hours;
          repLastLocation[rep.id] = chosenLocation.id;
          dailyOccupancy[dayStr][chosenLocation.id] += 1;
        } else {
          unassignedDays.push({
            date: dayStr,
            rep_name: rep.name,
            reason: 'No available locations satisfying rotation, capacity, and distance fallback rules.'
          });
        }
      });

      // Record overflow
      Object.entries(dailyOccupancy[dayStr]).forEach(([locId, count]) => {
        if (count > 1) {
          const locName = locations.find(l => String(l.id) === locId)?.name || 'Unknown';
          overflowDays.push({ date: dayStr, location_name: locName, count });
        }
      });
    });

    // Check weekly hour compliance
    reps.forEach(rep => {
      if (rep.status !== 'active') return;
      const actual = weeklyHours[rep.id];
      const isFT = rep.employment_type === 'full-time';
      const min = isFT ? 40 : 24;

      if (actual < min) {
        hourGaps.push({
          rep_name: rep.name,
          week_start: weekKey,
          target: isFT ? '40-44h' : '24h',
          actual,
          reason: 'Insufficient availability or rule constraints prevented meeting the weekly hour requirement.'
        });
      }
    });
  });

  // Overall stats
  const repStats = reps.map(r => {
    let totalH = 0;
    schedule.forEach(s => { if (s.rep_id === r.id) totalH += s.hours; });
    let count = schedule.filter(s => s.rep_id === r.id).length;
    return { rep_id: r.id, rep_name: r.name, shiftCount: count, totalHours: totalH };
  });

  return {
    schedule,
    stats: {
      totalShifts: schedule.length,
      repStats,
      unassignedDays,
      overflowDays,
      hourGaps,
      dateRange: `${format(startDate, 'yyyy-MM-dd')} to ${format(endDate, 'yyyy-MM-dd')}`
    }
  };
};

export const getDefaultDateRange = (): { start: Date, end: Date } => {
  const today = new Date();
  let start = addDays(today, (7 - today.getDay()) % 7 || 7);
  const end = addDays(start, 13);
  return { start, end };
};
