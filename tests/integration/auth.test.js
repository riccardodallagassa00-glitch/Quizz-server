// Test automatici per registrazione e login (TASK 8).
// Usano lo stesso database di sviluppo: ogni test crea dati con nomi univoci (basati sull'orario),
// così non entrano mai in conflitto con dati già esistenti o con esecuzioni precedenti dei test.
const request = require("supertest");
const createApp = require("../../main.js");
const pool = require("../../src/config/db.js");

const app = createApp();
const suffisso = Date.now(); // numero diverso ogni volta che lanci i test

// Chiudo il pool di connessioni alla fine di QUESTO file: Jest isola ogni file di test
// con una propria copia dei moduli, quindi ogni file ha il proprio pool da chiudere,
// altrimenti Jest segnala un "handle aperto" e non termina da solo.
afterAll(async () => {
  await pool.end();
});

describe("POST /api/auth/register", () => {
  const utente = {
    username: `test_register_${suffisso}`,
    email: `test_register_${suffisso}@example.com`,
    password: "password123",
  };

  test("registrazione valida -> 201, utente creato senza password nella risposta", async () => {
    const risposta = await request(app).post("/api/auth/register").send(utente);
    expect(risposta.status).toBe(201);
    expect(risposta.body.username).toBe(utente.username);
    expect(risposta.body.password).toBeUndefined();
  });

  test("email già registrata -> 409", async () => {
    // Stessa email del test precedente, ma username diverso: deve comunque fallire,
    // perché il vincolo UNIQUE sull'email scatta a prescindere dallo username
    const risposta = await request(app)
      .post("/api/auth/register")
      .send({
        username: `${utente.username}_bis`,
        email: utente.email,
        password: "password123",
      });
    expect(risposta.status).toBe(409);
    expect(risposta.body.success).toBe(false);
  });
});

describe("POST /api/auth/login", () => {
  const utente = {
    username: `test_login_${suffisso}`,
    email: `test_login_${suffisso}@example.com`,
    password: "password123",
  };

  // Prima di testare il login, registro un utente apposta: così questo test non dipende
  // da nessun utente creato manualmente in precedenza (es. durante le prove in Postman)
  beforeAll(async () => {
    await request(app).post("/api/auth/register").send(utente);
  });

  test("login con credenziali corrette -> 200 + token", async () => {
    const risposta = await request(app).post("/api/auth/login").send({
      identifier: utente.username,
      password: utente.password,
    });
    expect(risposta.status).toBe(200);
    expect(typeof risposta.body.token).toBe("string");
    expect(risposta.body.user.username).toBe(utente.username);
  });

  test("login con password sbagliata -> 401", async () => {
    const risposta = await request(app).post("/api/auth/login").send({
      identifier: utente.username,
      password: "password-sbagliata",
    });
    expect(risposta.status).toBe(401);
    expect(risposta.body.success).toBe(false);
  });
});
