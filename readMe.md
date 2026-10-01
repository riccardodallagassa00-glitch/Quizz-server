PROGETTO: Sistema Quiz — Backend Node.js
PANORAMICA DEL PROGETTO --> Sviluppare un backend in Node.js/JavaScript per un sistema di quiz che permetta:

1. Registrazione e login utente
2. Creazione di quiz con domande, opzioni di risposta e risposta corretta
3. "gioco" composto da 10 step (10 domande estratte da una categoria)
4. Registro dei punteggi ottenuti dagli utenti
   Il progetto è suddiviso in task incrementali. Ogni task include requisiti funzionali (cosa deve fare il sistema) e requisiti tecnici (come deve essere implementato).

Nota tecnica: l'accesso al database avviene senza ORM. Si usa il driver nativo pg (node-postgres) con query SQL scritte a mano, tramite un pool di connessioni condiviso e query parametrizzate ($1, $2, ...) per prevenire SQL injection.

TASK 0 — SETUP DEL PROGETTO
-->Requisiti funzionali:
Inizializzare un progetto Node.js pronto per lo sviluppo di API REST.
-->Requisiti tecnici:
Node.js (versione LTS consigliata) + npm init
Framework: Express.js
Database: PostgreSQL
Accesso al DB: driver nativo pg (node-postgres), nessun ORM/query builder — query SQL scritte a mano
Gestione del pool di connessioni: un modulo unico (/src/config/db.js) che esporta un'istanza di Pool da riusare in tutta l'app, es.:

// src/config/db.js
const { Pool } = require('pg');
const pool = new Pool({
host: process.env.DB_HOST,
port: process.env.DB_PORT,
user: process.env.DB_USER,
password: process.env.DB_PASSWORD,
database: process.env.DB_NAME,
});
module.exports = pool;

-->Tutte le query vanno scritte come SQL esplicito e parametrizzato (mai concatenazione di stringhe), es.:
const { rows } = await pool.query(
'SELECT id, username, email FROM "user" WHERE id = $1',
[userId]
);
-->Gestione variabili d'ambiente: dotenv (.env per credenziali DB, JWT secret, porta server)

Struttura cartelle consigliata:
/src
/config -> connessione DB (pool pg), configurazioni
/db -> query SQL organizzate per entità (es. userQueries.js, quizQueries.js)
/controllers -> logica delle rotte
/routes -> definizione endpoint
/middlewares -> auth, validazione, error handling
/utils -> funzioni di supporto (es. hashing, JWT)
/tests
.env
server.js
-->Versionamento con Git (repository con .gitignore che esclude node_modules e .env)

TASK 1 — DATABASE
-->Requisiti funzionali
Il sistema deve avere una base dati persistente con le entità: utente, categoria, quiz, domanda, risposta, punteggio.
-->Requisiti tecnici
Creare le tabelle secondo lo schema SQL fornito (category, user, quiz, question, answer, score) tramite script .sql versionati (es. cartella /db/migrations)
Nessun ORM: le tabelle vengono create ed evolute con script SQL puri (CREATE TABLE, ALTER TABLE), eseguiti manualmente o tramite un piccolo runner di migrazioni (es. node-pg-migrate, opzionale, oppure semplici file numerati eseguiti in ordine)
Organizzare le query per ciascuna entità in moduli dedicati sotto /src/db (es. userQueries.js, categoryQueries.js, quizQueries.js, questionQueries.js, answerQueries.js, scoreQueries.js), ciascuno con funzioni tipo getById, create, update, remove che eseguono query pg esplicite
Creare uno script di seed (file .sql o script Node che usa pool.query) con almeno 2 categorie e alcuni quiz di esempio, per poter testare il gioco senza inserire dati manualmente
Gestire le relazioni tramite chiavi esterne (FOREIGN KEY) definite direttamente nello schema SQL, non tramite associazioni ORM

TASK 2 — REGISTRAZIONE LOGIN E UTENTE
-->Requisiti funzionali
Un nuovo utente deve potersi registrare fornendo username, email e password.
Un utente registrato deve poter effettuare il login con email/username e password.
Il sistema deve impedire la registrazione con email o username già esistenti.
Dopo il login, l'utente riceve un token che gli permette di accedere alle rotte protette (es. giocare, vedere il proprio punteggio).
-->Requisiti tecnici
Endpoint:
POST /api/auth/register → crea utente
POST /api/auth/login → autentica utente e restituisce token
Hashing password con bcrypt (mai salvare password in chiaro)
Autenticazione basata su JWT (JSON Web Token)
Token da includere nell'header Authorization: Bearer <token> nelle richieste protette
Middleware authMiddleware che verifica la validità del token prima di lasciar passare la richiesta alle rotte protette
Validazione input (es. con Joi o express-validator):
email in formato valido
password con lunghezza minima
campi obbligatori non vuoti
Verifica duplicati con query esplicita prima dell'insert, es.:
const existing = await pool.query(
'SELECT id FROM "user" WHERE email = $1 OR username = $2',
[email, username]
);
if (existing.rows.length > 0) {
// 409 conflict
}
Inserimento nuovo utente con INSERT ... RETURNING id, username, email per ottenere subito i dati creati senza una query aggiuntiva
Gestione errori con status code appropriati (400 per input non valido, 401 per credenziali errate, 409 per utente già esistente)

