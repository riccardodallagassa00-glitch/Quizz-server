// Importo la funzione che controlla in modo rigoroso gli id ricevuti dall'indirizzo (vedi src/utils/parseId.js)
const parseId = require("../utils/parseId.js");
const userRepositories = require("../repositories/userRepositories.js");
const bcrypt = require("bcrypt");
const saltRounds = 10;

// Funzione chiamata quando arriva una richiesta GET /api/users
// Due query param opzionali: ?name=...e ?limit=...
async function getUsers(req, res) {
  const { name, limit } = req.query;

  try {
    // il filtro e il limite li applica direttamente la query SQL, non più un array in memoria
    const risultato = await userRepositories.getAll({
      name: name || null,
      // i query param arrivano sempre come testo: converto in numero solo se è stato passato
      limit: limit ? parseInt(limit, 10) : null,
    });
    res.json(risultato);
  } catch (errore) {
    console.error("Errore in getUsers:", errore.message);
    res.status(500).json({ errore: "Errore interno del server" });
  }
}

// Funzione chiamata quando arriva una richiesta GET /api/user/:id (singolare, un solo utente)
async function getUser(req, res) {
  const id = parseId(req.params.id);

  if (id === null) {
    return res
      .status(400)
      .json({ errore: "ID non valido: deve essere un numero intero positivo" });
  }

  try {
    const user = await userRepositories.getById(id);

    if (!user) {
      return res.status(404).json({ errore: "Utente non trovato" });
    }
    res.json(user);
  } catch (errore) {
    console.error("Errore in getUser:", errore.message);
    res.status(500).json({ errore: "Errore interno del server" });
  }
}

// Funzione chiamata quando arriva una richiesta POST /api/user
async function createUser(req, res) {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({
      errore:
        "Dati non validi. Servono: username (string), email (string), password (string)",
    });
  }

  const hashedPassword = await bcrypt.hash(password, saltRounds);
  const nuovoUser = { username, email, password: hashedPassword };

  try {
    const createdUser = await userRepositories.create(nuovoUser);
    res.status(201).json(createdUser);
  } catch (errore) {
    // codice 23505 = PostgreSQL segnala una violazione di UNIQUE: username o email già esistenti
    if (errore.code === "23505") {
      return res
        .status(409)
        .json({ errore: "Username o email già registrati" });
    }
    if (errore.code === "23502") {
      return res
        .status(400)
        .json({ errore: `Campo obbligatorio mancante: ${errore.column}` });
    }
    console.error("Errore in createUser:", errore.message);
    res.status(500).json({ errore: "Errore interno del server" });
  }
}

// Funzione chiamata quando arriva una richiesta PUT /api/user/:id
async function updateUser(req, res) {
  const id = parseId(req.params.id);

  if (id === null) {
    return res
      .status(400)
      .json({ errore: "ID non valido: deve essere un numero intero positivo" });
  }

  const { username, email, password } = req.body;

  try {
    // se il client manda una nuova password, la cifro PRIMA di passarla al repository:
    // nel database non deve mai finire in chiaro, nemmeno in un update
    const hashedPassword = password
      ? await bcrypt.hash(password, saltRounds)
      : null;

    const user = await userRepositories.update(id, {
      username: username || null,
      email: email || null,
      password: hashedPassword,
    });

    if (!user) {
      return res.status(404).json({ errore: "Utente non trovato" });
    }
    res.json(user);
  } catch (errore) {
    if (errore.code === "23505") {
      return res
        .status(409)
        .json({ errore: "Username o email già in uso da un altro utente" });
    }
    console.error("Errore in updateUser:", errore.message);
    res.status(500).json({ errore: "Errore interno del server" });
  }
}

// Funzione chiamata quando arriva una richiesta DELETE /api/user/:id
async function deleteUser(req, res) {
  const id = parseId(req.params.id);

  if (id === null) {
    return res
      .status(400)
      .json({ errore: "ID non valido: deve essere un numero intero positivo" });
  }

  try {
    const rimosso = await userRepositories.remove(id);

    if (!rimosso) {
      return res.status(404).json({ errore: "Utente non trovato" });
    }
    res.json({ messaggio: "Utente eliminato", utente: rimosso });
  } catch (errore) {
    console.error("Errore in deleteUser:", errore.message);
    res.status(500).json({ errore: "Errore interno del server" });
  }
}

// Esporto le 5 funzioni così il file delle rotte (users.routes.js) può usarle
module.exports = { getUsers, getUser, createUser, updateUser, deleteUser };
