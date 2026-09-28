-- Categorie dei quiz (es. Geografia, Scienza)
CREATE TABLE category (
  id   SERIAL PRIMARY KEY,               -- SERIAL = numero intero che si incrementa da solo
  name VARCHAR(100) NOT NULL UNIQUE      -- obbligatorio e non ripetibile
);