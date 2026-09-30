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

// --- Aggiunte per il TASK 4 ---

// Il quiz "completo", pronto per il giocatore: quiz + le sue domande + le opzioni di risposta,
// MA SENZA MAI is_correct (le query selezionano solo le colonne che possono uscire dal server)
async function getFullById(id) {
  const quiz = await getById(id);
  if (!quiz) return undefined;

  const { rows: questions } = await pool.query(
    "SELECT id, text FROM question WHERE quiz_id = $1 ORDER BY id",
    [id],
  );

  for (const domanda of questions) {
    const { rows: answers } = await pool.query(
      "SELECT id, text FROM answer WHERE question_id = $1 ORDER BY id",
      [domanda.id],
    );
    domanda.answers = answers;
  }

  return { ...quiz, questions };
}

// Crea quiz + domande + risposte in un'unica operazione ATOMICA: o va tutto a buon fine,
// o non viene salvato nulla (transazione BEGIN/COMMIT/ROLLBACK, come richiesto dal documento)
async function createFull({ title, category_id, questions }) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const quizResult = await client.query(
      "INSERT INTO quiz (title, category_id) VALUES ($1, $2) RETURNING id, title, category_id",
      [title, category_id],
    );
    const quiz = quizResult.rows[0];
    quiz.questions = [];

    for (const q of questions) {
      const questionResult = await client.query(
        "INSERT INTO question (quiz_id, text) VALUES ($1, $2) RETURNING id, text",
        [quiz.id, q.text],
      );
      const domanda = questionResult.rows[0];
      domanda.answers = [];

      for (const a of q.answers) {
        const answerResult = await client.query(
          "INSERT INTO answer (question_id, text, is_correct) VALUES ($1, $2, $3) RETURNING id, text, is_correct",
          [domanda.id, a.text, a.is_correct],
        );
        domanda.answers.push(answerResult.rows[0]);
      }
      quiz.questions.push(domanda);
    }

    await client.query("COMMIT");
    return quiz;
  } catch (errore) {
    await client.query("ROLLBACK"); // annullo tutto: niente quiz "a metà" nel database
    throw errore;
  } finally {
    client.release();
  }
}

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
  getFullById,
  createFull,
};
