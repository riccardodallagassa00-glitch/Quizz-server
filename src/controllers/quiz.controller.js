// Logica delle rotte /api/quizzes. Le query vere e proprie sono nei file dentro src/repositories/.
const quizRepositories = require("../repositories/quizRepositories.js");
const questionRepositories = require("../repositories/questionRepositories.js");
const answerRepositories = require("../repositories/answerRepositories.js");
const parseId = require("../utils/parseId.js");

// Funzione chiamata quando arriva una richiesta GET /api/quizzes
// Query param OPZIONALE: ?category_id=... per vedere solo i quiz di una categoria
async function getQuizzes(req, res) {
  const { category_id } = req.query;

  // parto assumendo "nessun filtro", poi eventualmente lo valorizzo sotto
  let categoryId = null;

  // il query param arriva SOLO se il client lo ha scritto nell'indirizzo
  if (category_id !== undefined) {
    categoryId = parseId(category_id);
    if (categoryId === null) {
      return res
        .status(400)
        .json({ errore: "category_id deve essere un numero intero positivo" });
    }
  }

  try {
    const quizzes = await quizRepositories.getAll(categoryId);
    res.json(quizzes);
  } catch (errore) {
    console.error("Errore in getQuizzes:", errore.message);
    res.status(500).json({ errore: "Errore interno del server" });
  }
}

// Funzione chiamata quando arriva una richiesta GET /api/quizzes/:id
// Restituisce il quiz COMPLETO (domande + risposte), ma in versione sicura per il giocatore:
// nessuna risposta rivela mai se è quella corretta.
async function getQuiz(req, res) {
  const id = parseId(req.params.id);
  if (id === null) {
    return res
      .status(400)
      .json({ errore: "ID non valido: deve essere un numero intero positivo" });
  }

  try {
    const quiz = await quizRepositories.getFullById(id);
    if (!quiz) {
      return res.status(404).json({ errore: "Quiz non trovato" });
    }
    res.json(quiz);
  } catch (errore) {
    console.error("Errore in getQuiz:", errore.message);
    res.status(500).json({ errore: "Errore interno del server" });
  }
}

// Funzione DI SUPPORTO (non è collegata a nessuna rotta direttamente): controlla che un array
// di domande rispetti le regole richieste. Restituisce un messaggio di errore (stringa) se
// qualcosa non va bene, oppure null se è tutto valido.
function validaDomande(questions) {
  // deve esserci almeno una domanda, ed essere davvero un array
  if (!Array.isArray(questions) || questions.length === 0) {
    return "Servono una o più domande, ognuna con le sue opzioni di risposta";
  }

  // .entries() mi dà sia l'indice (i) sia la domanda stessa (q) per ogni ciclo,
  // così posso scrivere messaggi d'errore tipo "Domanda 2: ..."
  for (const [i, q] of questions.entries()) {
    // il testo della domanda è obbligatorio e non può essere solo spazi vuoti
    if (!q.text || typeof q.text !== "string" || !q.text.trim()) {
      return `Domanda ${i + 1}: il testo è obbligatorio`;
    }

    // ogni domanda deve avere ALMENO 2 opzioni di risposta (richiesto dal documento)
    if (!Array.isArray(q.answers) || q.answers.length < 2) {
      return `Domanda ${i + 1}: servono almeno 2 opzioni di risposta`;
    }

    // conto quante opzioni sono segnate come "corrette" (is_correct === true)
    const corrette = q.answers.filter((a) => a.is_correct === true).length;

    // deve essercene ESATTAMENTE una, né zero né due o più (richiesto dal documento)
    if (corrette !== 1) {
      return `Domanda ${i + 1}: deve esserci ESATTAMENTE una risposta corretta (trovate: ${corrette})`;
    }

    // controllo anche che ogni singola opzione abbia un testo valido
    for (const [j, a] of q.answers.entries()) {
      if (!a.text || typeof a.text !== "string" || !a.text.trim()) {
        return `Domanda ${i + 1}, opzione ${j + 1}: il testo è obbligatorio`;
      }
    }
  }

  // se arrivo qui, non ho trovato nessun problema
  return null;
}