TASK 3 — GESTIONE CATEGORIE
-->Requisiti funzionali
Deve essere possibile creare, leggere, aggiornare ed eliminare categorie di quiz.
-->Requisiti tecnici
Endpoint CRUD:
POST /api/categories
GET /api/categories
GET /api/categories/:id
PUT /api/categories/:id
DELETE /api/categories/:id
Ogni operazione CRUD implementata come query pg esplicita in categoryQueries.js (INSERT, SELECT, UPDATE ... RETURNING \*, DELETE)
Validazione: nome categoria obbligatorio e univoco (vincolo UNIQUE a livello di schema SQL + controllo applicativo che intercetta l'errore di violazione vincolo, es. codice errore 23505 di PostgreSQL)

TASK 4 — GESTIONE QUIZ, DOMANDE E RISPOSTE
-->Requisiti funzionali
Un quiz deve appartenere a una categoria.
Ogni quiz deve avere più domande.
Ogni domanda deve avere più opzioni di risposta, con una sola risposta corretta indicata.
Deve essere possibile creare un quiz completo (con domande e risposte annesse) in un'unica operazione, oppure aggiungere domande a un quiz esistente.
-->Requisiti tecnici
Endpoint minimi:
POST /api/quizzes → crea un quiz (con category_id)
GET /api/quizzes → lista quiz (filtrabile per categoria)
GET /api/quizzes/:id → dettaglio quiz (senza rivelare quale risposta è corretta, se destinato al giocatore)
POST /api/quizzes/:id/questions → aggiunge una domanda al quiz
POST /api/questions/:id/answers → aggiunge opzioni di risposta a una domanda
Creazione di un quiz completo (quiz + domande + risposte in un'unica chiamata): usare una transazione pg esplicita per garantire atomicità, es.:
const client = await pool.connect();
try {
await client.query('BEGIN');
const quizResult = await client.query(
'INSERT INTO quiz (title, category_id) VALUES ($1, $2) RETURNING id',
[title, categoryId]
);
const quizId = quizResult.rows[0].id;

for (const q of questions) {
const questionResult = await client.query(
'INSERT INTO question (quiz_id, text) VALUES ($1, $2) RETURNING id',
[quizId, q.text]
);
const questionId = questionResult.rows[0].id;

    for (const a of q.answers) {
      await client.query(
        'INSERT INTO answer (question_id, text, is_correct) VALUES ($1, $2, $3)',
        [questionId, a.text, a.is_correct]
      );
    }

}
await client.query('COMMIT');
} catch (err) {
await client.query('ROLLBACK');
throw err;
} finally {
client.release();
}
-->VALIDAZIONE:
ogni domanda deve avere almeno 2 opzioni di risposta
deve esistere esattamente una risposta marcata come is_correct = true per domanda (in caso di scelta multipla) — verificabile lato applicativo prima dell'insert, oppure con un CHECK/trigger SQL più avanzato (opzionale)
Nelle query destinate al gameplay, selezionare esplicitamente solo le colonne necessarie (es. SELECT id, text FROM answer WHERE question_id = $1), senza includere is_correct nella SELECT, per evitare di esporlo al client prima che l'utente abbia risposto

TASK 5 — IL GIOCO (10 STEP-10 DOMANDE)
-->Requisiti funzionali
L'utente autenticato sceglie una categoria e avvia una partita.
Il sistema seleziona 10 domande casuali appartenenti a quella categoria (da uno o più quiz della categoria).
L'utente risponde domanda per domanda (10 step in sequenza).
Al termine, il sistema calcola il punteggio totale e lo salva nel registro punteggi (tabella score), collegato all'utente.
L'utente riceve un riepilogo finale (punteggio ottenuto / punteggio massimo, eventualmente tempo impiegato).
-->Requisiti tecnici
Endpoint suggeriti (approccio "sessione di gioco"):
POST /api/game/start → riceve category_id, restituisce 10 domande (senza risposta corretta) e un game_session_id
POST /api/game/:session_id/answer → riceve question_id + answer_id scelto, restituisce se corretto/sbagliato e passa allo step successivo
POST /api/game/:session_id/finish → chiude la sessione, calcola punteggio finale e salva su score
Se non si vuole gestire uno stato di sessione lato server, alternativa più semplice per uno stagista:
POST /api/game/start?category_id=X → restituisce array di 10 domande con relative opzioni (senza indicare quale è corretta)
Il client risponde a tutte e 10, poi invia un unico payload con tutte le risposte:
POST /api/game/submit → riceve array {question_id, answer_id} x10, verifica lato server quali sono corrette, calcola punteggio, salva su score, e restituisce il dettaglio (corrette/sbagliate)
Logica di selezione casuale delle domande: query SQL diretta con ORDER BY RANDOM() e LIMIT 10, filtrando per categoria tramite join con quiz, es.:
const { rows } = await pool.query(
`SELECT q.id, q.text
   FROM question q
   JOIN quiz qz ON q.quiz_id = qz.id
   WHERE qz.category_id = $1
   ORDER BY RANDOM()
   LIMIT 10`,
[categoryId]
);
Verifica delle risposte inviate: query che recupera is_correct solo lato server, confrontando gli answer_id inviati dal client con i dati nel DB, es. SELECT id, is_correct FROM answer WHERE id = ANY($1::int[]) per verificare più risposte in un'unica query
Se la categoria ha meno di 10 domande disponibili, gestire il caso con un messaggio di errore chiaro (controllare COUNT(\*) prima di procedere, o semplicemente verificare la lunghezza dell'array restituito)
La verifica della risposta corretta deve avvenire sempre lato server, mai fidandosi del client.

TASK 6 — REGISTRO PUNTEGGI
-->Requisiti funzionali
Ogni utente deve poter consultare lo storico delle proprie partite (punteggio, quiz/categoria, data).
(Opzionale) Classifica generale o per categoria.
-->Requisiti tecnici
Endpoint:
GET /api/scores/me → storico punteggi dell'utente autenticato (richiede token)
GET /api/scores/leaderboard?category_id=X (opzionale) → classifica ordinata per punteggio decrescente
I dati salvati in score devono includere: user_id, quiz_id (o category_id), score_obtained, max_score, completed_at
Query di storico e classifica scritte a mano con JOIN espliciti tra score, user e category/quiz, ordinate con ORDER BY score_obtained DESC per la classifica

TASK 7 — VALIDAZIONE, ERROR HANDLING E SICUREZZA
-->Requisiti funzionali
Il sistema deve rispondere in modo chiaro e coerente in caso di errore (input mancante, non autorizzato, risorsa non trovata).
-->Requisiti tecnici
Middleware centralizzato di gestione errori (errorHandler) che restituisce risposte JSON uniformi, es:
{ "success": false, "message": "Descrizione errore" }
Gestire esplicitamente gli errori del driver pg (es. violazione di vincoli UNIQUE/FOREIGN KEY, tramite il campo err.code restituito da PostgreSQL) e tradurli in status code HTTP appropriati, invece di lasciare che eccezioni SQL grezze arrivino al client
Status code HTTP corretti: 200/201 successo, 400 bad request, 401 unauthorized, 403 forbidden, 404 not found, 409 conflict, 500 errore server
Protezione delle rotte di gioco e punteggio con authMiddleware
Non esporre mai password (nemmeno hashata) nelle risposte API: escludere sempre la colonna password dalle SELECT verso il client
(Consigliato) Rate limiting base sulle rotte di login per prevenire brute force (es. express-rate-limit)

TASK 8 — TESTING
-->Requisiti funzionali
Le funzionalità principali (registrazione, login, avvio gioco, invio risposte, punteggio) devono essere verificabili automaticamente.
-->Requisiti tecnici
Framework di test: Jest + Supertest per testare gli endpoint Express
Per i test è consigliabile un database PostgreSQL di test separato (o schema dedicato), popolato tramite gli stessi script .sql di seed usati in sviluppo, così da verificare le query reali senza mock dell'ORM (che qui non esiste)
Almeno un test per:

1. registrazione utente (successo + email duplicata)
2. login (successo + credenziali errate)
3. avvio gioco (10 domande restituite, categoria inesistente gestita)
4. invio risposte e calcolo punteggio corretto

TASK 9 — DOCUMENTAZIONE API
-->Requisiti funzionali:
Deve esistere una documentazione consultabile di tutti gli endpoint disponibili.
-->Requisiti tecnici:
Documentazione tramite Postman Collection (esportata come JSON) oppure Swagger/OpenAPI (consigliato swagger-jsdoc + swagger-ui-express)
Deve includere: metodo, path, body richiesto, esempio di risposta, se richiede autenticazione
Riepilogo stack tecnico consigliato
Ambito Tecnologia
Runtime Node.js (LTS)
Framework Express.js
Database PostgreSQL
Accesso al DB pg (node-postgres), query manuali, nessun ORM
Autenticazione JWT + bcrypt
Validazione Joi / express-validator
Testing Jest + Supertest
Documentazione Swagger / Postman
Config dotenv
Criteri di completamento (Definition of Done)
Utente può registrarsi e loggarsi, ricevendo un token valido
Rotte di gioco protette da autenticazione
Quiz/domande/risposte gestibili via API con categoria associata, tramite query pg scritte a mano
Una partita restituisce esattamente 10 domande di una categoria scelta
Il punteggio finale viene calcolato lato server e salvato correttamente
L'utente può consultare il proprio storico punteggi
Password mai esposte, risposta corretta mai esposta prima del completamento della domanda
Query parametrizzate ovunque (nessuna concatenazione di stringhe SQL)
Test automatici superati per i flussi principali
Documentazione API disponibile
