import { supabase } from './supabase';
import { ScheduleEntry, ScheduleStats } from '../types';

export interface SavedSchedule {
  id: string;
  user_id: string;
  schedule_data: ScheduleEntry[];
  stats_data: ScheduleStats;
  date_range_start: string;
  date_range_end: string;
  created_at: string;
  updated_at: string;
}

/**
 * Save or update the user's schedule in the database
 * This will replace any existing schedule for the user (Option A: latest only)
 */
export async function saveSchedule(
  schedule: ScheduleEntry[],
  stats: ScheduleStats,
  dateRangeStart: string,
  dateRangeEnd: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    // Check if user already has a schedule
    const { data: existingSchedules } = await supabase
      .from('schedules')
      .select('id')
      .eq('user_id', user.id)
      .limit(1);

    if (existingSchedules && existingSchedules.length > 0) {
      // Update existing schedule
      const { error } = await supabase
        .from('schedules')
        .update({
          schedule_data: schedule,
          stats_data: stats,
          date_range_start: dateRangeStart,
          date_range_end: dateRangeEnd,
        })
        .eq('id', existingSchedules[0].id);

      if (error) {
        console.error('Error updating schedule:', error);
        return { success: false, error: error.message };
      }
    } else {
      // Insert new schedule
      const { error } = await supabase
        .from('schedules')
        .insert({
          user_id: user.id,
          schedule_data: schedule,
          stats_data: stats,
          date_range_start: dateRangeStart,
          date_range_end: dateRangeEnd,
        });

      if (error) {
        console.error('Error inserting schedule:', error);
        return { success: false, error: error.message };
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Unexpected error saving schedule:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Load the user's latest schedule from the database
 */
export async function loadSchedule(): Promise<{
  success: boolean;
  schedule?: ScheduleEntry[];
  stats?: ScheduleStats;
  dateRange?: { start: string; end: string };
  error?: string;
}> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const { data, error } = await supabase
      .from('schedules')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      // No schedule found is not an error, just return empty
      if (error.code === 'PGRST116') {
        return { success: true };
      }
      console.error('Error loading schedule:', error);
      return { success: false, error: error.message };
    }

    if (!data) {
      return { success: true };
    }

    return {
      success: true,
      schedule: data.schedule_data as ScheduleEntry[],
      stats: data.stats_data as ScheduleStats,
      dateRange: {
        start: data.date_range_start,
        end: data.date_range_end,
      },
    };
  } catch (error) {
    console.error('Unexpected error loading schedule:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Delete the user's schedule
 */
export async function deleteSchedule(): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const { error } = await supabase
      .from('schedules')
      .delete()
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting schedule:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Unexpected error deleting schedule:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}
