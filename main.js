const express = require("express");
const quizzController = require("./src/quizz-controller.js");

function main() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  // Middleware per leggere il body JSON delle richieste POST
  app.use(express.json());

  // Rotta di test
  app.get("/", (req, res) => {
    res.json({ messaggio: "Server attivo. Prova /api/quizzes" });
  });

  // Monta tutte le rotte del controller sotto /api
  app.use("/api", quizzController);

  // Gestione rotte non trovate
  app.use((req, res) => {
    res.status(404).json({ errore: "Rotta non trovata" });
  });

  app.listen(PORT, () => {
    console.log(`Server in ascolto su http://localhost:${PORT}`);
  });
}

main();
