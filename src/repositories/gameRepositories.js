// Query SQL specifiche per la logica del gioco: pesca domande casuali e verifica le risposte.
const pool = require("../config/db.js");

// Restituisce fino a "limit" domande casuali di una categoria, prese da QUALSIASI quiz
// che appartiene a quella categoria (JOIN tra question e quiz, filtrato su quiz.category_id).
// ORDER BY RANDOM() fa fare a PostgreSQL stesso l'estrazione casuale, prima del LIMIT.
async function getRandomQuestions(categoryId, limit = 10) {
  const { rows } = await pool.query(
    `SELECT q.id, q.text
     FROM question q
     JOIN quiz qz ON q.quiz_id = qz.id
     WHERE qz.category_id = $1
     ORDER BY RANDOM()
     LIMIT $2`,
    [categoryId, limit],
  );
  return rows;
}

// Verifica, IN UN'UNICA QUERY, quali tra gli id di risposta ricevuti dal client sono corretti.
// "= ANY($1::int[])" significa "il cui id è presente in questo array di numeri":
// molto più efficiente di fare 10 query separate (una per ogni risposta).
async function verifyAnswers(answerIds) {
  const { rows } = await pool.query(
    "SELECT id, question_id, is_correct FROM answer WHERE id = ANY($1::int[])",
    [answerIds],
  );
  return rows;
}

module.exports = { getRandomQuestions, verifyAnswers };
