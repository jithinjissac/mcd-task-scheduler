import { supabase } from '@/lib/supabase';

// Database initialization script
export async function initializeDatabase(): Promise<boolean> {
  try {
    console.log('🔧 Initializing McDonald\'s Task Scheduler database...');

    // First, try to create the table using a direct SQL command
    const { error: createTableError } = await supabase.rpc('exec_sql', {
      sql: `
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

        -- Create indexes for faster queries
        CREATE INDEX IF NOT EXISTS idx_mcd_data_category_filename ON mcd_data(category, filename);
        CREATE INDEX IF NOT EXISTS idx_mcd_data_category ON mcd_data(category);
        CREATE INDEX IF NOT EXISTS idx_mcd_data_updated_at ON mcd_data(updated_at DESC);

        -- Enable Row Level Security (RLS)
        ALTER TABLE mcd_data ENABLE ROW LEVEL SECURITY;

        -- Create policy to allow all operations
        DROP POLICY IF EXISTS "Allow all operations on mcd_data" ON mcd_data;
        CREATE POLICY "Allow all operations on mcd_data" ON mcd_data
          FOR ALL
          TO authenticated, anon
          USING (true)
          WITH CHECK (true);

        -- Create trigger function
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;

        -- Create trigger
        DROP TRIGGER IF EXISTS update_mcd_data_updated_at ON mcd_data;
        CREATE TRIGGER update_mcd_data_updated_at
          BEFORE UPDATE ON mcd_data
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();
      `
    });

    if (createTableError) {
      console.log('⚠️ Direct table creation failed, trying alternative method:', createTableError.message);
      
      // Alternative: Try to insert a test record to trigger table creation
      const { error: insertError } = await supabase
        .from('mcd_data')
        .insert({
          category: 'test',
          filename: 'init',
          data: { message: 'Database initialized', timestamp: new Date().toISOString() }
        });

      if (insertError) {
        console.error('❌ Database initialization failed:', insertError);
        return false;
      }

      // Clean up the test record
      await supabase
        .from('mcd_data')
        .delete()
        .eq('category', 'test')
        .eq('filename', 'init');
    }

    // Test the connection
    const { data, error: testError } = await supabase
      .from('mcd_data')
      .select('*')
      .limit(1);

    if (testError) {
      console.error('❌ Database test failed:', testError);
      return false;
    }

    console.log('✅ Database initialized successfully!');
    return true;

  } catch (error) {
    console.error('❌ Database initialization error:', error);
    return false;
  }
}

// Call this function to set up the database
export default initializeDatabase;