// Funzione chiamata quando arriva una richiesta POST /api/quizzes
// Ha DUE comportamenti diversi, a seconda di cosa manda il client:
// - se il body contiene "questions" -> crea quiz + domande + risposte tutti insieme (transazione)
// - se non lo contiene -> crea SOLO il quiz (versione "minima")
async function createQuiz(req, res) {
  const { title, category_id, questions } = req.body;

  if (!title || typeof title !== "string" || !title.trim()) {
    return res
      .status(400)
      .json({ errore: "Il titolo del quiz è obbligatorio" });
  }

  // String(category_id) serve perché parseId si aspetta sempre una stringa in ingresso,
  // ma category_id nel body JSON potrebbe già arrivare come numero
  const categoryId = parseId(String(category_id));
  if (categoryId === null) {
    return res.status(400).json({
      errore: "category_id è obbligatorio e deve essere un numero intero",
    });
  }

  try {
    // "questions !== undefined" distingue "il client non ha mandato affatto questo campo"
    // da "il client ha mandato un array vuoto []" (che invece verrebbe rifiutato da validaDomande)
    if (questions !== undefined) {
      // valido TUTTO prima di aprire anche solo una connessione al database:
      // così non sprechiamo una transazione su dati che sappiamo già essere sbagliati
      const erroreValidazione = validaDomande(questions);
      if (erroreValidazione) {
        return res.status(400).json({ errore: erroreValidazione });
      }

      // qui parte davvero la transazione (vedi createFull in quizRepositories.js)
      const quiz = await quizRepositories.createFull({
        title: title.trim(),
        category_id: categoryId,
        questions,
      });
      return res.status(201).json(quiz);
    }

    // ramo "minimo": nessuna domanda, creo solo la riga del quiz
    const quiz = await quizRepositories.create({
      title: title.trim(),
      category_id: categoryId,
    });
    res.status(201).json(quiz);
  } catch (errore) {
    // 23503 = violazione FOREIGN KEY: la categoria indicata (category_id) non esiste nel database
    if (errore.code === "23503") {
      return res
        .status(400)
        .json({ errore: "La categoria indicata non esiste" });
    }
    console.error("Errore in createQuiz:", errore.message);
    res.status(500).json({ errore: "Errore interno del server" });
  }
}

// Funzione chiamata quando arriva una richiesta POST /api/quizzes/:id/questions
// Aggiunge UNA domanda (con le sue risposte) a un quiz che esiste già.
async function addQuestion(req, res) {
  const quizId = parseId(req.params.id);
  if (quizId === null) {
    return res.status(400).json({
      errore: "ID quiz non valido: deve essere un numero intero positivo",
    });
  }

  // riuso la stessa funzione di validazione di prima, mettendo l'unica domanda dentro un array
  // (validaDomande si aspetta sempre un array, anche se qui ne stiamo validando solo una)
  const erroreValidazione = validaDomande([req.body]);
  if (erroreValidazione) {
    // "Domanda 1" non avrebbe senso qui (c'è una sola domanda in questa richiesta):
    // sostituisco il testo per rendere il messaggio più naturale
    return res
      .status(400)
      .json({ errore: erroreValidazione.replace("Domanda 1", "La domanda") });
  }

  try {
    // controllo che il quiz a cui vogliamo aggiungere la domanda esista davvero
    const quiz = await quizRepositories.getById(quizId);
    if (!quiz) {
      return res.status(404).json({ errore: "Quiz non trovato" });
    }

    // creo prima la domanda, poi le sue risposte (due passaggi, usando i repository più piccoli)
    const domanda = await questionRepositories.addToQuiz(
      quizId,
      req.body.text.trim(),
    );
    const risposte = await answerRepositories.addMany(
      domanda.id,
      req.body.answers,
    );

    // rispondo con la domanda appena creata, con le risposte annidate dentro
    res.status(201).json({ ...domanda, answers: risposte });
  } catch (errore) {
    if (errore.code === "23503") {
      return res.status(400).json({ errore: "Quiz non valido" });
    }
    console.error("Errore in addQuestion:", errore.message);
    res.status(500).json({ errore: "Errore interno del server" });
  }
}

// Esporto le 4 funzioni così il file delle rotte (quiz.routes.js) può usarle
module.exports = { getQuizzes, getQuiz, createQuiz, addQuestion };
