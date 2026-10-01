const gameRepositories = require("../repositories/gameRepositories.js");
const answerRepositories = require("../repositories/answerRepositories.js");
const scoreRepositories = require("../repositories/scoreRepositories.js");
const parseId = require("../utils/parseId.js");
const AppError = require("../utils/AppError.js");

const DOMANDE_PER_PARTITA = 10;

async function startGame(req, res, next) {
  try {
    const categoryId = parseId(req.query.category_id);
    if (categoryId === null) {
      throw new AppError(
        400,
        "category_id è obbligatorio e deve essere un numero intero",
      );
    }

    const domande = await gameRepositories.getRandomQuestions(
      categoryId,
      DOMANDE_PER_PARTITA,
    );

    if (domande.length < DOMANDE_PER_PARTITA) {
      throw new AppError(
        400,
        `Questa categoria non ha abbastanza domande per giocare (servono almeno ${DOMANDE_PER_PARTITA}, disponibili: ${domande.length})`,
      );
    }

    for (const domanda of domande) {
      domanda.answers = await answerRepositories.getByQuestionId(domanda.id);
    }

    res.json({ category_id: categoryId, questions: domande });
  } catch (errore) {
    next(errore);
  }
}

async function submitGame(req, res, next) {
  try {
    const { category_id, answers } = req.body;

    const categoryId = parseId(String(category_id));
    if (categoryId === null) {
      throw new AppError(
        400,
        "category_id è obbligatorio e deve essere un numero intero",
      );
    }

    if (!Array.isArray(answers) || answers.length !== DOMANDE_PER_PARTITA) {
      throw new AppError(
        400,
        `Servono esattamente ${DOMANDE_PER_PARTITA} risposte`,
      );
    }

    const coppie = [];
    for (const [i, r] of answers.entries()) {
      const questionId = parseId(String(r.question_id));
      const answerId = parseId(String(r.answer_id));
      if (questionId === null || answerId === null) {
        throw new AppError(
          400,
          `Risposta ${i + 1}: question_id e answer_id devono essere numeri interi`,
        );
      }
      coppie.push({ questionId, answerId });
    }

    const idDomandeUniche = new Set(coppie.map((c) => c.questionId));
    if (idDomandeUniche.size !== DOMANDE_PER_PARTITA) {
      throw new AppError(400, "Le domande inviate contengono duplicati");
    }

    const answerIds = coppie.map((c) => c.answerId);
    const risposteReali = await gameRepositories.verifyAnswers(answerIds);
    const mappaRisposte = new Map(risposteReali.map((r) => [r.id, r]));

    let corrette = 0;
    const dettaglio = [];

    for (const { questionId, answerId } of coppie) {
      const rispostaReale = mappaRisposte.get(answerId);

      if (!rispostaReale) {
        throw new AppError(400, `La risposta con id ${answerId} non esiste`);
      }
      if (rispostaReale.question_id !== questionId) {
        throw new AppError(
          400,
          `La risposta ${answerId} non appartiene alla domanda ${questionId}`,
        );
      }

      const isCorretta = rispostaReale.is_correct;
      if (isCorretta) corrette++;
      dettaglio.push({
        question_id: questionId,
        answer_id: answerId,
        correct: isCorretta,
      });
    }

    const punteggio = await scoreRepositories.create({
      user_id: req.user.id,
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
    next(errore);
  }
}

module.exports = { startGame, submitGame };
