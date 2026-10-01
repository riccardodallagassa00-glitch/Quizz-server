// Un errore "normale" (new Error()) non ha un posto dove scrivere "con che status HTTP rispondere".
// AppError aggiunge proprio questo: ogni volta che la creiamo, decidiamo subito lo status code.
// Esempio d'uso in un controller: throw new AppError(404, "Categoria non trovata");
class AppError extends Error {
  constructor(statusCode, message) {
    super(message); // passo il messaggio al costruttore di Error "normale"
    this.statusCode = statusCode;
    this.name = "AppError"; // utile in debug, per distinguerlo da altri tipi di errore nei log
  }
}

module.exports = AppError;
