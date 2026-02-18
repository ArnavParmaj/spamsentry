-- =====================================================
-- Migration: Add model_type column to history table
-- Run this in your Supabase SQL Editor
-- =====================================================

ALTER TABLE history
  ADD COLUMN IF NOT EXISTS model_type VARCHAR(10) DEFAULT 'sms';

-- Optional: add an index for filtering by model type
CREATE INDEX IF NOT EXISTS idx_history_model_type ON history(model_type);

-- Verify
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'history' AND column_name = 'model_type';
