// Array che funge da "database" temporaneo: i dati vivono solo finché il server resta acceso
let quizzes = [
  {
    id: 1,
    domanda: "Qual è la capitale d'Italia?",
    risposte: ["Milano", "Roma", "Napoli", "Torino"],
    rispostaCorretta: 1, // indice dentro l'array "risposte": 1 corrisponde a "Roma"
  },
];

// Contatore per assegnare un id sempre nuovo e diverso a ogni quiz creato
let prossimoId = 2;

// Funzione chiamata quando arriva una richiesta GET /api/quizz
function getQuizzes(req, res) {
  res.json(quizzes); // rispondo con l'intero array dei quiz, in formato JSON
}

// Funzione chiamata quando arriva una richiesta POST /api/quizz
function createQuiz(req, res) {
  // estraggo i 3 campi necessari dal corpo della richiesta inviata dal client
  const { domanda, risposte, rispostaCorretta } = req.body;

  // controllo che i dati siano validi:
  // - domanda deve esistere
  // - risposte deve essere un array (Array.isArray verifica proprio questo)
  // - rispostaCorretta deve essere stata specificata (!== undefined, perché potrebbe anche essere 0, che è "falsy")
  if (!domanda || !Array.isArray(risposte) || rispostaCorretta === undefined) {
    // status 400 = dati mandati dal client non validi
    return res.status(400).json({
      errore:
        "Dati non validi. Servono: domanda (string), risposte (array), rispostaCorretta (number)",
    });
  }

  // creo il nuovo oggetto quiz, assegnando l'id corrente e incrementando il contatore per il prossimo
  const nuovoQuiz = { id: prossimoId++, domanda, risposte, rispostaCorretta };

  // aggiungo il nuovo quiz in fondo all'array
  quizzes.push(nuovoQuiz);

  // status 201 = creazione avvenuta con successo
  res.status(201).json(nuovoQuiz); // rispondo con il quiz appena creato
}

// Esporto le 2 funzioni così il file delle rotte (quizz.routes.js) può usarle
module.exports = { getQuizzes, createQuiz };
