-- McDonald's Task Scheduler - Supabase Database Schema
-- This file contains the SQL schema for the data storage

-- Create the main data table
CREATE TABLE IF NOT EXISTS mcd_data (
  id BIGSERIAL PRIMARY KEY,
  category VARCHAR(100) NOT NULL,
  filename VARCHAR(255) NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(category, filename)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_mcd_data_category_filename ON mcd_data(category, filename);
CREATE INDEX IF NOT EXISTS idx_mcd_data_category ON mcd_data(category);
CREATE INDEX IF NOT EXISTS idx_mcd_data_updated_at ON mcd_data(updated_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE mcd_data ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for now (you can customize this based on your needs)
CREATE POLICY "Allow all operations on mcd_data" ON mcd_data
  FOR ALL
  TO authenticated, anon
  USING (true)
  WITH CHECK (true);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_mcd_data_updated_at ON mcd_data;
CREATE TRIGGER update_mcd_data_updated_at
  BEFORE UPDATE ON mcd_data
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create a function to initialize the table (used by the app)
CREATE OR REPLACE FUNCTION create_mcd_data_table_if_not_exists()
RETURNS void AS $$
BEGIN
  -- This function is called by the app to ensure table exists
  -- The actual table creation happens above
  NULL;
END;
$$ LANGUAGE plpgsql;

-- Insert sample data (optional - remove if you don't want sample data)
-- INSERT INTO mcd_data (category, filename, data) VALUES 
-- ('schedules', '2025-01-01', '{"employees": [], "uploadedAt": "2025-01-01T00:00:00.000Z"}')
-- ON CONFLICT (category, filename) DO NOTHING;
