// UNIT TEST per game.controller.js: la parte più importante da isolare con i mock, perché
// permette di testare in modo DIRETTO e DETERMINISTICO la protezione anti-imbroglio e il
// calcolo del punteggio, senza dipendere da quali domande/risposte "casuali" arrivano davvero
// da Postgres (che cambiano ad ogni esecuzione, con ORDER BY RANDOM()).
const gameRepositories = require("../../src/repositories/gameRepositories.js");
const answerRepositories = require("../../src/repositories/answerRepositories.js");
const scoreRepositories = require("../../src/repositories/scoreRepositories.js");

jest.mock("../../src/repositories/gameRepositories.js");
jest.mock("../../src/repositories/answerRepositories.js");
jest.mock("../../src/repositories/scoreRepositories.js");

const {
  startGame,
  submitGame,
} = require("../../src/controllers/game.controller.js");

function creaRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

// 10 domande finte, numerate da 1 a 10. Per ogni domanda, la risposta "corretta" è quella
// con id = domandaId * 10 (una convenzione solo per questo test, per calcolare a mano
// il punteggio atteso senza ambiguità)
const domandeFinte = Array.from({ length: 10 }, (_, i) => ({
  id: i + 1,
  text: `Domanda ${i + 1}`,
}));

beforeEach(() => {
  jest.clearAllMocks();
  answerRepositories.getByQuestionId.mockImplementation(async (id) => [
    { id: id * 10, text: "Opzione corretta" },
    { id: id * 10 + 1, text: "Opzione sbagliata" },
  ]);
});

describe("game.controller - startGame (unit)", () => {
  test("categoria con 10 domande disponibili -> 200, 10 domande, senza is_correct", async () => {
    gameRepositories.getRandomQuestions.mockResolvedValue(domandeFinte);

    const req = { query: { category_id: "1" } };
    const res = creaRes();
    const next = jest.fn();

    await startGame(req, res, next);

    const corpo = res.json.mock.calls[0][0];
    expect(corpo.questions).toHaveLength(10);
    expect(
      corpo.questions.every((q) =>
        q.answers.every((a) => a.is_correct === undefined),
      ),
    ).toBe(true);
  });

  test("categoria con meno di 10 domande -> next() con AppError 400", async () => {
    gameRepositories.getRandomQuestions.mockResolvedValue([
      { id: 1, text: "Unica domanda" },
    ]);

    const req = { query: { category_id: "2" } };
    const res = creaRes();
    const next = jest.fn();

    await startGame(req, res, next);

    expect(next.mock.calls[0][0].statusCode).toBe(400);
  });
});

describe("game.controller - submitGame (unit)", () => {
  // Simula la verifica delle risposte: quelle che finiscono per "x0" (es. 10, 20, 30) sono corrette,
  // in base alla nostra convenzione sopra
  beforeEach(() => {
    gameRepositories.verifyAnswers.mockImplementation(async (ids) =>
      ids.map((id) => ({
        id,
        question_id: Math.floor(id / 10),
        is_correct: id % 10 === 0,
      })),
    );
    scoreRepositories.create.mockResolvedValue({ id: 1 });
  });

  test("tutte le risposte corrette -> score_obtained 10/10, salvato con lo user_id giusto", async () => {
    const risposte = domandeFinte.map((d) => ({
      question_id: d.id,
      answer_id: d.id * 10,
    }));
    const req = {
      body: { category_id: 1, answers: risposte },
      user: { id: 42 },
    };
    const res = creaRes();
    const next = jest.fn();

    await submitGame(req, res, next);

    const corpo = res.json.mock.calls[0][0];
    expect(corpo.score_obtained).toBe(10);
    expect(scoreRepositories.create).toHaveBeenCalledWith(
      expect_oggetto_con_user_id_42(),
    );
  });

  test("3 risposte sbagliate su 10 -> score_obtained 7/10", async () => {
    const risposte = domandeFinte.map((d, i) => ({
      question_id: d.id,
      answer_id: i < 3 ? d.id * 10 + 1 : d.id * 10, // le prime 3 sono quelle "sbagliate" (finiscono per 1)
    }));
    const req = {
      body: { category_id: 1, answers: risposte },
      user: { id: 42 },
    };
    const res = creaRes();
    const next = jest.fn();

    await submitGame(req, res, next);

    const corpo = res.json.mock.calls[0][0];
    expect(corpo.score_obtained).toBe(7);
  });

  test("PROTEZIONE ANTI-IMBROGLIO: answer_id preso da un'altra domanda -> 400", async () => {
    const risposteOneste = domandeFinte.map((d) => ({
      question_id: d.id,
      answer_id: d.id * 10,
    }));
    // "Sabotaggio": l'answer_id della domanda 1 (id 10) lo dichiaro come risposta alla domanda 2
    const risposteImbroglio = [...risposteOneste];
    risposteImbroglio[1] = {
      question_id: domandeFinte[1].id,
      answer_id: domandeFinte[0].id * 10,
    };

    const req = {
      body: { category_id: 1, answers: risposteImbroglio },
      user: { id: 42 },
    };
    const res = creaRes();
    const next = jest.fn();

    await submitGame(req, res, next);

    expect(next.mock.calls[0][0].statusCode).toBe(400);
    expect(next.mock.calls[0][0].message).toMatch(/non appartiene/);
    // il punteggio non deve MAI essere salvato se la richiesta è sospetta
    expect(scoreRepositories.create).not.toHaveBeenCalled();
  });

  test("meno di 10 risposte inviate -> 400, verifyAnswers MAI chiamato (si ferma prima)", async () => {
    const req = {
      body: { category_id: 1, answers: [{ question_id: 1, answer_id: 10 }] },
      user: { id: 42 },
    };
    const res = creaRes();
    const next = jest.fn();

    await submitGame(req, res, next);

    expect(next.mock.calls[0][0].statusCode).toBe(400);
    expect(gameRepositories.verifyAnswers).not.toHaveBeenCalled();
  });
});

// Piccolo "matcher" di comodo per verificare solo il campo user_id, ignorando gli altri
function expect_oggetto_con_user_id_42() {
  return expect.objectContaining({ user_id: 42 });
}
