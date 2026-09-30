// Wrapper attorno a jsonwebtoken: centralizza chiave segreta e scadenza, lette dal .env
const jwt = require("jsonwebtoken");

const SECRET = process.env.JWT_SECRET;
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1h";

if (!SECRET) {
  throw new Error("Manca la variabile JWT_SECRET nel file .env");
}

// Crea un token firmato. Il payload contiene solo id e username, MAI la password
function generateToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRES_IN });
}

// Verifica un token: se valido restituisce il payload, altrimenti lancia un errore
// (scaduto o firmato con una chiave diversa: jwt.verify li segnala allo stesso modo)
function verifyToken(token) {
  return jwt.verify(token, SECRET);
}

module.exports = { generateToken, verifyToken };
