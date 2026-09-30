// Verifica il token JWT prima di lasciar passare la richiesta a una rotta protetta.
const { verifyToken } = require("../utils/jwt.js");

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ errore: "Token mancante" });
  }

  const token = header.slice(7); // toglie "Bearer " (7 caratteri) e tiene solo il token

  try {
    const payload = verifyToken(token);
    req.user = payload; // le rotte successive potranno leggere req.user.id e req.user.username
    next();
  } catch (errore) {
    return res.status(401).json({ errore: "Token non valido o scaduto" });
  }
}

module.exports = authMiddleware;
