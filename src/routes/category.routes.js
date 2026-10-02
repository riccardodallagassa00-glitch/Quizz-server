const { Router } = require("express");
const categoryController = require("../controllers/category.controller.js");

const router = Router();

/**
 * @swagger
 * /api/categories:
 *   get:
 *     summary: Lista di tutte le categorie
 *     tags: [Categorie]
 *     responses:
 *       200:
 *         description: Elenco categorie
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Categoria'
 */
router.get("/categories", categoryController.getCategories);

/**
 * @swagger
 * /api/categories/{id}:
 *   get:
 *     summary: Recupera una categoria per id
 *     tags: [Categorie]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Categoria trovata
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Categoria'
 *       404:
 *         description: Categoria non trovata
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErroreGenerico'
 */
router.get("/categories/:id", categoryController.getCategory);

/**
 * @swagger
 * /api/categories:
 *   post:
 *     summary: Crea una nuova categoria
 *     tags: [Categorie]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Storia
 *     responses:
 *       201:
 *         description: Categoria creata
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Categoria'
 *       400:
 *         description: Nome mancante o vuoto
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErroreGenerico'
 *       409:
 *         description: Esiste già una categoria con questo nome
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErroreGenerico'
 */
router.post("/categories", categoryController.createCategory);

/**
 * @swagger
 * /api/categories/{id}:
 *   put:
 *     summary: Rinomina una categoria esistente
 *     tags: [Categorie]
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
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Storia antica
 *     responses:
 *       200:
 *         description: Categoria aggiornata
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Categoria'
 *       404:
 *         description: Categoria non trovata
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErroreGenerico'
 *       409:
 *         description: Esiste già una categoria con questo nome
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErroreGenerico'
 */
router.put("/categories/:id", categoryController.updateCategory);

/**
 * @swagger
 * /api/categories/{id}:
 *   delete:
 *     summary: Elimina una categoria (a cascata spariscono anche i suoi quiz)
 *     tags: [Categorie]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Categoria eliminata
 *       404:
 *         description: Categoria non trovata
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErroreGenerico'
 */
router.delete("/categories/:id", categoryController.deleteCategory);

module.exports = router;
