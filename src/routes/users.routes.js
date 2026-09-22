// Router = uno strumento di Express per raggruppare un insieme di rotte collegate tra loro (qui: quelle degli utenti)
const { Router } = require("express");

// Importo le funzioni scritte nel controller: contengono la logica vera e propria
const usersController = require("../controllers/users.controller.js");

// Creo un nuovo router, dedicato solo alle rotte "users"
const router = Router();

// Quando arriva una richiesta GET all'indirizzo /users, esegui la funzione getUsers del controller
router.get("/users", usersController.getUsers);

// Quando arriva una richiesta POST all'indirizzo /user, esegui la funzione createUser
router.post("/user", usersController.createUser);

// Quando arriva una richiesta PUT all'indirizzo /user/qualcosa (es. /user/3), esegui updateUser
// ":id" è un segnaposto: il valore reale al suo posto finisce dentro req.params.id nel controller
router.put("/user/:id", usersController.updateUser);

// Quando arriva una richiesta DELETE all'indirizzo /user/qualcosa, esegui deleteUser
router.delete("/user/:id", usersController.deleteUser);

// Esporto il router così main.js può "montarlo" e attivare queste rotte
module.exports = router;
