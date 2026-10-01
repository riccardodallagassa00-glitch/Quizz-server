// Query SQL per la tabella "score".
// Un punteggio, una volta registrato, non si modifica: per questo qui non c'è "update".
const pool = require("../config/db.js");

async function getById(id) {
  const { rows } = await pool.query(
    "SELECT id, user_id, category_id, score_obtained, max_score, completed_at FROM score WHERE id = $1",
    [id],
  );
  return rows[0];
}

// Storico di un utente, dal più recente. Il JOIN unisce la tabella category per avere anche il nome
// della categoria (c.name) e non solo il suo id.
async function getByUserId(userId) {
  const { rows } = await pool.query(
    `SELECT s.id, s.category_id, c.name AS category_name, s.score_obtained, s.max_score, s.completed_at
     FROM score s
     JOIN category c ON c.id = s.category_id
     WHERE s.user_id = $1
     ORDER BY s.completed_at DESC`,
    [userId],
  );
  return rows;
}

async function create({ user_id, category_id, score_obtained, max_score }) {
  const { rows } = await pool.query(
    `INSERT INTO score (user_id, category_id, score_obtained, max_score)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [user_id, category_id, score_obtained, max_score],
  );
  return rows[0];
}

async function remove(id) {
  const { rows } = await pool.query(
    "DELETE FROM score WHERE id = $1 RETURNING *",
    [id],
  );
  return rows[0];
}
// Classifica DI UNA SINGOLA CATEGORIA: per ogni utente, il suo MIGLIOR punteggio in quella categoria
// (non la somma: se uno ha giocato 5 volte, conta il tentativo migliore, non la somma di tutti)
async function getLeaderboardByCategory(categoryId, limit = 10) {
  const { rows } = await pool.query(
    `SELECT u.username, MAX(s.score_obtained) AS best_score, MAX(s.max_score) AS max_score
     FROM score s
     JOIN users u ON u.id = s.user_id
     WHERE s.category_id = $1
     GROUP BY u.username
     ORDER BY best_score DESC
     LIMIT $2`,
    [categoryId, limit],
  );
  return rows;
}

// Classifica GENERALE (nessun filtro per categoria): somma di TUTTI i punteggi di ogni utente,
// su tutte le categorie in cui ha giocato, più quante partite ha fatto in totale
async function getOverallLeaderboard(limit = 10) {
  const { rows } = await pool.query(
    `SELECT u.username, SUM(s.score_obtained) AS total_score, COUNT(*) AS partite_giocate
     FROM score s
     JOIN users u ON u.id = s.user_id
     GROUP BY u.id, u.username
     ORDER BY total_score DESC
     LIMIT $1`,
    [limit],
  );
  return rows;
}

module.exports = {
  getById,
  getByUserId,
  create,
  remove,
  getLeaderboardByCategory,
  getOverallLeaderboard,
};
