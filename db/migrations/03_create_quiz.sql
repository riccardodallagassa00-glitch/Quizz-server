CREATE TABLE quiz (
  id          SERIAL PRIMARY KEY,
  title       VARCHAR(150) NOT NULL,
  -- chiave esterna: ogni quiz appartiene a una categoria esistente.
  -- ON DELETE CASCADE: se elimino la categoria, spariscono anche i suoi quiz
  category_id INTEGER NOT NULL REFERENCES category(id) ON DELETE CASCADE
);