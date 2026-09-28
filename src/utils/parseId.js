// Converte l'id ricevuto dall'indirizzo (arriva sempre come testo) in un numero, in modo rigoroso.
// Restituisce null se non è un intero valido: "1abc", "1.5", "-3", "abc", "1e2", "0x10" -> null
function parseId(valore) {
  // ^\d+$ = la stringa deve essere fatta SOLO da cifre, dall'inizio (^) alla fine ($)
  if (!/^\d+$/.test(valore)) return null;
  return Number(valore);
}

module.exports = parseId;
