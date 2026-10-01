// Middleware "catch-all": gestisce ogni richiesta che non corrisponde a NESSUNA rotta definita.
// Va montato DOPO tutte le rotte vere, e PRIMA di errorHandler.
function notFound(req, res) {
  res.status(404).json({ success: false, message: "Rotta non trovata" });
}

module.exports = notFound;
