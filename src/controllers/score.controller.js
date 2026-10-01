const scoreRepositories = require("../repositories/scoreRepositories.js");
const parseId = require("../utils/parseId.js");
const AppError = require("../utils/AppError.js");

async function getMyScores(req, res, next) {
  try {
    const storico = await scoreRepositories.getByUserId(req.user.id);
    res.json(storico);
  } catch (errore) {
    next(errore);
  }
}

async function getLeaderboard(req, res, next) {
  try {
    const { category_id } = req.query;

    if (category_id !== undefined) {
      const categoryId = parseId(category_id);
      if (categoryId === null) {
        throw new AppError(
          400,
          "category_id deve essere un numero intero positivo",
        );
      }
      const classifica =
        await scoreRepositories.getLeaderboardByCategory(categoryId);
      return res.json(classifica);
    }

    const classifica = await scoreRepositories.getOverallLeaderboard();
    res.json(classifica);
  } catch (errore) {
    next(errore);
  }
}

module.exports = { getMyScores, getLeaderboard };
