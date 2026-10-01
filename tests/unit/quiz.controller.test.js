// UNIT TEST per quiz.controller.js: qui verifichiamo in particolare che la VALIDAZIONE
// avvenga PRIMA di aprire qualsiasi transazione sul database (quizRepositories.createFull
// non deve mai essere chiamato se i dati sono scorretti).
const quizRepositories = require("../../src/repositories/quizRepositories.js");

jest.mock("../../src/repositories/quizRepositories.js");
jest.mock("../../src/repositories/questionRepositories.js");
jest.mock("../../src/repositories/answerRepositories.js");

const { createQuiz } = require("../../src/controllers/quiz.controller.js");

function creaRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe("quiz.controller - createQuiz, validazione (unit)", () => {
  beforeEach(() => jest.clearAllMocks());

  test("2 risposte corrette sulla stessa domanda -> 400, createFull MAI chiamato", async () => {
    const req = {
      body: {
        title: "Quiz test",
        category_id: 1,
        questions: [
          {
            text: "D",
            answers: [
              { text: "A", is_correct: true },
              { text: "B", is_correct: true },
            ],
          },
        ],
      },
    };
    const res = creaRes();
    const next = jest.fn();

    await createQuiz(req, res, next);

    expect(next.mock.calls[0][0].statusCode).toBe(400);
    expect(quizRepositories.createFull).not.toHaveBeenCalled();
  });

  test("meno di 2 opzioni di risposta -> 400, createFull MAI chiamato", async () => {
    const req = {
      body: {
        title: "Quiz test",
        category_id: 1,
        questions: [
          { text: "D", answers: [{ text: "Unica", is_correct: true }] },
        ],
      },
    };
    const res = creaRes();
    const next = jest.fn();

    await createQuiz(req, res, next);

    expect(next.mock.calls[0][0].statusCode).toBe(400);
    expect(quizRepositories.createFull).not.toHaveBeenCalled();
  });

  test("quiz completo valido -> 201, createFull chiamato una volta con i dati corretti", async () => {
    quizRepositories.createFull.mockResolvedValue({
      id: 1,
      title: "Quiz ok",
      category_id: 1,
      questions: [],
    });

    const req = {
      body: {
        title: "Quiz ok",
        category_id: 1,
        questions: [
          {
            text: "D",
            answers: [
              { text: "A", is_correct: false },
              { text: "B", is_correct: true },
            ],
          },
        ],
      },
    };
    const res = creaRes();
    const next = jest.fn();

    await createQuiz(req, res, next);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(quizRepositories.createFull).toHaveBeenCalledTimes(1);
  });

  test("quiz minimo (senza 'questions') -> 201, usa create() invece di createFull()", async () => {
    quizRepositories.create.mockResolvedValue({
      id: 1,
      title: "Minimo",
      category_id: 1,
    });

    const req = { body: { title: "Minimo", category_id: 1 } };
    const res = creaRes();
    const next = jest.fn();

    await createQuiz(req, res, next);

    expect(quizRepositories.create).toHaveBeenCalledTimes(1);
    expect(quizRepositories.createFull).not.toHaveBeenCalled();
  });
});
