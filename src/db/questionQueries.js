// Query SQL per la tabella "question".
const pool = require("../config/db.js");

// Tutte le domande di un quiz
async function getByQuizId(quizId) {
  const { rows } = await pool.query(
    "SELECT id, quiz_id, text FROM question WHERE quiz_id = $1 ORDER BY id",
    [quizId],
  );
  return rows;
}

async function getById(id) {
  const { rows } = await pool.query(
    "SELECT id, quiz_id, text FROM question WHERE id = $1",
    [id],
  );
  return rows[0];
}

async function create({ quiz_id, text }) {
  const { rows } = await pool.query(
    "INSERT INTO question (quiz_id, text) VALUES ($1, $2) RETURNING *",
    [quiz_id, text],
  );
  return rows[0];
}

// Di una domanda si modifica solo il testo
async function update(id, text) {
  const { rows } = await pool.query(
    "UPDATE question SET text = $1 WHERE id = $2 RETURNING *",
    [text, id],
  );
  return rows[0];
}

async function remove(id) {
  const { rows } = await pool.query(
    "DELETE FROM question WHERE id = $1 RETURNING *",
    [id],
  );
  return rows[0];
}

module.exports = { getByQuizId, getById, create, update, remove };
