-- AprendePIC18: progreso de quizzes, ruta de estudio y checklists por usuario CALETAS
CREATE TABLE IF NOT EXISTS aprende_pic18_progress (
  user_id TEXT PRIMARY KEY REFERENCES "User"(id) ON DELETE CASCADE,
  payload JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS aprende_pic18_progress_updated_at_idx
  ON aprende_pic18_progress (updated_at DESC);

-- Ejemplo de payload:
-- {
--   "quizzes": { "gpio": { "score": 100, "passed": true, "correct": 2, "total": 2, "at": "..." } },
--   "studyPath": { "c01-l1": true },
--   "checklists": { "aprende-pic18-course-inicio": { "ruta": true } }
-- }
