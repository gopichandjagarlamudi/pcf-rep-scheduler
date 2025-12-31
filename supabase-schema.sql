-- PCF Rep Scheduler Database Schema
-- Run this SQL in your Supabase SQL Editor

-- Create schedules table
CREATE TABLE IF NOT EXISTS schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  schedule_data JSONB NOT NULL,
  stats_data JSONB NOT NULL,
  date_range_start DATE NOT NULL,
  date_range_end DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create index for faster queries by user_id
CREATE INDEX IF NOT EXISTS schedules_user_id_idx ON schedules(user_id);

-- Create index for faster queries by created_at (for getting latest)
CREATE INDEX IF NOT EXISTS schedules_created_at_idx ON schedules(created_at DESC);

-- Enable Row Level Security
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can only read their own schedules
CREATE POLICY "Users can view their own schedules"
  ON schedules
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy: Users can insert their own schedules
CREATE POLICY "Users can create their own schedules"
  ON schedules
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policy: Users can update their own schedules
CREATE POLICY "Users can update their own schedules"
  ON schedules
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create policy: Users can delete their own schedules
CREATE POLICY "Users can delete their own schedules"
  ON schedules
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to auto-update updated_at
CREATE TRIGGER update_schedules_updated_at
  BEFORE UPDATE ON schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
