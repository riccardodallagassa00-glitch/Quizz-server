// Array che funge da "database" temporaneo: i dati vivono solo finché il server resta acceso
let users = [
  { id: 1, nome: "Mario Rossi", email: "mario.rossi@example.com" }, // un utente di esempio già presente
];

// Contatore per assegnare un id sempre nuovo e diverso a ogni utente creato
let prossimoId = 2;

// Funzione chiamata quando arriva una richiesta GET /api/users
function getUsers(req, res) {
  // req = "request", contiene i dati della richiesta in arrivo (qui non ci serve)
  // res = "response", è l'oggetto che uso per rispondere al client
  res.json(users); // rispondo con l'intero array di utenti, convertito automaticamente in JSON
}

// Funzione chiamata quando arriva una richiesta POST /api/user
function createUser(req, res) {
  // estraggo "nome" ed "email" dal corpo (body) della richiesta inviata dal client
  const { nome, email } = req.body;

  // controllo: se manca nome oppure email, non procedo e rispondo con errore
  if (!nome || !email) {
    // status 400 = "Bad Request", cioè il client ha mandato dati non validi
    return res.status(400).json({
      errore: "Dati non validi. Servono: nome (string), email (string)",
    });
  }

  // creo l'oggetto del nuovo utente, assegnando l'id corrente e poi incrementandolo (++) per il prossimo
  const nuovoUser = { id: prossimoId++, nome, email };

  // aggiungo il nuovo utente in fondo all'array
  users.push(nuovoUser);

  // status 201 = "Created", indica che qualcosa è stato creato con successo
  res.status(201).json(nuovoUser); // rispondo con l'utente appena creato
}

// Funzione chiamata quando arriva una richiesta PUT /api/user/:id
function updateUser(req, res) {
  // req.params contiene i parametri presenti nell'indirizzo (l'id nella rotta /user/:id)
  // parseInt converte il testo (es. "3") in un numero vero (3), perché nell'array l'id è un numero
  const id = parseInt(req.params.id, 10);

  // cerco nell'array l'utente con quell'id; find() restituisce il primo elemento che rispetta la condizione
  const user = users.find((u) => u.id === id);

  // se find() non trova nulla, restituisce undefined: qui lo controllo
  if (!user) {
    // status 404 = "Not Found", l'utente cercato non esiste
    return res.status(404).json({ errore: "Utente non trovato" });
  }

  // estraggo i nuovi valori (eventualmente) inviati dal client
  const { nome, email } = req.body;

  // aggiorno solo i campi effettivamente inviati (se nome è vuoto/non inviato, non lo tocco)
  if (nome) user.nome = nome;
  if (email) user.email = email;

  // rispondo con l'utente aggiornato
  res.json(user);
}

// Funzione chiamata quando arriva una richiesta DELETE /api/user/:id
function deleteUser(req, res) {
  // leggo l'id dall'indirizzo, come nella funzione precedente
  const id = parseInt(req.params.id, 10);

  // findIndex() restituisce la posizione (indice) dell'elemento nell'array, oppure -1 se non lo trova
  const index = users.findIndex((u) => u.id === id);

  // se non trovato, rispondo con errore 404
  if (index === -1) {
    return res.status(404).json({ errore: "Utente non trovato" });
  }

  // splice(index, 1) rimuove 1 elemento a partire da quella posizione, e restituisce un array con l'elemento rimosso
  const [rimosso] = users.splice(index, 1); // prendo il primo (e unico) elemento rimosso con la destrutturazione

  // confermo l'eliminazione, mostrando anche i dati dell'utente eliminato
  res.json({ messaggio: "Utente eliminato", utente: rimosso });
}

// Esporto le 4 funzioni così il file delle rotte (users.routes.js) può usarle
module.exports = { getUsers, createUser, updateUser, deleteUser };
