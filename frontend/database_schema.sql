-- =====================================================
-- SpamSentry History Table Schema
-- =====================================================
-- This table stores all spam scan results for users
-- Each scan is linked to a user via user_id (Supabase Auth)

-- 1. CREATE THE HISTORY TABLE
CREATE TABLE history (
  -- Primary key: Auto-generated UUID
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Foreign key: Links to auth.users table
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Scan data
  text TEXT NOT NULL,                    -- The message/text that was scanned
  result VARCHAR(50) NOT NULL,           -- "SPAM" or "HAM" 
  confidence DECIMAL(5,2) NOT NULL,      -- Confidence score (0.00 to 1.00)
  is_spam BOOLEAN NOT NULL DEFAULT false, -- Quick boolean flag
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),  -- Timestamp of the scan
  
  -- Optional: Add indexes for performance
  CONSTRAINT confidence_range CHECK (confidence >= 0 AND confidence <= 1)
);

-- 2. CREATE INDEXES FOR BETTER PERFORMANCE
CREATE INDEX idx_history_user_id ON history(user_id);
CREATE INDEX idx_history_created_at ON history(created_at DESC);
CREATE INDEX idx_history_is_spam ON history(is_spam);

-- 3. ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE history ENABLE ROW LEVEL SECURITY;

-- 4. CREATE RLS POLICIES
-- Policy 1: Users can only SELECT their own history
CREATE POLICY "Users can view own history"
  ON history
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy 2: Users can only INSERT their own history
CREATE POLICY "Users can insert own history"
  ON history
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy 3: Users can only DELETE their own history
CREATE POLICY "Users can delete own history"
  ON history
  FOR DELETE
  USING (auth.uid() = user_id);

-- Policy 4: Users can only UPDATE their own history (optional)
CREATE POLICY "Users can update own history"
  ON history
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Run these to verify the table was created correctly

-- Check table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'history';

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'history';

-- Check policies
SELECT polname, polcmd 
FROM pg_policy 
WHERE polrelid = 'history'::regclass;
