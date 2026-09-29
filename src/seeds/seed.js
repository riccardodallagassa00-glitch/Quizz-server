// Riempie il database con dati di esempio. Si lancia con: npm run seed
const pool = require("../src/config/db.js");
const seedData = require("./seed-data.js");

async function seed() {
  // una sola connessione per tutto lo script, così la transazione vale per tutte le query
  const client = await pool.connect();
  try {
    // se ci sono già categorie non inserisco niente: così il seed non crea doppioni
    const { rows } = await client.query(
      "SELECT COUNT(*) AS totale FROM category",
    );
    // COUNT restituisce un numero grande che pg consegna come testo: lo converto in numero
    if (Number(rows[0].totale) > 0) {
      console.log("Il database contiene già delle categorie: seed saltato.");
      return;
    }

    // transazione: o viene inserito tutto, o non viene inserito niente
    await client.query("BEGIN");

    for (const cat of seedData) {
      // RETURNING id = il database ci restituisce l'id che ha appena assegnato alla riga inserita
      const resCat = await client.query(
        "INSERT INTO category (name) VALUES ($1) RETURNING id",
        [cat.name],
      );
      const categoryId = resCat.rows[0].id;

      for (const quiz of cat.quizzes) {
        const resQuiz = await client.query(
          "INSERT INTO quiz (title, category_id) VALUES ($1, $2) RETURNING id",
          [quiz.title, categoryId],
        );
        const quizId = resQuiz.rows[0].id;

        for (const q of quiz.questions) {
          const resQuestion = await client.query(
            "INSERT INTO question (quiz_id, text) VALUES ($1, $2) RETURNING id",
            [quizId, q.text],
          );
          const questionId = resQuestion.rows[0].id;

          // una riga per ogni opzione; is_correct è true solo per la posizione indicata da "correct"
          for (let i = 0; i < q.options.length; i++) {
            await client.query(
              "INSERT INTO answer (question_id, text, is_correct) VALUES ($1, $2, $3)",
              [questionId, q.options[i], i === q.correct],
            );
          }
        }
      }
      console.log(`Categoria "${cat.name}" inserita.`);
    }

    await client.query("COMMIT");
    console.log("Seed completato.");
  } catch (errore) {
    await client.query("ROLLBACK"); // annullo tutto quello inserito finora
    console.error("Errore durante il seed:", errore.message);
    process.exitCode = 1;
  } finally {
    client.release(); // restituisco la connessione al pool
    await pool.end(); // chiudo il pool, altrimenti lo script resterebbe appeso
  }
}

seed();
