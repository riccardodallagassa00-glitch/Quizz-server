const { Router } = require("express");
const questionController = require("../controllers/question.controller.js");

const router = Router();

/**
 * @swagger
 * /api/questions/{id}/answers:
 *   post:
 *     summary: Aggiunge una o più opzioni di risposta a una domanda esistente
 *     tags: [Domande]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Id della domanda
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [answers]
 *             properties:
 *               answers:
 *                 type: array
 *                 description: Dopo l'inserimento, la domanda deve avere ESATTAMENTE una risposta corretta in totale
 *                 items:
 *                   type: object
 *                   properties:
 *                     text:
 *                       type: string
 *                       example: Forse
 *                     is_correct:
 *                       type: boolean
 *                       example: false
 *     responses:
 *       201:
 *         description: Opzioni di risposta create
 *       400:
 *         description: Dati non validi, o il totale di risposte corrette per la domanda non sarebbe esattamente 1
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErroreGenerico'
 */
router.post("/questions/:id/answers", questionController.addAnswers);

module.exports = router;
