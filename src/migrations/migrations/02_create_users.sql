CREATE TABLE users (
  id         SERIAL PRIMARY KEY,
  username   VARCHAR(50)  NOT NULL UNIQUE,
  email      VARCHAR(255) NOT NULL UNIQUE,
  password   VARCHAR(255) NOT NULL,      -- qui salveremo l'hash bcrypt, MAI la password in chiaro
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()  -- data di registrazione, compilata in automatico
);