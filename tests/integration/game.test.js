// Test automatici per l'avvio del gioco e l'invio delle risposte (TASK 8).
const request = require("supertest");
const createApp = require("../../main.js");
const pool = require("../../src/config/db.js");

const app = createApp();
const suffisso = Date.now();

let token;

// Registro e faccio login con un utente dedicato SOLO a questi test, prima di tutto il resto
beforeAll(async () => {
  const utente = {
    username: `test_game_${suffisso}`,
    email: `test_game_${suffisso}@example.com`,
    password: "password123",
  };
  await request(app).post("/api/auth/register").send(utente);
  const login = await request(app).post("/api/auth/login").send({
    identifier: utente.username,
    password: utente.password,
  });
  token = login.body.token;
});

afterAll(async () => {
  await pool.end();
});

describe("POST /api/game/start", () => {
  test("categoria valida -> 200, esattamente 10 domande, nessuna rivela is_correct", async () => {
    // Uso la categoria "Geografia" del seed originale (TASK 1), che ha sicuramente 10+ domande
    const categorie = await request(app).get("/api/categories");
    const geografia = categorie.body.find((c) => c.name === "Geografia");
    expect(geografia).toBeDefined();

    const risposta = await request(app)
      .post(`/api/game/start?category_id=${geografia.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(risposta.status).toBe(200);
    expect(risposta.body.questions).toHaveLength(10);

    // Nessuna opzione di risposta deve mai rivelare quale sia quella corretta
    for (const domanda of risposta.body.questions) {
      for (const opzione of domanda.answers) {
        expect(opzione.is_correct).toBeUndefined();
      }
    }
  });

  test("categoria senza abbastanza domande -> 400", async () => {
    // Creo una categoria nuova e vuota apposta per questo test: ha garantito zero domande
    const nuovaCategoria = await request(app)
      .post("/api/categories")
      .send({ name: `Categoria vuota test ${suffisso}` });

    const risposta = await request(app)
      .post(`/api/game/start?category_id=${nuovaCategoria.body.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(risposta.status).toBe(400);
    expect(risposta.body.success).toBe(false);
  });

  test("senza token -> 401", async () => {
    const risposta = await request(app).post("/api/game/start?category_id=1");
    expect(risposta.status).toBe(401);
  });

  test("category_id che non esiste proprio nel database -> 400, gestito senza crash", async () => {
    // 999999999 è un id quasi certamente mai assegnato a nessuna categoria vera
    const risposta = await request(app)
      .post("/api/game/start?category_id=999999999")
      .set("Authorization", `Bearer ${token}`);

    expect(risposta.status).toBe(400);
    expect(risposta.body.success).toBe(false);
  });
});

describe("POST /api/game/submit", () => {
  test("rispondendo correttamente a tutte le domande, il punteggio è 10/10", async () => {
    const categorie = await request(app).get("/api/categories");
    const geografia = categorie.body.find((c) => c.name === "Geografia");

    const start = await request(app)
      .post(`/api/game/start?category_id=${geografia.id}`)
      .set("Authorization", `Bearer ${token}`);

    const domande = start.body.questions;

    // L'API non rivela MAI quale risposta è corretta (per non far imbrogliare il giocatore):
    // qui, SOLO perché stiamo scrivendo un test che deve conoscere "la verità", la leggo
    // direttamente dal database tramite il pool — cosa che un client esterno non potrebbe mai fare
    const answers = [];
    for (const domanda of domande) {
      const { rows } = await pool.query(
        "SELECT id FROM answer WHERE question_id = $1 AND is_correct = true",
        [domanda.id],
      );
      answers.push({ question_id: domanda.id, answer_id: rows[0].id });
    }

    const risposta = await request(app)
      .post("/api/game/submit")
      .set("Authorization", `Bearer ${token}`)
      .send({ category_id: geografia.id, answers });

    expect(risposta.status).toBe(201);
    expect(risposta.body.score_obtained).toBe(10);
    expect(risposta.body.max_score).toBe(10);
  });

  test("meno di 10 risposte -> 400", async () => {
    const risposta = await request(app)
      .post("/api/game/submit")
      .set("Authorization", `Bearer ${token}`)
      .send({ category_id: 1, answers: [{ question_id: 1, answer_id: 1 }] });

    expect(risposta.status).toBe(400);
    expect(risposta.body.success).toBe(false);
  });
});
