const categoryRepositories = require("../repositories/categoryRepositories.js");
const parseId = require("../utils/parseId.js");
const AppError = require("../utils/AppError.js");

async function getCategories(req, res, next) {
  try {
    const categorie = await categoryRepositories.getAll();
    res.json(categorie);
  } catch (errore) {
    next(errore);
  }
}

async function getCategory(req, res, next) {
  try {
    const id = parseId(req.params.id);
    if (id === null) {
      throw new AppError(
        400,
        "ID non valido: deve essere un numero intero positivo",
      );
    }
    const categoria = await categoryRepositories.getById(id);
    if (!categoria) {
      throw new AppError(404, "Categoria non trovata");
    }
    res.json(categoria);
  } catch (errore) {
    next(errore);
  }
}

async function createCategory(req, res, next) {
  try {
    const { name } = req.body;
    if (!name || typeof name !== "string" || !name.trim()) {
      throw new AppError(400, "Il nome della categoria è obbligatorio");
    }
    const nuovaCategoria = await categoryRepositories.create(name.trim());
    res.status(201).json(nuovaCategoria);
  } catch (errore) {
    next(errore);
  }
}

async function updateCategory(req, res, next) {
  try {
    const id = parseId(req.params.id);
    if (id === null) {
      throw new AppError(
        400,
        "ID non valido: deve essere un numero intero positivo",
      );
    }
    const { name } = req.body;
    if (!name || typeof name !== "string" || !name.trim()) {
      throw new AppError(400, "Il nome della categoria è obbligatorio");
    }
    const categoria = await categoryRepositories.update(id, name.trim());
    if (!categoria) {
      throw new AppError(404, "Categoria non trovata");
    }
    res.json(categoria);
  } catch (errore) {
    next(errore);
  }
}

async function deleteCategory(req, res, next) {
  try {
    const id = parseId(req.params.id);
    if (id === null) {
      throw new AppError(
        400,
        "ID non valido: deve essere un numero intero positivo",
      );
    }
    const rimossa = await categoryRepositories.remove(id);
    if (!rimossa) {
      throw new AppError(404, "Categoria non trovata");
    }
    res.json({ messaggio: "Categoria eliminata", categoria: rimossa });
  } catch (errore) {
    next(errore);
  }
}

module.exports = {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
};
