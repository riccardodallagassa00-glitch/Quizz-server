// Importo la funzione che controlla in modo rigoroso gli id ricevuti dall'indirizzo (vedi src/utils/parseId.js)
const parseId = require("../utils/parseId.js");
const userRepositories = require("../repositories/userRepositories.js");
const AppError = require("../utils/AppError.js");
const bcrypt = require("bcrypt");
const saltRounds = 10;

// Funzione chiamata quando arriva una richiesta GET /api/users
// Due query param opzionali: ?name=... e ?limit=...
async function getUsers(req, res, next) {
  try {
    const { name, limit } = req.query;
    const risultato = await userRepositories.getAll({
      name: name || null,
      limit: limit ? parseInt(limit, 10) : null,
    });
    res.json(risultato);
  } catch (errore) {
    next(errore);
  }
}

// Funzione chiamata quando arriva una richiesta GET /api/user/:id
async function getUser(req, res, next) {
  try {
    const id = parseId(req.params.id);
    if (id === null) {
      throw new AppError(
        400,
        "ID non valido: deve essere un numero intero positivo",
      );
    }

    const user = await userRepositories.getById(id);
    if (!user) {
      throw new AppError(404, "Utente non trovato");
    }
    res.json(user);
  } catch (errore) {
    next(errore);
  }
}

// Funzione chiamata quando arriva una richiesta POST /api/user
async function createUser(req, res, next) {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      throw new AppError(
        400,
        "Dati non validi. Servono: username (string), email (string), password (string)",
      );
    }

    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const createdUser = await userRepositories.create({
      username,
      email,
      password: hashedPassword,
    });

    res.status(201).json(createdUser);
  } catch (errore) {
    next(errore);
  }
}

// Funzione chiamata quando arriva una richiesta PUT /api/user/:id
async function updateUser(req, res, next) {
  try {
    const id = parseId(req.params.id);
    if (id === null) {
      throw new AppError(
        400,
        "ID non valido: deve essere un numero intero positivo",
      );
    }

    const { username, email, password } = req.body;
    const hashedPassword = password
      ? await bcrypt.hash(password, saltRounds)
      : null;

    const user = await userRepositories.update(id, {
      username: username || null,
      email: email || null,
      password: hashedPassword,
    });

    if (!user) {
      throw new AppError(404, "Utente non trovato");
    }
    res.json(user);
  } catch (errore) {
    next(errore);
  }
}

// Funzione chiamata quando arriva una richiesta DELETE /api/user/:id
async function deleteUser(req, res, next) {
  try {
    const id = parseId(req.params.id);
    if (id === null) {
      throw new AppError(
        400,
        "ID non valido: deve essere un numero intero positivo",
      );
    }

    const rimosso = await userRepositories.remove(id);
    if (!rimosso) {
      throw new AppError(404, "Utente non trovato");
    }
    res.json({ messaggio: "Utente eliminato", utente: rimosso });
  } catch (errore) {
    next(errore);
  }
}

module.exports = { getUsers, getUser, createUser, updateUser, deleteUser };
