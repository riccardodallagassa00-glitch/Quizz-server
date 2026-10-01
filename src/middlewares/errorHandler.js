// Middleware di gestione errori CENTRALIZZATO.
// Express lo riconosce come "middleware di errore" perché ha ESATTAMENTE 4 parametri
// (err, req, res, next), anche se "next" qui non viene mai usato: la firma a 4 argomenti
// è obbligatoria, altrimenti Express lo tratterebbe come un middleware normale.
//
// Va registrato in main.js PER ULTIMO, dopo tutte le rotte e dopo il middleware 404.
function errorHandler(err, req, res, next) {
  // CASO 1: un errore "nostro", creato apposta con new AppError(status, messaggio)
  // (es. throw new AppError(404, "Quiz non trovato") dentro un controller)
  if (err.statusCode) {
    return res
      .status(err.statusCode)
      .json({ success: false, message: err.message });
  }

  // CASO 2: un errore sollevato DIRETTAMENTE da PostgreSQL (tramite il driver pg),
  // non ancora "tradotto" da nessun controller. err.code è un codice standard di Postgres.
  if (err.code === "23505") {
    // violazione di un vincolo UNIQUE (es. username o email già esistenti, nome categoria duplicato)
    return res.status(409).json({
      success: false,
      message: "Risorsa già esistente (valore duplicato)",
    });
  }
  if (err.code === "23503") {
    // violazione di una FOREIGN KEY (es. category_id che punta a una categoria inesistente)
    return res.status(400).json({
      success: false,
      message: "Riferimento a una risorsa inesistente",
    });
  }
  if (err.code === "23502") {
    // violazione di NOT NULL (manca un campo obbligatorio nella tabella)
    return res
      .status(400)
      .json({ success: false, message: "Campo obbligatorio mancante" });
  }

  // CASO 3: qualsiasi altro errore imprevisto (bug, connessione persa, ecc.)
  // Lo stampo nel terminale per poterlo indagare, ma al client mando un messaggio generico:
  // non vogliamo rivelare dettagli interni (nomi di tabelle, stack trace) a chi usa l'API.
  console.error("Errore non gestito:", err);
  res
    .status(500)
    .json({ success: false, message: "Errore interno del server" });
}

module.exports = errorHandler;
