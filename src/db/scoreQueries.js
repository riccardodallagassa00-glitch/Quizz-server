// Query SQL per la tabella "score".
// Un punteggio, una volta registrato, non si modifica: per questo qui non c'è "update".
const pool = require("../config/db.js");

async function getById(id) {
  const { rows } = await pool.query(
    "SELECT id, user_id, category_id, score_obtained, max_score, completed_at FROM score WHERE id = $1",
    [id],
  );
  return rows[0];
}

// Storico di un utente, dal più recente. Il JOIN unisce la tabella category per avere anche il nome
// della categoria (c.name) e non solo il suo id.
async function getByUserId(userId) {
  const { rows } = await pool.query(
    `SELECT s.id, s.category_id, c.name AS category_name, s.score_obtained, s.max_score, s.completed_at
     FROM score s
     JOIN category c ON c.id = s.category_id
     WHERE s.user_id = $1
     ORDER BY s.completed_at DESC`,
    [userId],
  );
  return rows;
}

async function create({ user_id, category_id, score_obtained, max_score }) {
  const { rows } = await pool.query(
    `INSERT INTO score (user_id, category_id, score_obtained, max_score)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [user_id, category_id, score_obtained, max_score],
  );
  return rows[0];
}

async function remove(id) {
  const { rows } = await pool.query(
    "DELETE FROM score WHERE id = $1 RETURNING *",
    [id],
  );
  return rows[0];
}

module.exports = { getById, getByUserId, create, remove };
