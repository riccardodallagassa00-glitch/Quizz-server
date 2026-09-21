const { Router } = require("express");

const router = Router();

// "Database" in memoria, solo per iniziare. Da sostituire con un DB vero in seguito.
let quizzes = [
  {
    id: 1,
    domanda: "Qual è la capitale d'Italia?",
    risposte: ["Milano", "Roma", "Napoli", "Torino"],
    rispostaCorretta: 1,
  },
];

let prossimoId = 2;

// GET /api/quizzes -> restituisce tutti i quiz
router.get("/quizzes", (req, res) => {
  res.json(quizzes);
});

// GET /api/quizzes/:id -> restituisce un singolo quiz
router.get("/quizzes/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);
  const quiz = quizzes.find((q) => q.id === id);

  if (!quiz) {
    return res.status(404).json({ errore: "Quiz non trovato" });
  }

  res.json(quiz);
});

// POST /api/quizzes -> crea un nuovo quiz
router.post("/quizzes", (req, res) => {
  const { domanda, risposte, rispostaCorretta } = req.body;

  if (!domanda || !Array.isArray(risposte) || rispostaCorretta === undefined) {
    return res.status(400).json({
      errore:
        "Dati non validi. Servono: domanda (string), risposte (array), rispostaCorretta (number)",
    });
  }

  const nuovoQuiz = {
    id: prossimoId++,
    domanda,
    risposte,
    rispostaCorretta,
  };

  quizzes.push(nuovoQuiz);
  res.status(201).json(nuovoQuiz);
});

module.exports = router;
