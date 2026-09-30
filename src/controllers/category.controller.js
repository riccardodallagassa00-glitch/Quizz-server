// Logica delle rotte /api/categories. Le query sono in src/repositories/categoryRepositories.js.
const categoryRepositories = require("../repositories/categoryRepositories.js");
const parseId = require("../utils/parseId.js");

// GET /api/categories
async function getCategories(req, res) {
  try {
    const categorie = await categoryRepositories.getAll();
    res.json(categorie);
  } catch (errore) {
    console.error("Errore in getCategories:", errore.message);
    res.status(500).json({ errore: "Errore interno del server" });
  }
}

// GET /api/categories/:id
async function getCategory(req, res) {
  const id = parseId(req.params.id);
  if (id === null) {
    return res
      .status(400)
      .json({ errore: "ID non valido: deve essere un numero intero positivo" });
  }

  try {
    const categoria = await categoryRepositories.getById(id);
    if (!categoria) {
      return res.status(404).json({ errore: "Categoria non trovata" });
    }
    res.json(categoria);
  } catch (errore) {
    console.error("Errore in getCategory:", errore.message);
    res.status(500).json({ errore: "Errore interno del server" });
  }
}

// POST /api/categories
async function createCategory(req, res) {
  const { name } = req.body;

  // "obbligatorio": deve esserci ed essere una stringa non vuota (dopo aver tolto gli spazi)
  if (!name || typeof name !== "string" || !name.trim()) {
    return res
      .status(400)
      .json({ errore: "Il nome della categoria è obbligatorio" });
  }

  try {
    const nuovaCategoria = await categoryRepositories.create(name.trim());
    res.status(201).json(nuovaCategoria);
  } catch (errore) {
    // "univoco": il vincolo UNIQUE nello schema SQL blocca i doppioni; qui intercettiamo l'errore
    if (errore.code === "23505") {
      return res
        .status(409)
        .json({ errore: "Esiste già una categoria con questo nome" });
    }
    console.error("Errore in createCategory:", errore.message);
    res.status(500).json({ errore: "Errore interno del server" });
  }
}

// PUT /api/categories/:id
async function updateCategory(req, res) {
  const id = parseId(req.params.id);
  if (id === null) {
    return res
      .status(400)
      .json({ errore: "ID non valido: deve essere un numero intero positivo" });
  }

  const { name } = req.body;
  if (!name || typeof name !== "string" || !name.trim()) {
    return res
      .status(400)
      .json({ errore: "Il nome della categoria è obbligatorio" });
  }

  try {
    const categoria = await categoryRepositories.update(id, name.trim());
    if (!categoria) {
      return res.status(404).json({ errore: "Categoria non trovata" });
    }
    res.json(categoria);
  } catch (errore) {
    if (errore.code === "23505") {
      return res
        .status(409)
        .json({ errore: "Esiste già una categoria con questo nome" });
    }
    console.error("Errore in updateCategory:", errore.message);
    res.status(500).json({ errore: "Errore interno del server" });
  }
}

// DELETE /api/categories/:id
async function deleteCategory(req, res) {
  const id = parseId(req.params.id);
  if (id === null) {
    return res
      .status(400)
      .json({ errore: "ID non valido: deve essere un numero intero positivo" });
  }

  try {
    const rimossa = await categoryRepositories.remove(id);
    if (!rimossa) {
      return res.status(404).json({ errore: "Categoria non trovata" });
    }
    res.json({ messaggio: "Categoria eliminata", categoria: rimossa });
  } catch (errore) {
    console.error("Errore in deleteCategory:", errore.message);
    res.status(500).json({ errore: "Errore interno del server" });
  }
}

module.exports = {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
};
