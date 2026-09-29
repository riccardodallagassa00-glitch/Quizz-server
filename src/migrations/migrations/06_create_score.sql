CREATE TABLE score (
  id             SERIAL PRIMARY KEY,
  user_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id    INTEGER NOT NULL REFERENCES category(id) ON DELETE CASCADE,
  score_obtained INTEGER NOT NULL,
  max_score      INTEGER NOT NULL,
  completed_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- controllo a livello di database: il punteggio non può essere negativo né superare il massimo
  CHECK (score_obtained >= 0 AND score_obtained <= max_score)
);