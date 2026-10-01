// UNIT TEST per category.controller.js, con categoryRepositories mockato.
const categoryRepositories = require("../../src/repositories/categoryRepositories.js");

jest.mock("../../src/repositories/categoryRepositories.js");

const {
  getCategory,
  createCategory,
} = require("../../src/controllers/category.controller.js");

function creaRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe("category.controller - getCategory (unit)", () => {
  beforeEach(() => jest.clearAllMocks());

  test("id esistente -> 200 con i dati della categoria", async () => {
    categoryRepositories.getById.mockResolvedValue({
      id: 1,
      name: "Geografia",
    });

    const req = { params: { id: "1" } };
    const res = creaRes();
    const next = jest.fn();

    await getCategory(req, res, next);

    expect(res.json).toHaveBeenCalledWith({ id: 1, name: "Geografia" });
  });

  test("id inesistente -> next() con AppError 404", async () => {
    categoryRepositories.getById.mockResolvedValue(undefined);

    const req = { params: { id: "999" } };
    const res = creaRes();
    const next = jest.fn();

    await getCategory(req, res, next);

    expect(next.mock.calls[0][0].statusCode).toBe(404);
  });

  test("id malformato -> next() con AppError 400, repository MAI interpellato", async () => {
    const req = { params: { id: "abc" } };
    const res = creaRes();
    const next = jest.fn();

    await getCategory(req, res, next);

    expect(next.mock.calls[0][0].statusCode).toBe(400);
    expect(categoryRepositories.getById).not.toHaveBeenCalled();
  });
});

describe("category.controller - createCategory (unit)", () => {
  beforeEach(() => jest.clearAllMocks());

  test("nome vuoto -> 400, repository.create MAI chiamato", async () => {
    const req = { body: { name: "   " } };
    const res = creaRes();
    const next = jest.fn();

    await createCategory(req, res, next);

    expect(next.mock.calls[0][0].statusCode).toBe(400);
    expect(categoryRepositories.create).not.toHaveBeenCalled();
  });

  test("nome valido -> 201, repository.create chiamato con il nome ripulito dagli spazi", async () => {
    categoryRepositories.create.mockResolvedValue({ id: 5, name: "Storia" });

    const req = { body: { name: "  Storia  " } };
    const res = creaRes();
    const next = jest.fn();

    await createCategory(req, res, next);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(categoryRepositories.create).toHaveBeenCalledWith("Storia"); // senza gli spazi iniziali/finali
  });
});
