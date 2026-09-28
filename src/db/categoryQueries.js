// Query SQL per la tabella "category".
// Ogni funzione restituisce solo i dati: sarà il controller a decidere cosa rispondere al client.
const pool = require("../config/db.js");

// Tutte le categorie, in ordine alfabetico
async function getAll() {
  const { rows } = await pool.query(
    "SELECT id, name FROM category ORDER BY name",
  );
  return rows; // array di oggetti (vuoto se non ci sono categorie)
}

// Una categoria per id. rows[0] è la prima riga trovata, oppure undefined se non esiste
async function getById(id) {
  const { rows } = await pool.query(
    "SELECT id, name FROM category WHERE id = $1",
    [id],
  );
  return rows[0];
}

// Crea una categoria. RETURNING * restituisce la riga appena inserita (con l'id assegnato dal database)
async function create(name) {
  const { rows } = await pool.query(
    "INSERT INTO category (name) VALUES ($1) RETURNING *",
    [name],
  );
  return rows[0];
}

// Rinomina una categoria. Se l'id non esiste non viene modificata nessuna riga e restituisco undefined
async function update(id, name) {
  const { rows } = await pool.query(
    "UPDATE category SET name = $1 WHERE id = $2 RETURNING *",
    [name, id],
  );
  return rows[0];
}

// Elimina una categoria (a cascata spariscono anche quiz, domande e risposte collegati)
async function remove(id) {
  const { rows } = await pool.query(
    "DELETE FROM category WHERE id = $1 RETURNING *",
    [id],
  );
  return rows[0];
}

module.exports = { getAll, getById, create, update, remove };
