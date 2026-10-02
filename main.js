//swagger documentation
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./src/config/swagger.js");
// Importo Express, la libreria che uso per creare il server
const express = require("express");

// Importo il router con tutte le rotte relative agli utenti
const usersRoutes = require("./src/routes/users.routes.js");
const quizRoutes = require("./src/routes/quiz.routes.js");
const questionRoutes = require("./src/routes/question.routes.js");
const authRoutes = require("./src/routes/auth.routes.js");
const categoryRoutes = require("./src/routes/category.routes.js");
const gameRoutes = require("./src/routes/game.routes.js");
const scoreRoutes = require("./src/routes/score.routes.js");

const dotenv = require("dotenv");
dotenv.config();

// Importo la connessione al database configurata in src/config/db.js
const pool = require("./src/config/db.js");
const notFound = require("./src/middlewares/notFound.js");
const errorHandler = require("./src/middlewares/errorHandler.js");

// Costruisce e restituisce l'app Express, SENZA accenderla. Separata da "start()" apposta:
// i test (Supertest) possono così importare questa funzione e simulare richieste HTTP
// senza dover avviare un vero server su una porta.
function createApp() {
  const app = express();

  app.use(express.json());

  app.get("/", (req, res) => {
    res.json({ messaggio: "Server attivo. Prova /api/users o /api/quizz" });
  });

  app.use("/api", usersRoutes);
  app.use("/api", quizRoutes);
  app.use("/api", questionRoutes);
  app.use("/api", authRoutes);
  app.use("/api", categoryRoutes);
  app.use("/api", gameRoutes);
  app.use("/api", scoreRoutes);
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
  app.use(notFound);
  app.use(errorHandler);

  return app;
}

// Accende davvero il server: testa il database, poi mette l'app in ascolto sulla porta
async function start() {
  const app = createApp();
  const PORT = process.env.PORT || 3000;

  try {
    await pool.query("SELECT 1");
    console.log("Connessione al database riuscita.");
  } catch (errore) {
    console.error("Impossibile connettersi al database:", errore.message);
  }

  app.listen(PORT, () => {
    console.log(`Server in ascolto su http://localhost:${PORT}`);
  });
}

// Accendo il server SOLO se questo file viene eseguito direttamente (node main.js / npm start).
// Se invece viene importato da un altro file (es. un test con require("../main.js")),
// non parte nulla automaticamente: chi importa riceve solo createApp e decide lui cosa farne.
if (require.main === module) {
  start();
}

module.exports = createApp;
