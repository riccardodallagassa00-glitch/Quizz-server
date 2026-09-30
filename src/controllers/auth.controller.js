// Registrazione e login. Le query sono in src/repositories/userRepositories.js,
// qui decidiamo solo cosa fare con i risultati e cosa rispondere al client.
const userRepositories = require("../repositories/userRepositories.js");
const bcrypt = require("bcrypt");
const { generateToken } = require("../utils/jwt.js");

const saltRounds = 10;

// POST /api/auth/register
async function register(req, res) {
  const { username, email, password } = req.body;

  // Validazione base: campi obbligatori. (Se in futuro aggiungi Joi, questo blocco lo puoi sostituire
  // con uno schema; per ora restiamo coerenti con i controlli già scritti nel resto del progetto)
  if (!username || !email || !password) {
    return res.status(400).json({
      errore:
        "Dati non validi. Servono: username (string), email (string), password (string)",
    });
  }
  if (password.length < 8) {
    return res
      .status(400)
      .json({ errore: "La password deve avere almeno 8 caratteri" });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res
      .status(400)
      .json({ errore: "L'email non è in un formato valido" });
  }

  try {
    // Controllo duplicati ESPLICITO, prima di provare l'insert (come richiesto dal documento)
    const esistente = await userRepositories.findByEmailOrUsername(
      email,
      username,
    );
    if (esistente) {
      return res
        .status(409)
        .json({ errore: "Username o email già registrati" });
    }

    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const nuovoUtente = await userRepositories.create({
      username,
      email,
      password: hashedPassword,
    });

    res.status(201).json(nuovoUtente);
  } catch (errore) {
    // Rete di sicurezza: se due registrazioni arrivano nello stesso istante, il controllo esplicito
    // sopra potrebbe non bastare da solo. Il vincolo UNIQUE del database intercetta comunque il caso.
    if (errore.code === "23505") {
      return res
        .status(409)
        .json({ errore: "Username o email già registrati" });
    }
    console.error("Errore in register:", errore.message);
    res.status(500).json({ errore: "Errore interno del server" });
  }
}

// POST /api/auth/login
async function login(req, res) {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    return res
      .status(400)
      .json({ errore: "Servono identifier (email o username) e password" });
  }

  try {
    const utente = await userRepositories.findForLogin(identifier);

    // Stesso messaggio generico sia per utente inesistente sia per password sbagliata:
    // così chi tenta il login non scopre se una email è registrata o no
    if (!utente) {
      return res.status(401).json({ errore: "Credenziali non valide" });
    }

    const passwordCorretta = await bcrypt.compare(password, utente.password);
    if (!passwordCorretta) {
      return res.status(401).json({ errore: "Credenziali non valide" });
    }

    const token = generateToken({ id: utente.id, username: utente.username });

    res.json({
      token,
      user: { id: utente.id, username: utente.username, email: utente.email },
    });
  } catch (errore) {
    console.error("Errore in login:", errore.message);
    res.status(500).json({ errore: "Errore interno del server" });
  }
}

module.exports = { register, login };
