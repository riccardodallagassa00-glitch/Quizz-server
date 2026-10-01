const answerRepositories = require("../repositories/answerRepositories.js");
const parseId = require("../utils/parseId.js");
const AppError = require("../utils/AppError.js");

async function addAnswers(req, res, next) {
  try {
    const questionId = parseId(req.params.id);
    if (questionId === null) {
      throw new AppError(
        400,
        "ID domanda non valido: deve essere un numero intero positivo",
      );
    }

    const { answers } = req.body;
    if (!Array.isArray(answers) || answers.length === 0) {
      throw new AppError(400, "Serve un array 'answers' con almeno un'opzione");
    }
    for (const [i, a] of answers.entries()) {
      if (!a.text || typeof a.text !== "string" || !a.text.trim()) {
        throw new AppError(400, `Opzione ${i + 1}: il testo è obbligatorio`);
      }
      if (typeof a.is_correct !== "boolean") {
        throw new AppError(
          400,
          `Opzione ${i + 1}: is_correct deve essere true o false`,
        );
      }
    }

    const correttiEsistenti = await answerRepositories.countCorrect(questionId);
    const correttiNuovi = answers.filter((a) => a.is_correct).length;

    if (correttiEsistenti + correttiNuovi !== 1) {
      throw new AppError(
        400,
        `La domanda deve avere esattamente una risposta corretta (dopo questa aggiunta ne avrebbe ${correttiEsistenti + correttiNuovi})`,
      );
    }

    const inserite = await answerRepositories.addMany(questionId, answers);
    res.status(201).json(inserite);
  } catch (errore) {
    next(errore);
  }
}

module.exports = { addAnswers };
