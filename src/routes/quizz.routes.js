// Router = strumento di Express per raggruppare le rotte collegate (qui: quelle dei quiz)
const { Router } = require("express");

// Importo le funzioni scritte nel controller: contengono la logica vera e propria
const quizzController = require("../controllers/quizz.controller.js");

// Creo un nuovo router, dedicato solo alle rotte "quizz"
const router = Router();

// Quando arriva una richiesta GET all'indirizzo /quizz, esegui la funzione getQuizzes del controller
router.get("/quizz", quizzController.getQuizz);

// Quando arriva una richiesta POST all'indirizzo /quizz, esegui la funzione createQuiz
router.post("/quizz", quizzController.createQuizz);

// Esporto il router così main.js può "montarlo" e attivare queste rotte
module.exports = router;
