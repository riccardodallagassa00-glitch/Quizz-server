// Importo Express, la libreria che uso per creare il server
const express = require("express");

// Importo il router con tutte le rotte relative agli utenti
const usersRoutes = require("./src/routes/users.routes.js");

// Importo il router con tutte le rotte relative ai quiz
const quizzRoutes = require("./src/routes/quizz.routes.js");

// Racchiudo tutta la logica di avvio dentro una funzione chiamata "main"
function main() {
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
  app.use("/api", quizzRoutes);

  // Middleware "catch-all": gestisce ogni richiesta che non ha trovato nessuna rotta corrispondente sopra
  app.use((req, res) => {
    res.status(404).json({ errore: "Rotta non trovata" });
  });

  // Accendo il server: da qui resta "in ascolto" di richieste finché non lo fermo
  app.listen(PORT, () => {
    console.log(`Server in ascolto su http://localhost:${PORT}`);
  });
}

// Chiamo la funzione per far partire davvero tutto quanto definito sopra
main();
