CREATE TABLE answer (
  id          SERIAL PRIMARY KEY,
  question_id INTEGER NOT NULL REFERENCES question(id) ON DELETE CASCADE,
  text        VARCHAR(255) NOT NULL,
  is_correct  BOOLEAN NOT NULL DEFAULT FALSE  -- true solo per la risposta giusta
);