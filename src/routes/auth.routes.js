const { Router } = require("express");
const authController = require("../controllers/auth.controller.js");
const rateLimiter = require("../middlewares/rateLimiter.js");

const router = Router();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Registra un nuovo utente
 *     tags: [Autenticazione]
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
 *                 example: mario
 *               email:
 *                 type: string
 *                 example: mario@example.com
 *               password:
 *                 type: string
 *                 description: Almeno 8 caratteri
 *                 example: password123
 *     responses:
 *       201:
 *         description: Utente creato (la password non viene mai restituita)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Utente'
 *       400:
 *         description: Dati non validi (campi mancanti, email non valida, password troppo corta)
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
router.post("/auth/register", authController.register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Autentica un utente e restituisce un token JWT
 *     tags: [Autenticazione]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [identifier, password]
 *             properties:
 *               identifier:
 *                 type: string
 *                 description: Username oppure email dell'utente
 *                 example: mario
 *               password:
 *                 type: string
 *                 example: password123
 *     responses:
 *       200:
 *         description: Login riuscito
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: Token JWT da usare nelle rotte protette
 *                 user:
 *                   $ref: '#/components/schemas/Utente'
 *       401:
 *         description: Credenziali non valide (stesso messaggio sia per utente inesistente sia per password sbagliata)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErroreGenerico'
 *       429:
 *         description: Troppi tentativi di login (rate limit superato, massimo 5 ogni 15 minuti)
 */
router.post(
  "/auth/login",
  rateLimiter(5, 15 * 60 * 1000),
  authController.login,
);

module.exports = router;
