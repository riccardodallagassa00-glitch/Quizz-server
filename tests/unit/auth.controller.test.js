// UNIT TEST per auth.controller.js: il repository e bcrypt vengono "finti" (mock),
// quindi questi test girano in pochi millisecondi e NON toccano il database vero.
// Verificano solo la LOGICA del controller (cosa fa con i risultati del repository),
// non se le query SQL funzionano davvero: per quello servono i test di integrazione.
const userRepositories = require("../../src/repositories/userRepositories.js");
const bcrypt = require("bcrypt");

// jest.mock() sostituisce l'INTERO modulo con una versione finta per tutto questo file.
// Da qui in poi, ogni require("../../src/repositories/userRepositories.js") (anche dentro
// al controller che stiamo per importare) restituirà questo oggetto finto, non quello vero.
jest.mock("../../src/repositories/userRepositories.js");
jest.mock("bcrypt");

const { register, login } = require("../../src/controllers/auth.controller.js");

// Costruisco req/res/next finti, per non dover avviare un vero server Express
function creaRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe("auth.controller - register (unit)", () => {
  beforeEach(() => {
    jest.clearAllMocks(); // azzero il "conteggio chiamate" dei mock prima di ogni test
  });

  test("registrazione valida -> 201, repository.create chiamato una volta", async () => {
    userRepositories.findByEmailOrUsername.mockResolvedValue(undefined); // nessun duplicato
    bcrypt.hash.mockResolvedValue("hash-finto");
    userRepositories.create.mockResolvedValue({
      id: 2,
      username: "mario",
      email: "mario@x.it",
    });

    const req = {
      body: { username: "mario", email: "mario@x.it", password: "password123" },
    };
    const res = creaRes();
    const next = jest.fn();

    await register(req, res, next);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(userRepositories.create).toHaveBeenCalledTimes(1);
    expect(next).not.toHaveBeenCalled(); // nessun errore inoltrato
  });

  test("username o email già esistenti -> next() chiamato con AppError 409, create MAI chiamato", async () => {
    userRepositories.findByEmailOrUsername.mockResolvedValue({ id: 1 }); // trovato un duplicato

    const req = {
      body: { username: "mario", email: "mario@x.it", password: "password123" },
    };
    const res = creaRes();
    const next = jest.fn();

    await register(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    const erroreRicevuto = next.mock.calls[0][0];
    expect(erroreRicevuto.statusCode).toBe(409);
    expect(userRepositories.create).not.toHaveBeenCalled(); // non deve mai arrivare a creare l'utente
  });
});

describe("auth.controller - login (unit)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("credenziali corrette -> 200, risposta con un token", async () => {
    userRepositories.findForLogin.mockResolvedValue({
      id: 1,
      username: "mario",
      email: "mario@x.it",
      password: "hash-finto",
    });
    bcrypt.compare.mockResolvedValue(true);

    const req = { body: { identifier: "mario", password: "password123" } };
    const res = creaRes();
    const next = jest.fn();

    await login(req, res, next);

    expect(res.json).toHaveBeenCalled();
    const corpoRisposta = res.json.mock.calls[0][0];
    expect(typeof corpoRisposta.token).toBe("string");
  });

  test("password sbagliata -> next() chiamato con AppError 401", async () => {
    userRepositories.findForLogin.mockResolvedValue({
      id: 1,
      username: "mario",
      password: "hash-finto",
    });
    bcrypt.compare.mockResolvedValue(false);

    const req = { body: { identifier: "mario", password: "sbagliata" } };
    const res = creaRes();
    const next = jest.fn();

    await login(req, res, next);

    const erroreRicevuto = next.mock.calls[0][0];
    expect(erroreRicevuto.statusCode).toBe(401);
  });
});
