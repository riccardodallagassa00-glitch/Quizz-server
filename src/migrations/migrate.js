// Esegue in ordine gli script .sql della cartella db/migrations, saltando quelli già eseguiti
const fs = require("fs");
const path = require("path");
const pool = require("../config/db.js");

async function migrate() {
  // prendo UNA connessione dal pool: mi serve per eseguire BEGIN/COMMIT sulla stessa connessione
  const client = await pool.connect();
  try {
    // tabella-registro: ricorda i nomi degli script già eseguiti
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        filename    VARCHAR(255) PRIMARY KEY,
        executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // leggo dal registro quali script sono già stati eseguiti
    const { rows } = await client.query(
      "SELECT filename FROM schema_migrations",
    );
    const eseguiti = new Set(rows.map((r) => r.filename));

    // elenco i file .sql e li ordino per nome (01_, 02_, ...)
    const cartella = path.join(__dirname, "migrations");
    const files = fs
      .readdirSync(cartella)
      .filter((f) => f.endsWith(".sql"))
      .sort();

    for (const file of files) {
      if (eseguiti.has(file)) {
        console.log(`Già eseguito: ${file}`);
        continue;
      }

      const sql = fs.readFileSync(path.join(cartella, file), "utf8");

      try {
        // transazione: o lo script riesce per intero, o non cambia niente
        await client.query("BEGIN");
        await client.query(sql);
        await client.query(
          "INSERT INTO schema_migrations (filename) VALUES ($1)",
          [file],
        );
        await client.query("COMMIT");
        console.log(`Eseguito: ${file}`);
      } catch (errore) {
        await client.query("ROLLBACK"); // annullo tutto quello che lo script aveva fatto
        throw new Error(`Errore in ${file}: ${errore.message}`);
      }
    }

    console.log("Migrazioni completate.");
  } catch (errore) {
    console.error(errore.message);
    process.exitCode = 1;
  } finally {
    client.release(); // restituisco la connessione al pool
    await pool.end(); // chiudo il pool, altrimenti lo script resterebbe appeso
  }
}

migrate();
