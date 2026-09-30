// Query SQL per la tabella "users".
// REGOLA: la colonna "password" non compare mai in una SELECT o in un RETURNING,
// così non può finire per errore in una risposta API.
const pool = require("../config/db.js");

// Tutti gli utenti, con filtri opzionali: name (cerca nello username) e limit (numero massimo di righe)
async function getAll({ name = null, limit = null } = {}) {
  // ILIKE = confronto testuale insensibile a maiuscole/minuscole, diretto in PostgreSQL
  // (equivalente al toLowerCase()+includes() che usavamo con l'array in memoria)
  // "%" + name + "%" = cerca "name" in QUALSIASI punto dello username, non solo all'inizio
  const pattern = name ? `%${name}%` : null;

  // "$1::text IS NULL OR username ILIKE $1" = se non passo un filtro, la condizione è sempre vera
  // e restituisce tutti gli utenti; stesso trucco già usato in quizQueries.getAll
  const { rows } = await pool.query(
    `SELECT id, username, email, created_at
     FROM users
     WHERE ($1::text IS NULL OR username ILIKE $1)
     ORDER BY id
     LIMIT $2`,
    [pattern, limit], // se limit è null, PostgreSQL interpreta "LIMIT NULL" come "nessun limite"
  );
  return rows;
}

async function getById(id) {
  const { rows } = await pool.query(
    "SELECT id, username, email, created_at FROM users WHERE id = $1",
    [id],
  );
  return rows[0];
}
// registrazione. Restituisce solo l'id (o undefined se nessuno esiste già): non ci serve altro.
async function findByEmailOrUsername(email, username) {
  const { rows } = await pool.query(
    "SELECT id FROM users WHERE email = $1 OR username = $2",
    [email, username],
  );
  return rows[0];
}

// Usata SOLO dal login: cerca per email O username, e restituisce anche la password (già cifrata),
// perché il controller deve confrontarla con quella inviata usando bcrypt.compare.
async function findForLogin(identifier) {
  const { rows } = await pool.query(
    "SELECT id, username, email, password FROM users WHERE email = $1 OR username = $1",
    [identifier],
  );
  return rows[0];
}

// "password" qui deve essere GIÀ l'hash bcrypt, mai la password in chiaro.
// Se username o email esistono già, PostgreSQL lancia un errore con codice 23505 (violazione UNIQUE):
// lo intercetterà il controller.
async function create({ username, email, password }) {
  const { rows } = await pool.query(
    "INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id, username, email, created_at",
    [username, email, password],
  );
  return rows[0];
}

// COALESCE($1, colonna) significa: usa il nuovo valore se è stato passato (non null), altrimenti tieni quello attuale.
// Così si può aggiornare anche un solo campo. "password", se passata, deve arrivare GIÀ cifrata dal controller.
async function update(
  id,
  { username = null, email = null, password = null } = {},
) {
  const { rows } = await pool.query(
    `UPDATE users
     SET username = COALESCE($1, username),
         email = COALESCE($2, email),
         password = COALESCE($3, password)
     WHERE id = $4
     RETURNING id, username, email, created_at`,
    [username, email, password, id],
  );
  return rows[0];
}

async function remove(id) {
  const { rows } = await pool.query(
    "DELETE FROM users WHERE id = $1 RETURNING id, username, email, created_at",
    [id],
  );
  return rows[0];
}

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
  findByEmailOrUsername,
  findForLogin,
};
