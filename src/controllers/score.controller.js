// Logica delle rotte /api/scores. Le query sono in src/repositories/scoreRepositories.js.
const scoreRepositories = require("../repositories/scoreRepositories.js");

// GET /api/scores/me (PROTETTA: serve un token valido)
// Restituisce lo storico delle partite dell'utente che ha fatto la richiesta, dalla più recente.
async function getMyScores(req, res) {
  try {
    // req.user viene popolato da authMiddleware, dopo aver verificato il token:
    // req.user.id è l'id dell'utente autenticato, MAI inviato dal client nella richiesta stessa
    // (così nessuno può "chiedere" lo storico di un altro utente solo cambiando un parametro)
    const storico = await scoreRepositories.getByUserId(req.user.id);
    res.json(storico);
  } catch (errore) {
    console.error("Errore in getMyScores:", errore.message);
    res.status(500).json({ errore: "Errore interno del server" });
  }
}

module.exports = { getMyScores };
