# Progetto: Sistema Quiz — Backend Node.js

### Documento di Task per Stagista Backend

---

## Panoramica del progetto

Sviluppare un backend in Node.js/JavaScript per un sistema di quiz che permetta:

- Registrazione e login utente
- Creazione di quiz con domande, opzioni di risposta e risposta corretta
- Un "gioco" composto da 10 step (10 domande estratte da una categoria)
- Registro dei punteggi ottenuti dagli utenti

Il progetto è suddiviso in task incrementali. Ogni task include requisiti funzionali (cosa deve fare il sistema) e requisiti tecnici (come deve essere implementato).

---

## TASK 0 — Setup del progetto

### Requisiti funzionali

- Inizializzare un progetto Node.js pronto per lo sviluppo di API REST.

### Requisiti tecnici

- Node.js (versione LTS consigliata) + `npm init`
- Framework: **Express.js**
- Database: **MySQL** o **PostgreSQL** (a scelta, coerente con lo schema SQL già definito)
- ORM/Query builder consigliato: **Sequelize** oppure **Knex.js** (in alternativa driver nativo `pg`/`mysql2`)
- Gestione variabili d'ambiente: **dotenv** (`.env` per credenziali DB, JWT secret, porta server)
- Struttura cartelle consigliata:
  ```
  /src
    /config      -> connessione DB, configurazioni
    /models      -> definizione tabelle/entità
    /controllers -> logica delle rotte
    /routes      -> definizione endpoint
    /middlewares -> auth, validazione, error handling
    /utils       -> funzioni di supporto (es. hashing, JWT)
  /tests
  .env
  server.js
  ```
- Versionamento con Git (repository con `.gitignore` che esclude `node_modules` e `.env`)

---

## TASK 1 — Database

### Requisiti funzionali

- Il sistema deve avere una base dati persistente con le entità: utente, categoria, quiz, domanda, risposta, punteggio.

### Requisiti tecnici

- Creare le tabelle secondo lo schema SQL fornito (`category`, `user`, `quiz`, `question`, `answer`, `score`)
- Se si usa un ORM (es. Sequelize), definire i **model** corrispondenti e le relazioni (associazioni `hasMany` / `belongsTo`)
- Creare uno script di **seed** con almeno 2 categorie e alcuni quiz di esempio, per poter testare il gioco senza inserire dati manualmente
- Gestire le migrazioni (Sequelize CLI o script SQL versionati)

---

## TASK 2 — Registrazione e Login Utente

### Requisiti funzionali

- Un nuovo utente deve potersi registrare fornendo username, email e password.
- Un utente registrato deve poter effettuare il login con email/username e password.
- Il sistema deve impedire la registrazione con email o username già esistenti.
- Dopo il login, l'utente riceve un token che gli permette di accedere alle rotte protette (es. giocare, vedere il proprio punteggio).

### Requisiti tecnici

- Endpoint:
  - `POST /api/auth/register` → crea utente
  - `POST /api/auth/login` → autentica utente e restituisce token
- Hashing password con **bcrypt** (mai salvare password in chiaro)
- Autenticazione basata su **JWT** (JSON Web Token)
  - Token da includere nell'header `Authorization: Bearer <token>` nelle richieste protette
- Middleware `authMiddleware` che verifica la validità del token prima di lasciar passare la richiesta alle rotte protette
- Validazione input (es. con **Joi** o **express-validator**):
  - email in formato valido
  - password con lunghezza minima
  - campi obbligatori non vuoti
- Gestione errori con status code appropriati (400 per input non valido, 401 per credenziali errate, 409 per utente già esistente)

---

## TASK 3 — Gestione Categorie

### Requisiti funzionali

- Deve essere possibile creare, leggere, aggiornare ed eliminare categorie di quiz.

### Requisiti tecnici

- Endpoint CRUD:
  - `POST /api/categories`
  - `GET /api/categories`
  - `GET /api/categories/:id`
  - `PUT /api/categories/:id`
  - `DELETE /api/categories/:id`
- Validazione: nome categoria obbligatorio e univoco

---

## TASK 4 — Gestione Quiz, Domande e Risposte

### Requisiti funzionali

- Un quiz deve appartenere a una categoria.
- Ogni quiz deve avere più domande.
- Ogni domanda deve avere più opzioni di risposta, con **una sola risposta corretta** indicata.
- Deve essere possibile creare un quiz completo (con domande e risposte annesse) in un'unica operazione, oppure aggiungere domande a un quiz esistente.

### Requisiti tecnici

- Endpoint minimi:
  - `POST /api/quizzes` → crea un quiz (con `category_id`)
  - `GET /api/quizzes` → lista quiz (filtrabile per categoria)
  - `GET /api/quizzes/:id` → dettaglio quiz (senza rivelare quale risposta è corretta, se destinato al giocatore)
  - `POST /api/quizzes/:id/questions` → aggiunge una domanda al quiz
  - `POST /api/questions/:id/answers` → aggiunge opzioni di risposta a una domanda
- Validazione:
  - ogni domanda deve avere almeno 2 opzioni di risposta
  - deve esistere **esattamente una** risposta marcata come `is_correct = true` per domanda (in caso di scelta multipla)
- Nelle risposte dell'API destinate al gameplay, **non esporre mai `is_correct`** al client prima che l'utente abbia risposto (evitare cheating)

---

## TASK 5 — Il Gioco (10 step / 10 domande)

### Requisiti funzionali

