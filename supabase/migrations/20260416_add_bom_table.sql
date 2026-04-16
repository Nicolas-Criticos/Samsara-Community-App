-- BOM (Bill of Materials) table for projects
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS project_bom_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  quantity numeric NOT NULL DEFAULT 1,
  unit_cost numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for fast lookups by project
CREATE INDEX IF NOT EXISTS idx_bom_items_project ON project_bom_items(project_id);

-- RLS
ALTER TABLE project_bom_items ENABLE ROW LEVEL SECURITY;

-- SELECT: project creator or contributors can view
CREATE POLICY bom_select ON project_bom_items
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_bom_items.project_id
        AND p.created_by = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM project_contributors pc
      WHERE pc.project_id = project_bom_items.project_id
        AND pc.member_id = auth.uid()
    )
  );

-- INSERT: only project creator
CREATE POLICY bom_insert ON project_bom_items
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_bom_items.project_id
        AND p.created_by = auth.uid()
    )
  );

-- UPDATE: only project creator
CREATE POLICY bom_update ON project_bom_items
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_bom_items.project_id
        AND p.created_by = auth.uid()
    )
  );

-- DELETE: only project creator
CREATE POLICY bom_delete ON project_bom_items
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_bom_items.project_id
        AND p.created_by = auth.uid()
    )
  );
