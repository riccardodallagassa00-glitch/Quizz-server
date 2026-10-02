const { Router } = require("express");
const quizController = require("../controllers/quiz.controller.js");

const router = Router();

/**
 * @swagger
 * /api/quizzes:
 *   get:
 *     summary: Lista dei quiz, filtrabile per categoria
 *     tags: [Quiz]
 *     parameters:
 *       - in: query
 *         name: category_id
 *         schema:
 *           type: integer
 *         description: Se presente, restituisce solo i quiz di questa categoria
 *     responses:
 *       200:
 *         description: Elenco quiz
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   title:
 *                     type: string
 *                   category_id:
 *                     type: integer
 */
router.get("/quizzes", quizController.getQuizzes);

/**
 * @swagger
 * /api/quizzes/{id}:
 *   get:
 *     summary: Dettaglio di un quiz, con domande e opzioni di risposta (SENZA rivelare quale è corretta)
 *     tags: [Quiz]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Quiz trovato, completo di domande e risposte (senza is_correct)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 title:
 *                   type: string
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
 *       404:
 *         description: Quiz non trovato
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErroreGenerico'
 */
router.get("/quizzes/:id", quizController.getQuiz);

/**
 * @swagger
 * /api/quizzes:
 *   post:
 *     summary: Crea un quiz. Senza "questions" crea solo il quiz; con "questions" crea quiz, domande e risposte insieme (transazione)
 *     tags: [Quiz]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, category_id]
 *             properties:
 *               title:
 *                 type: string
 *                 example: Quiz di prova
 *               category_id:
 *                 type: integer
 *                 example: 1
 *               questions:
 *                 type: array
 *                 description: Opzionale. Se presente, ogni domanda richiede almeno 2 opzioni ed ESATTAMENTE una corretta
 *                 items:
 *                   type: object
 *                   properties:
 *                     text:
 *                       type: string
 *                       example: Quanto fa 2+2?
 *                     answers:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           text:
 *                             type: string
 *                             example: "4"
 *                           is_correct:
 *                             type: boolean
 *                             example: true
 *     responses:
 *       201:
 *         description: Quiz creato (con o senza domande, a seconda del body)
 *       400:
 *         description: Dati non validi (titolo mancante, categoria mancante, domande non valide, categoria inesistente)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErroreGenerico'
 */
router.post("/quizzes", quizController.createQuiz);

/**
 * @swagger
 * /api/quizzes/{id}/questions:
 *   post:
 *     summary: Aggiunge una domanda (con le sue risposte) a un quiz esistente
 *     tags: [Quiz]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Id del quiz a cui aggiungere la domanda
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [text, answers]
 *             properties:
 *               text:
 *                 type: string
 *                 example: Qual è la capitale della Francia?
 *               answers:
 *                 type: array
 *                 description: Almeno 2 opzioni, ESATTAMENTE una con is_correct true
 *                 items:
 *                   type: object
 *                   properties:
 *                     text:
 *                       type: string
 *                       example: Parigi
 *                     is_correct:
 *                       type: boolean
 *                       example: true
 *     responses:
 *       201:
 *         description: Domanda creata, con le risposte annidate
 *       400:
 *         description: Dati non validi (meno di 2 opzioni, nessuna o più di una risposta corretta)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErroreGenerico'
 *       404:
 *         description: Quiz non trovato
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErroreGenerico'
 */
router.post("/quizzes/:id/questions", quizController.addQuestion);

module.exports = router;
