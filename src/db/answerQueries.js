// Query SQL per la tabella "answer".
const pool = require("../config/db.js");

// ATTENZIONE: restituisce anche is_correct. Serve solo alla logica lato server (es. verificare una risposta),
// NON va mai inviata così com'è a chi sta giocando.
async function getById(id) {
  const { rows } = await pool.query(
    "SELECT id, question_id, text, is_correct FROM answer WHERE id = $1",
    [id],
  );
  return rows[0];
}

// Le opzioni di una domanda SENZA is_correct: sicura da mandare al client durante il gioco
async function getByQuestionId(questionId) {
  const { rows } = await pool.query(
    "SELECT id, question_id, text FROM answer WHERE question_id = $1 ORDER BY id",
    [questionId],
  );
  return rows;
}

async function create({ question_id, text, is_correct = false }) {
  const { rows } = await pool.query(
    "INSERT INTO answer (question_id, text, is_correct) VALUES ($1, $2, $3) RETURNING *",
    [question_id, text, is_correct],
  );
  return rows[0];
}

// COALESCE tiene il valore attuale se non ne viene passato uno nuovo (funziona anche con is_correct = false)
async function update(id, { text = null, is_correct = null } = {}) {
  const { rows } = await pool.query(
    `UPDATE answer
     SET text = COALESCE($1, text),
         is_correct = COALESCE($2, is_correct)
     WHERE id = $3
     RETURNING *`,
    [text, is_correct, id],
  );
  return rows[0];
}

async function remove(id) {
  const { rows } = await pool.query(
    "DELETE FROM answer WHERE id = $1 RETURNING *",
    [id],
  );
  return rows[0];
}

module.exports = { getById, getByQuestionId, create, update, remove };
