-- Migration: Add completed_at to projects table
-- Run in Supabase SQL editor

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ DEFAULT NULL;
