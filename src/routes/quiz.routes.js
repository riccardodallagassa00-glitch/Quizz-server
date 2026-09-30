// Router = strumento di Express per raggruppare le rotte collegate (qui: quelle dei quiz)
const { Router } = require("express");

// Importo le funzioni scritte nel controller: contengono la logica vera e propria
const quizController = require("../controllers/quiz.controller.js");

// Creo un nuovo router, dedicato solo alle rotte "quizzes"
const router = Router();

// GET /quizzes -> lista dei quiz, filtrabile con ?category_id=...
router.get("/quizzes", quizController.getQuizzes);

// GET /quizzes/:id -> dettaglio di un singolo quiz, con domande e risposte (senza is_correct)
router.get("/quizzes/:id", quizController.getQuiz);

// POST /quizzes -> crea un quiz (solo o completo di domande/risposte, a seconda del body)
router.post("/quizzes", quizController.createQuiz);

// POST /quizzes/:id/questions -> aggiunge una domanda (con le sue risposte) a un quiz esistente
router.post("/quizzes/:id/questions", quizController.addQuestion);

// Esporto il router così main.js può "montarlo" e attivare queste rotte
module.exports = router;
