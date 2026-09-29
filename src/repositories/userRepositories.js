// Query SQL per la tabella "users".
// REGOLA: la colonna "password" non compare mai in una SELECT o in un RETURNING,
// così non può finire per errore in una risposta API.
const pool = require("../config/db.js");

async function getById(id) {
  const { rows } = await pool.query(
    "SELECT id, username, email, created_at FROM users WHERE id = $1",
    [id],
  );
  return rows[0];
}

// "password" qui deve essere GIÀ l'hash bcrypt (lo calcoleremo nel TASK 2), mai la password in chiaro.
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
// Così si può aggiornare anche un solo campo.
async function update(id, { username = null, email = null } = {}) {
  const { rows } = await pool.query(
    `UPDATE users
     SET username = COALESCE($1, username),
         email = COALESCE($2, email)
     WHERE id = $3
     RETURNING id, username, email, created_at`,
    [username, email, id],
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

module.exports = { getById, create, update, remove };
