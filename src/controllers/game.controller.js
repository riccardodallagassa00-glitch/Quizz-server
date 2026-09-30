// Logica del gioco: avvio partita e invio delle risposte finali.
// Entrambe le rotte sono PROTETTE da authMiddleware: solo un utente loggato può giocare.
const gameRepositories = require("../repositories/gameRepositories.js");
const answerRepositories = require("../repositories/answerRepositories.js");
const scoreRepositories = require("../repositories/scoreRepositories.js");
const parseId = require("../utils/parseId.js");

const DOMANDE_PER_PARTITA = 10;

// POST /api/game/start?category_id=X
// Restituisce 10 domande casuali della categoria scelta, CON le opzioni di risposta
// ma SENZA rivelare mai quale sia quella corretta (usiamo answerRepositories.getByQuestionId,
// la versione "sicura" che non seleziona mai is_correct).
async function startGame(req, res) {
  const categoryId = parseId(req.query.category_id);
  if (categoryId === null) {
    return res.status(400).json({
      errore: "category_id è obbligatorio e deve essere un numero intero",
    });
  }

  try {
    const domande = await gameRepositories.getRandomQuestions(
      categoryId,
      DOMANDE_PER_PARTITA,
    );

    // Se la categoria ha meno di 10 domande disponibili in totale, non possiamo giocare:
    // controlliamo semplicemente quante ne sono state restituite (il documento ammette questo approccio,
    // più semplice del fare un COUNT(*) separato prima)
    if (domande.length < DOMANDE_PER_PARTITA) {
      return res.status(400).json({
        errore: `Questa categoria non ha abbastanza domande per giocare (servono almeno ${DOMANDE_PER_PARTITA}, disponibili: ${domande.length})`,
      });
    }

    // per ognuna delle 10 domande, aggiungo le sue opzioni di risposta (sempre senza is_correct)
    for (const domanda of domande) {
      domanda.answers = await answerRepositories.getByQuestionId(domanda.id);
    }

    res.json({ category_id: categoryId, questions: domande });
  } catch (errore) {
    console.error("Errore in startGame:", errore.message);
    res.status(500).json({ errore: "Errore interno del server" });
  }
}

// POST /api/game/submit
// Body atteso: { "category_id": X, "answers": [ { "question_id": ..., "answer_id": ... }, ... ] }
// con ESATTAMENTE 10 coppie, una per ogni domanda della partita.
async function submitGame(req, res) {
  const { category_id, answers } = req.body;

  const categoryId = parseId(String(category_id));
  if (categoryId === null) {
    return res.status(400).json({
      errore: "category_id è obbligatorio e deve essere un numero intero",
    });
  }

  if (!Array.isArray(answers) || answers.length !== DOMANDE_PER_PARTITA) {
    return res
      .status(400)
      .json({ errore: `Servono esattamente ${DOMANDE_PER_PARTITA} risposte` });
  }

  // Ogni elemento deve avere question_id e answer_id, entrambi numeri interi validi
  const coppie = [];
  for (const [i, r] of answers.entries()) {
    const questionId = parseId(String(r.question_id));
    const answerId = parseId(String(r.answer_id));
    if (questionId === null || answerId === null) {
      return res.status(400).json({
        errore: `Risposta ${i + 1}: question_id e answer_id devono essere numeri interi`,
      });
    }
    coppie.push({ questionId, answerId });
  }

  // Le 10 domande devono essere tutte DIVERSE tra loro (niente domande ripetute nella stessa partita)
  const idDomandeUniche = new Set(coppie.map((c) => c.questionId));
  if (idDomandeUniche.size !== DOMANDE_PER_PARTITA) {
    return res
      .status(400)
      .json({ errore: "Le domande inviate contengono duplicati" });
  }

  try {
    // Un'unica query per verificare TUTTE le risposte insieme (WHERE id = ANY(...)),
    // invece di farne una per ognuna: molto più efficiente
    const answerIds = coppie.map((c) => c.answerId);
    const risposteReali = await gameRepositories.verifyAnswers(answerIds);

    // Trasformo l'array in una "mappa" (answer_id -> dati della risposta), per cercare velocemente
    const mappaRisposte = new Map(risposteReali.map((r) => [r.id, r]));

    let corrette = 0;
    const dettaglio = [];

    for (const { questionId, answerId } of coppie) {
      const rispostaReale = mappaRisposte.get(answerId);

      // CASO 1: l'answer_id inviato dal client non esiste proprio nel database
      if (!rispostaReale) {
        return res
          .status(400)
          .json({ errore: `La risposta con id ${answerId} non esiste` });
      }

      // CASO 2 (il più importante, protezione anti-imbroglio): l'answer_id ESISTE, ma appartiene
      // a una domanda DIVERSA da quella dichiarata dal client. Es. il client manda
      // { question_id: 5, answer_id: 99 }, ma la risposta 99 in realtà appartiene alla domanda 7:
      // qualcuno sta cercando di "indovinare" un id di risposta corretta preso da un'altra domanda.
      if (rispostaReale.question_id !== questionId) {
        return res.status(400).json({
          errore: `La risposta ${answerId} non appartiene alla domanda ${questionId}`,
        });
      }

      const isCorretta = rispostaReale.is_correct;
      if (isCorretta) corrette++;

      dettaglio.push({
        question_id: questionId,
        answer_id: answerId,
        correct: isCorretta,
      });
    }

    // Il punteggio si calcola SOLO qui, lato server, contando le risposte trovate corrette
    // nel database: il client non può in nessun modo dichiarare "ho fatto 10 su 10"
    const punteggio = await scoreRepositories.create({
      user_id: req.user.id, // req.user viene popolato da authMiddleware dopo aver verificato il token
      category_id: categoryId,
      score_obtained: corrette,
      max_score: DOMANDE_PER_PARTITA,
    });

    res.status(201).json({
      score_obtained: corrette,
      max_score: DOMANDE_PER_PARTITA,
      details: dettaglio,
      score: punteggio,
    });
  } catch (errore) {
    console.error("Errore in submitGame:", errore.message);
    res.status(500).json({ errore: "Errore interno del server" });
  }
}

module.exports = { startGame, submitGame };
