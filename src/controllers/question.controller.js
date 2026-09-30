// Logica della rotta POST /api/questions/:id/answers: aggiunge opzioni di risposta
// a una domanda che esiste già (diverso da createQuiz, che crea tutto insieme da zero).
const answerRepositories = require("../repositories/answerRepositories.js");
const parseId = require("../utils/parseId.js");

// Funzione chiamata quando arriva una richiesta POST /api/questions/:id/answers
// Body atteso: { "answers": [ { "text": "...", "is_correct": true/false }, ... ] }
// Si possono aggiungere una o più risposte in una sola richiesta.
async function addAnswers(req, res) {
  const questionId = parseId(req.params.id);
  if (questionId === null) {
    return res.status(400).json({
      errore: "ID domanda non valido: deve essere un numero intero positivo",
    });
  }

  const { answers } = req.body;

  // deve esserci un array "answers", e non può essere vuoto
  if (!Array.isArray(answers) || answers.length === 0) {
    return res
      .status(400)
      .json({ errore: "Serve un array 'answers' con almeno un'opzione" });
  }

  // controllo OGNI singola risposta prima di provare a salvare qualsiasi cosa
  for (const [i, a] of answers.entries()) {
    if (!a.text || typeof a.text !== "string" || !a.text.trim()) {
      return res
        .status(400)
        .json({ errore: `Opzione ${i + 1}: il testo è obbligatorio` });
    }
    // is_correct deve essere ESATTAMENTE true o false (un booleano), non una stringa "true"/"si" ecc.
    if (typeof a.is_correct !== "boolean") {
      return res.status(400).json({
        errore: `Opzione ${i + 1}: is_correct deve essere true o false`,
      });
    }
  }

  try {
    // quante risposte corrette esistono GIÀ per questa domanda, prima di aggiungerne altre
    const correttiEsistenti = await answerRepositories.countCorrect(questionId);

    // quante, tra le NUOVE risposte che sto per aggiungere, sono segnate come corrette
    const correttiNuovi = answers.filter((a) => a.is_correct).length;

    // dopo l'inserimento il totale deve essere ESATTAMENTE 1 (mai 0, mai più di 1):
    // così la regola "una sola risposta corretta per domanda" vale anche se le risposte
    // vengono aggiunte in più richieste separate, non tutte insieme
    if (correttiEsistenti + correttiNuovi !== 1) {
      return res.status(400).json({
        errore: `La domanda deve avere esattamente una risposta corretta (dopo questa aggiunta ne avrebbe ${correttiEsistenti + correttiNuovi})`,
      });
    }

    // se il controllo sopra è passato, inserisco davvero le nuove risposte
    const inserite = await answerRepositories.addMany(questionId, answers);
    res.status(201).json(inserite);
  } catch (errore) {
    // 23503 = violazione FOREIGN KEY: la domanda indicata (questionId) non esiste
    if (errore.code === "23503") {
      return res.status(400).json({ errore: "Domanda non valida" });
    }
    console.error("Errore in addAnswers:", errore.message);
    res.status(500).json({ errore: "Errore interno del server" });
  }
}

module.exports = { addAnswers };
