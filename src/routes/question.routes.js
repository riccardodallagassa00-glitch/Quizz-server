// Router dedicato alle rotte che riguardano direttamente le domande (question)
const { Router } = require("express");

const questionController = require("../controllers/question.controller.js");

const router = Router();

// POST /questions/:id/answers -> aggiunge una o più opzioni di risposta a una domanda esistente
router.post("/questions/:id/answers", questionController.addAnswers);

module.exports = router;
