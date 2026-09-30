// Router per le rotte del gioco. ENTRAMBE protette: solo un utente autenticato può giocare.
const { Router } = require("express");
const gameController = require("../controllers/game.controller.js");
const authMiddleware = require("../middlewares/auth.middleware.js");

const router = Router();

// POST /game/start?category_id=X -> restituisce 10 domande casuali (senza risposta corretta)
router.post("/game/start", authMiddleware, gameController.startGame);

// POST /game/submit -> riceve tutte e 10 le risposte, calcola il punteggio, lo salva
router.post("/game/submit", authMiddleware, gameController.submitGame);

module.exports = router;
