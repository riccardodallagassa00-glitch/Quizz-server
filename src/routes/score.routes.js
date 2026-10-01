const { Router } = require("express");
const scoreController = require("../controllers/score.controller.js");
const authMiddleware = require("../middlewares/auth.middleware.js");

const router = Router();

// GET /scores/me -> storico delle partite dell'utente loggato (richiede autenticazione)
router.get("/scores/me", authMiddleware, scoreController.getMyScores);

module.exports = router;
