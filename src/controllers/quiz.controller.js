const quizRepositories = require("../repositories/quizRepositories.js");
const questionRepositories = require("../repositories/questionRepositories.js");
const answerRepositories = require("../repositories/answerRepositories.js");
const parseId = require("../utils/parseId.js");
const AppError = require("../utils/AppError.js");

async function getQuizzes(req, res, next) {
  try {
    const { category_id } = req.query;
    let categoryId = null;
    if (category_id !== undefined) {
      categoryId = parseId(category_id);
      if (categoryId === null) {
        throw new AppError(
          400,
          "category_id deve essere un numero intero positivo",
        );
      }
    }
    const quizzes = await quizRepositories.getAll(categoryId);
    res.json(quizzes);
  } catch (errore) {
    next(errore);
  }
}

async function getQuiz(req, res, next) {
  try {
    const id = parseId(req.params.id);
    if (id === null) {
      throw new AppError(
        400,
        "ID non valido: deve essere un numero intero positivo",
      );
    }
    const quiz = await quizRepositories.getFullById(id);
    if (!quiz) {
      throw new AppError(404, "Quiz non trovato");
    }
    res.json(quiz);
  } catch (errore) {
    next(errore);
  }
}

function validaDomande(questions) {
  if (!Array.isArray(questions) || questions.length === 0) {
    return "Servono una o più domande, ognuna con le sue opzioni di risposta";
  }
  for (const [i, q] of questions.entries()) {
    if (!q.text || typeof q.text !== "string" || !q.text.trim()) {
      return `Domanda ${i + 1}: il testo è obbligatorio`;
    }
    if (!Array.isArray(q.answers) || q.answers.length < 2) {
      return `Domanda ${i + 1}: servono almeno 2 opzioni di risposta`;
    }
    const corrette = q.answers.filter((a) => a.is_correct === true).length;
    if (corrette !== 1) {
      return `Domanda ${i + 1}: deve esserci ESATTAMENTE una risposta corretta (trovate: ${corrette})`;
    }
    for (const [j, a] of q.answers.entries()) {
      if (!a.text || typeof a.text !== "string" || !a.text.trim()) {
        return `Domanda ${i + 1}, opzione ${j + 1}: il testo è obbligatorio`;
      }
    }
  }
  return null;
}

async function createQuiz(req, res, next) {
  try {
    const { title, category_id, questions } = req.body;

    if (!title || typeof title !== "string" || !title.trim()) {
      throw new AppError(400, "Il titolo del quiz è obbligatorio");
    }
    const categoryId = parseId(String(category_id));
    if (categoryId === null) {
      throw new AppError(
        400,
        "category_id è obbligatorio e deve essere un numero intero",
      );
    }

    if (questions !== undefined) {
      const erroreValidazione = validaDomande(questions);
      if (erroreValidazione) {
        throw new AppError(400, erroreValidazione);
      }
      const quiz = await quizRepositories.createFull({
        title: title.trim(),
        category_id: categoryId,
        questions,
      });
      return res.status(201).json(quiz);
    }

    const quiz = await quizRepositories.create({
      title: title.trim(),
      category_id: categoryId,
    });
    res.status(201).json(quiz);
  } catch (errore) {
    next(errore);
  }
}

async function addQuestion(req, res, next) {
  try {
    const quizId = parseId(req.params.id);
    if (quizId === null) {
      throw new AppError(
        400,
        "ID quiz non valido: deve essere un numero intero positivo",
      );
    }

    const erroreValidazione = validaDomande([req.body]);
    if (erroreValidazione) {
      throw new AppError(
        400,
        erroreValidazione.replace("Domanda 1", "La domanda"),
      );
    }

    const quiz = await quizRepositories.getById(quizId);
    if (!quiz) {
      throw new AppError(404, "Quiz non trovato");
    }

    const domanda = await questionRepositories.create({
      quiz_id: quizId,
      text: req.body.text.trim(),
    });
    const risposte = await answerRepositories.addMany(
      domanda.id,
      req.body.answers,
    );

    res.status(201).json({ ...domanda, answers: risposte });
  } catch (errore) {
    next(errore);
  }
}

module.exports = { getQuizzes, getQuiz, createQuiz, addQuestion };
