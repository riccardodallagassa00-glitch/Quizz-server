const { Router } = require("express");
const gameController = require("../controllers/game.controller.js");
const authMiddleware = require("../middlewares/auth.middleware.js");

const router = Router();

/**
 * @swagger
 * /api/game/start:
 *   post:
 *     summary: Avvia una partita, restituendo 10 domande casuali di una categoria (senza rivelare le risposte corrette)
 *     tags: [Gioco]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category_id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 10 domande casuali, ognuna con le sue opzioni di risposta (senza is_correct)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 category_id:
 *                   type: integer
 *                 questions:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       text:
 *                         type: string
 *                       answers:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: integer
 *                             text:
 *                               type: string
 *       400:
 *         description: category_id mancante/non valido, oppure la categoria non ha almeno 10 domande disponibili
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErroreGenerico'
 *       401:
 *         description: Token mancante, non valido o scaduto
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErroreGenerico'
 */
router.post("/game/start", authMiddleware, gameController.startGame);

/**
 * @swagger
 * /api/game/submit:
 *   post:
 *     summary: Invia le 10 risposte di una partita, calcola il punteggio lato server e lo salva
 *     tags: [Gioco]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [category_id, answers]
 *             properties:
 *               category_id:
 *                 type: integer
 *                 example: 1
 *               answers:
 *                 type: array
 *                 description: Esattamente 10 coppie question_id/answer_id, una per ogni domanda ricevuta da /api/game/start
 *                 items:
 *                   type: object
 *                   properties:
 *                     question_id:
 *                       type: integer
 *                     answer_id:
 *                       type: integer
 *     responses:
 *       201:
 *         description: Punteggio calcolato e salvato
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 score_obtained:
 *                   type: integer
 *                   example: 7
 *                 max_score:
 *                   type: integer
 *                   example: 10
 *                 details:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       question_id:
 *                         type: integer
 *                       answer_id:
 *                         type: integer
 *                       correct:
 *                         type: boolean
 *       400:
 *         description: Numero di risposte diverso da 10, domande duplicate, o una risposta non appartiene alla domanda dichiarata (tentativo di manomissione)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErroreGenerico'
 *       401:
 *         description: Token mancante, non valido o scaduto
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErroreGenerico'
 */
router.post("/game/submit", authMiddleware, gameController.submitGame);

module.exports = router;
