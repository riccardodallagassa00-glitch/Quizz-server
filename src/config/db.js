require("dotenv").config();

// Pool = un gruppo di connessioni al database già aperte, riutilizzate a ogni query
// invece di aprirne una nuova per ogni richiesta (molto più efficiente)
const { Pool } = require("pg");

if (!process.env.DATABASE_URL) {
  // Meglio fermarsi subito con un errore chiaro che scoprire il problema più avanti
  throw new Error("Manca la variabile DATABASE_URL nel file .env");
}

// Creo il pool una sola volta: tutto il progetto importerà questo stesso oggetto
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // Neon richiede una connessione cifrata (SSL)
});

module.exports = pool;
