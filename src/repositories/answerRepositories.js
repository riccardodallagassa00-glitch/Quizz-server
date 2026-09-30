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

// --- Aggiunte per il TASK 4: inserimento multiplo con transazione, e conteggio risposte corrette ---

// Inserisce PIÙ opzioni di risposta per la stessa domanda, tutte insieme, dentro una transazione:
// o vengono salvate tutte, o (se una fallisce) non ne resta salvata nessuna.
// Evita situazioni "a metà", tipo una domanda con solo 1 risposta su 4 perché le altre 3 sono fallite.
async function addMany(questionId, answers) {
  // Prendo una connessione dedicata dal pool, necessaria per usare BEGIN/COMMIT/ROLLBACK
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Accumulo qui le risposte inserite con successo, una alla volta
    const inserite = [];

    // "for...of" con "await" dentro: inserisco le risposte una dopo l'altra, in ordine,
    // non tutte insieme in parallelo (più semplice da seguire e da annullare in caso di errore)
    for (const a of answers) {
      const { rows } = await client.query(
        "INSERT INTO answer (question_id, text, is_correct) VALUES ($1, $2, $3) RETURNING id, text, is_correct",
        [questionId, a.text, a.is_correct],
      );
      inserite.push(rows[0]);
    }

    // tutte le risposte sono state inserite senza errori: rendo tutto definitivo
    await client.query("COMMIT");
    return inserite;
  } catch (errore) {
    // qualcosa è andato storto: annullo tutte le risposte già inserite in questa chiamata
    await client.query("ROLLBACK");
    throw errore;
  } finally {
    // restituisco sempre la connessione al pool, in ogni caso
    client.release();
  }
}

// Conta quante risposte SEGNATE COME CORRETTE esistono già per una data domanda.
// Serve per controllare la regola "esattamente una risposta corretta per domanda"
// anche quando le risposte vengono aggiunte in momenti diversi, non tutte insieme.
async function countCorrect(questionId) {
  // COUNT(*) conta le righe che soddisfano la condizione; "::int" converte il risultato
  // (che PostgreSQL restituirebbe come testo) in un vero numero JavaScript
  const { rows } = await pool.query(
    "SELECT COUNT(*)::int AS totale FROM answer WHERE question_id = $1 AND is_correct = true",
    [questionId],
  );
  return rows[0].totale;
}

module.exports = {
  getById,
  getByQuestionId,
  create,
  update,
  remove,
  addMany,
  countCorrect,
};
