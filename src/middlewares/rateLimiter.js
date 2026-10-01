// Funzione UNICA che crea un middleware di rate limiting "su misura": quante richieste al
// massimo (maxRichieste) in quanti millisecondi (finestraMs). Restituisce 429 quando il limite
// viene superato. La si richiama direttamente nel router, passandole i due numeri.
const { rateLimit } = require("express-rate-limit");

function rateLimiter(maxRichieste, finestraMs) {
  return rateLimit({
    windowMs: finestraMs, // durata della finestra temporale, in millisecondi
    max: maxRichieste, // massimo numero di richieste permesse, per IP, in quella finestra
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: `Too many requests. Please try again in a few minutes (maximum ${maxRichieste} per ${Math.round(finestraMs / 60000)} minutes).`,
    },
  });
}

module.exports = rateLimiter;
