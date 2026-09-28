// Query SQL per la tabella "quiz".
const pool = require("../config/db.js");

// Tutti i quiz. Se passo categoryId filtra per categoria, altrimenti restituisce tutti.
// "$1::int IS NULL" è vero quando non è stato passato nessun filtro.
async function getAll(categoryId = null) {
  const { rows } = await pool.query(
    `SELECT id, title, category_id
     FROM quiz
     WHERE ($1::int IS NULL OR category_id = $1)
     ORDER BY id`,
    [categoryId],
  );
  return rows;
}

async function getById(id) {
  const { rows } = await pool.query(
    "SELECT id, title, category_id FROM quiz WHERE id = $1",
    [id],
  );
  return rows[0];
}

// Se category_id non esiste, PostgreSQL lancia un errore con codice 23503 (violazione FOREIGN KEY)
async function create({ title, category_id }) {
  const { rows } = await pool.query(
    "INSERT INTO quiz (title, category_id) VALUES ($1, $2) RETURNING *",
    [title, category_id],
  );
  return rows[0];
}

async function update(id, { title = null, category_id = null } = {}) {
  const { rows } = await pool.query(
    `UPDATE quiz
     SET title = COALESCE($1, title),
         category_id = COALESCE($2, category_id)
     WHERE id = $3
     RETURNING *`,
    [title, category_id, id],
  );
  return rows[0];
}

async function remove(id) {
  const { rows } = await pool.query(
    "DELETE FROM quiz WHERE id = $1 RETURNING *",
    [id],
  );
  return rows[0];
}

module.exports = { getAll, getById, create, update, remove };
