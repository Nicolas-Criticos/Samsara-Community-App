CREATE TABLE IF NOT EXISTS project_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  completed_by text,
  completion_date date NOT NULL DEFAULT current_date,
  duration_notes text,
  final_result text NOT NULL,
  successes text,
  learning_curves text,
  rooms_to_improve text,
  total_cost numeric,
  bom_summary text,
  overall_rating int CHECK (overall_rating BETWEEN 1 AND 10),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE project_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow all" ON project_reviews FOR ALL USING (true) WITH CHECK (true);
