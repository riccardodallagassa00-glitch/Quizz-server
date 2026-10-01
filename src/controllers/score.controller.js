// Logica delle rotte /api/scores. Le query sono in src/repositories/scoreRepositories.js.
const scoreRepositories = require("../repositories/scoreRepositories.js");
const parseId = require("../utils/parseId.js");
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
// GET /api/scores/leaderboard?category_id=X (PUBBLICA: non richiede login)
// Con category_id -> classifica di quella categoria (miglior punteggio per utente)
// Senza category_id -> classifica generale (somma dei punteggi di ogni utente su tutto)
async function getLeaderboard(req, res) {
  const { category_id } = req.query;

  try {
    if (category_id !== undefined) {
      const categoryId = parseId(category_id);
      if (categoryId === null) {
        return res.status(400).json({
          errore: "category_id deve essere un numero intero positivo",
        });
      }
      const classifica =
        await scoreRepositories.getLeaderboardByCategory(categoryId);
      return res.json(classifica);
    }

    const classifica = await scoreRepositories.getOverallLeaderboard();
    res.json(classifica);
  } catch (errore) {
    console.error("Errore in getLeaderboard:", errore.message);
    res.status(500).json({ errore: "Errore interno del server" });
  }
}

module.exports = { getMyScores, getLeaderboard };