- L'utente autenticato sceglie una categoria e avvia una partita.
- Il sistema seleziona **10 domande casuali** appartenenti a quella categoria (da uno o più quiz della categoria).
- L'utente risponde domanda per domanda (10 step in sequenza).
- Al termine, il sistema calcola il punteggio totale e lo salva nel registro punteggi (tabella `score`), collegato all'utente.
- L'utente riceve un riepilogo finale (punteggio ottenuto / punteggio massimo, eventualmente tempo impiegato).

### Requisiti tecnici

- Endpoint suggeriti (approccio "sessione di gioco"):
  - `POST /api/game/start` → riceve `category_id`, restituisce 10 domande (senza risposta corretta) e un `game_session_id`
  - `POST /api/game/:session_id/answer` → riceve `question_id` + `answer_id` scelto, restituisce se corretto/sbagliato e passa allo step successivo
  - `POST /api/game/:session_id/finish` → chiude la sessione, calcola punteggio finale e salva su `score`
- Se non si vuole gestire uno stato di sessione lato server, alternativa più semplice per uno stagista:
  - `POST /api/game/start?category_id=X` → restituisce array di 10 domande con relative opzioni (senza indicare quale è corretta)
  - Il client risponde a tutte e 10, poi invia un unico payload con tutte le risposte:
  - `POST /api/game/submit` → riceve array `{question_id, answer_id}` x10, verifica lato server quali sono corrette, calcola punteggio, salva su `score`, e restituisce il dettaglio (corrette/sbagliate)
- Logica di selezione casuale delle domande: query SQL con `ORDER BY RAND()` (MySQL) o `ORDER BY RANDOM()` (PostgreSQL) con `LIMIT 10`, filtrando per categoria tramite il quiz collegato
- Se la categoria ha meno di 10 domande disponibili, gestire il caso con un messaggio di errore chiaro
- La verifica della risposta corretta deve avvenire **sempre lato server**, mai fidandosi del client

---

## TASK 6 — Registro Punteggi

### Requisiti funzionali

- Ogni utente deve poter consultare lo storico delle proprie partite (punteggio, quiz/categoria, data).
- (Opzionale) Classifica generale o per categoria.

### Requisiti tecnici

- Endpoint:
  - `GET /api/scores/me` → storico punteggi dell'utente autenticato (richiede token)
  - `GET /api/scores/leaderboard?category_id=X` (opzionale) → classifica ordinata per punteggio decrescente
- I dati salvati in `score` devono includere: `user_id`, `quiz_id` (o `category_id`), `score_obtained`, `max_score`, `completed_at`

---

## TASK 7 — Validazione, Error Handling e Sicurezza

### Requisiti funzionali

- Il sistema deve rispondere in modo chiaro e coerente in caso di errore (input mancante, non autorizzato, risorsa non trovata).

### Requisiti tecnici

- Middleware centralizzato di gestione errori (`errorHandler`) che restituisce risposte JSON uniformi, es:
  ```json
  { "success": false, "message": "Descrizione errore" }
  ```
- Status code HTTP corretti: 200/201 successo, 400 bad request, 401 unauthorized, 403 forbidden, 404 not found, 409 conflict, 500 errore server
- Protezione delle rotte di gioco e punteggio con `authMiddleware`
- Non esporre mai password (nemmeno hashata) nelle risposte API
- (Consigliato) Rate limiting base sulle rotte di login per prevenire brute force (es. `express-rate-limit`)

---

## TASK 8 — Testing

### Requisiti funzionali

- Le funzionalità principali (registrazione, login, avvio gioco, invio risposte, punteggio) devono essere verificabili automaticamente.

### Requisiti tecnici

- Framework di test: **Jest** + **Supertest** per testare gli endpoint Express
- Almeno un test per:
  - registrazione utente (successo + email duplicata)
  - login (successo + credenziali errate)
  - avvio gioco (10 domande restituite, categoria inesistente gestita)
  - invio risposte e calcolo punteggio corretto

---

## TASK 9 — Documentazione API

### Requisiti funzionali

- Deve esistere una documentazione consultabile di tutti gli endpoint disponibili.

### Requisiti tecnici

- Documentazione tramite **Postman Collection** (esportata come JSON) oppure **Swagger/OpenAPI** (consigliato `swagger-jsdoc` + `swagger-ui-express`)
- Deve includere: metodo, path, body richiesto, esempio di risposta, se richiede autenticazione

---

## Riepilogo stack tecnico consigliato

| Ambito         | Tecnologia              |
| -------------- | ----------------------- |
| Runtime        | Node.js (LTS)           |
| Framework      | Express.js              |
| Database       | MySQL o PostgreSQL      |
| ORM            | Sequelize (o Knex.js)   |
| Autenticazione | JWT + bcrypt            |
| Validazione    | Joi / express-validator |
| Testing        | Jest + Supertest        |
| Documentazione | Swagger / Postman       |
| Config         | dotenv                  |

## Criteri di completamento (Definition of Done)

- [ ] Utente può registrarsi e loggarsi, ricevendo un token valido
- [ ] Rotte di gioco protette da autenticazione
- [ ] Quiz/domande/risposte gestibili via API con categoria associata
- [ ] Una partita restituisce esattamente 10 domande di una categoria scelta
- [ ] Il punteggio finale viene calcolato lato server e salvato correttamente
- [ ] L'utente può consultare il proprio storico punteggi
- [ ] Password mai esposte, risposta corretta mai esposta prima del completamento della domanda
- [ ] Test automatici superati per i flussi principali
- [ ] Documentazione API disponibile
