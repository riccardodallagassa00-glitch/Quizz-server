// Configurazione di swagger-jsdoc: legge i commenti "@swagger" sparsi nei file di rotte
// (indicati sotto in "apis") e li assembla in un unico documento OpenAPI.
// swagger-ui-express userà questo documento per generare la pagina interattiva su /api-docs.
const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Sistema Quiz — API",
      version: "1.0.0",
      description:
        "Backend Node.js/Express per un sistema di quiz: registrazione e login (JWT), " +
        "gestione di categorie/quiz/domande/risposte, il gioco (10 domande casuali, " +
        "punteggio calcolato lato server), storico e classifica dei punteggi.",
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Server locale di sviluppo",
      },
    ],
    components: {
      // Definisce UNA VOLTA SOLA come si autentica una richiesta: un token JWT nell'header
      // Authorization. Le singole rotte protette la richiamano con "security: [bearerAuth: []]"
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description:
            "Token ottenuto da POST /api/auth/login. Va incluso come: Authorization: Bearer <token>",
        },
      },
      // Schemi riusabili: evitano di riscrivere la stessa struttura in ogni singola rotta
      schemas: {
        ErroreGenerico: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            message: { type: "string", example: "Descrizione dell'errore" },
          },
        },
        Utente: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            username: { type: "string", example: "mario" },
            email: { type: "string", example: "mario@example.com" },
            created_at: { type: "string", format: "date-time" },
          },
        },
        Categoria: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            name: { type: "string", example: "Geografia" },
          },
        },
      },
    },
  },
  // swagger-jsdoc apre questi file e cerca i commenti che iniziano con "@swagger"
  apis: ["./src/routes/*.js"],
};

module.exports = swaggerJsdoc(options);
