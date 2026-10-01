// Importo Express, la libreria che uso per creare il server
const express = require("express");

// Importo il router con tutte le rotte relative agli utenti
const usersRoutes = require("./src/routes/users.routes.js");

// Importo il router con tutte le rotte relative ai quiz
const quizRoutes = require("./src/routes/quiz.routes.js");
const questionRoutes = require("./src/routes/question.routes.js");
const authRoutes = require("./src/routes/auth.routes.js");
const categoryRoutes = require("./src/routes/category.routes.js");
const gameRoutes = require("./src/routes/game.routes.js");
const scoreRoutes = require("./src/routes/score.routes.js");

const dotenv = require("dotenv");
const result = dotenv.config();

// Importo la connessione al database configurata in src/config/db.js
const pool = require("./src/config/db.js");
const notFound = require("./src/middlewares/notFound.js");
const errorHandler = require("./src/middlewares/errorHandler.js");

// Racchiudo tutta la logica di avvio dentro una funzione chiamata "main"
// Diventa "async" perché al suo interno useremo "await" per aspettare la connessione al database
async function main() {
  // Creo l'applicazione Express: da qui in poi "app" rappresenta il mio server
  const app = express();

  // Definisco su quale porta il server ascolterà (3000 se non specificato diversamente)
  const PORT = process.env.PORT || 3000;

  // Middleware: dice al server di capire automaticamente i dati JSON inviati nel corpo delle richieste
  // (serve per leggere req.body nelle richieste POST e PUT)
  app.use(express.json());

  // Rotta di test sulla home page, solo per verificare che il server sia acceso
  app.get("/", (req, res) => {
    res.json({ messaggio: "Server attivo. Prova /api/users o /api/quizz" });
  });

  // Collego (monto) le rotte degli utenti: tutte inizieranno con /api (es. /api/users)
  app.use("/api", usersRoutes);

  // Collego (monto) le rotte dei quiz: tutte inizieranno con /api (es. /api/quizz)
  app.use("/api", quizRoutes);
  // Collego (monto) le rotte delle domande: tutte inizieranno con /api (es. /api/questions)
  app.use("/api", questionRoutes);

  // Collego (monto) le rotte di autenticazione: tutte inizieranno con /api (es. /api/auth/register)
  app.use("/api", authRoutes);
  // Collego (monto) le rotte delle categorie: tutte inizieranno con /api (es. /api/category)
  app.use("/api", categoryRoutes);
  // Collego (monto) le rotte dei giochi: tutte inizieranno con /api (es. /api/games)
  app.use("/api", gameRoutes);
  // Collego (monto) le rotte dei punteggi: tutte inizieranno con /api (es. /api/scores)
  app.use("/api", scoreRoutes);

  // Middleware "catch-all": gestisce ogni richiesta che non ha trovato nessuna rotta corrispondente sopra
  app.use(notFound);

  // Middleware centralizzato di gestione errori: DEVE stare per ultimo, dopo ogni altro app.use
  app.use(errorHandler);

  try {
    // Provo una query banalissima per verificare che il database risponda
    await pool.query("SELECT 1");
    console.log("Connessione al database riuscita.");
  } catch (errore) {
    // Se la connessione fallisce (es. DATABASE_URL sbagliata), lo stampo chiaramente
    // ma NON fermo il server: per ora le rotte users/quizz funzionano comunque senza database
    console.error("Impossibile connettersi al database:", errore.message);
  }

  // Accendo il server: da qui resta "in ascolto" di richieste finché non lo fermo
  app.listen(PORT, () => {
    console.log(`Server in ascolto su http://localhost:${PORT}`);
  });
}

// Chiamo la funzione per far partire davvero tutto quanto definito sopra
main();
