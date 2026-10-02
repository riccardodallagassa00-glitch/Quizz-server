const { Router } = require("express");
const usersController = require("../controllers/users.controller.js");

const router = Router();

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Lista degli utenti, filtrabile per nome e limitabile in numero
 *     tags: [Utenti]
 *     parameters:
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Filtra gli utenti il cui username contiene questo testo
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Numero massimo di risultati
 *     responses:
 *       200:
 *         description: Elenco utenti
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Utente'
 */
router.get("/users", usersController.getUsers);

/**
 * @swagger
 * /api/user/{id}:
 *   get:
 *     summary: Recupera un singolo utente per id
 *     tags: [Utenti]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Utente trovato
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Utente'
 *       400:
 *         description: Id non valido (non è un numero intero positivo)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErroreGenerico'
 *       404:
 *         description: Utente non trovato
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErroreGenerico'
 */
router.get("/user/:id", usersController.getUser);

/**
 * @swagger
 * /api/user:
 *   post:
 *     summary: Crea un nuovo utente
 *     tags: [Utenti]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, email, password]
 *             properties:
 *               username:
 *                 type: string
 *                 example: luca
 *               email:
 *                 type: string
 *                 example: luca@example.com
 *               password:
 *                 type: string
 *                 example: password123
 *     responses:
 *       201:
 *         description: Utente creato
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Utente'
 *       400:
 *         description: Dati non validi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErroreGenerico'
 *       409:
 *         description: Username o email già registrati
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErroreGenerico'
 */
router.post("/user", usersController.createUser);

/**
 * @swagger
 * /api/user/{id}:
 *   put:
 *     summary: Aggiorna un utente esistente (campi parziali ammessi)
 *     tags: [Utenti]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Utente aggiornato
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Utente'
 *       404:
 *         description: Utente non trovato
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErroreGenerico'
 *       409:
 *         description: Username o email già in uso da un altro utente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErroreGenerico'
 */
router.put("/user/:id", usersController.updateUser);

/**
 * @swagger
 * /api/user/{id}:
 *   delete:
 *     summary: Elimina un utente
 *     tags: [Utenti]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Utente eliminato
 *       404:
 *         description: Utente non trovato
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErroreGenerico'
 */
router.delete("/user/:id", usersController.deleteUser);

module.exports = router;
