const userRepositories = require("../repositories/userRepositories.js");
const bcrypt = require("bcrypt");
const { generateToken } = require("../utils/jwt.js");
const AppError = require("../utils/AppError.js");

const saltRounds = 10;

// POST /api/auth/register
async function register(req, res, next) {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      throw new AppError(
        400,
        "Dati non validi. Servono: username (string), email (string), password (string)",
      );
    }
    if (password.length < 8) {
      throw new AppError(400, "La password deve avere almeno 8 caratteri");
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new AppError(400, "L'email non è in un formato valido");
    }

    // Controllo duplicati ESPLICITO prima dell'insert, come richiesto dal documento
    const esistente = await userRepositories.findByEmailOrUsername(
      email,
      username,
    );
    if (esistente) {
      throw new AppError(409, "Username o email già registrati");
    }

    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const nuovoUtente = await userRepositories.create({
      username,
      email,
      password: hashedPassword,
    });

    res.status(201).json(nuovoUtente);
  } catch (errore) {
    // Se due registrazioni arrivano nello stesso istante, il controllo esplicito sopra potrebbe
    // non bastare: il vincolo UNIQUE del database lo intercetta comunque (errorHandler lo traduce)
    next(errore);
  }
}

// POST /api/auth/login
async function login(req, res, next) {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      throw new AppError(
        400,
        "Servono identifier (email o username) e password",
      );
    }

    const utente = await userRepositories.findForLogin(identifier);

    // Stesso messaggio generico sia per utente inesistente sia per password sbagliata
    if (!utente) {
      throw new AppError(401, "Credenziali non valide");
    }

    const passwordCorretta = await bcrypt.compare(password, utente.password);
    if (!passwordCorretta) {
      throw new AppError(401, "Credenziali non valide");
    }

    const token = generateToken({ id: utente.id, username: utente.username });

    res.json({
      token,
      user: { id: utente.id, username: utente.username, email: utente.email },
    });
  } catch (errore) {
    next(errore);
  }
}

module.exports = { register, login };
