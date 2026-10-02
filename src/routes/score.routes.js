const { Router } = require("express");
const scoreController = require("../controllers/score.controller.js");
const authMiddleware = require("../middlewares/auth.middleware.js");

const router = Router();
/**
 * @swagger
 * /api/scores/me:
 *   get:
 *     summary: Storico delle partite dell'utente autenticato, dalla più recente
 *     tags: [Punteggi]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Elenco dei punteggi dell'utente (array vuoto se non ha ancora giocato)
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   category_id:
 *                     type: integer
 *                   category_name:
 *                     type: string
 *                   score_obtained:
 *                     type: integer
 *                   max_score:
 *                     type: integer
 *                   completed_at:
 *                     type: string
 *                     format: date-time
 *       401:
 *         description: Token mancante, non valido o scaduto
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErroreGenerico'
 */
router.get("/scores/me", authMiddleware, scoreController.getMyScores);

/**
 * @swagger
 * /api/scores/leaderboard:
 *   get:
 *     summary: Classifica, pubblica. Con category_id - miglior punteggio per utente in quella categoria. Senza - totale su tutte le categorie
 *     tags: [Punteggi]
 *     parameters:
 *       - in: query
 *         name: category_id
 *         required: false
 *         schema:
 *           type: integer
 *         description: Se omesso, restituisce la classifica generale (somma dei punteggi per utente)
 *     responses:
 *       200:
 *         description: Classifica ordinata per punteggio decrescente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   username:
 *                     type: string
 *                   best_score:
 *                     type: integer
 *                     description: Presente solo se è stata passata category_id
 *                   total_score:
 *                     type: integer
 *                     description: Presente solo se NON è stata passata category_id
 *       400:
 *         description: category_id non valido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErroreGenerico'
 */
router.get("/scores/leaderboard", scoreController.getLeaderboard);

module.exports = router;
