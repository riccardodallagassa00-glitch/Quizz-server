// Solo dati, nessuna logica: 2 categorie, ognuna con 2 quiz da 5 domande (10 domande per categoria).
// "correct" è la posizione (partendo da 0) della risposta giusta dentro "options".
module.exports = [
  {
    name: "Geografia",
    quizzes: [
      {
        title: "Capitali d'Europa",
        questions: [
          {
            text: "Qual è la capitale della Spagna?",
            options: ["Barcellona", "Madrid", "Siviglia", "Valencia"],
            correct: 1,
          },
          {
            text: "Qual è la capitale della Germania?",
            options: ["Monaco", "Amburgo", "Berlino", "Francoforte"],
            correct: 2,
          },
          {
            text: "Qual è la capitale del Portogallo?",
            options: ["Porto", "Lisbona", "Faro", "Coimbra"],
            correct: 1,
          },
          {
            text: "Qual è la capitale dell'Austria?",
            options: ["Salisburgo", "Graz", "Vienna", "Innsbruck"],
            correct: 2,
          },
          {
            text: "Qual è la capitale della Grecia?",
            options: ["Atene", "Salonicco", "Patrasso", "Rodi"],
            correct: 0,
          },
        ],
      },
      {
        title: "Geografia d'Italia",
        questions: [
          {
            text: "Qual è il fiume più lungo d'Italia?",
            options: ["Tevere", "Po", "Adige", "Arno"],
            correct: 1,
          },
          {
            text: "Qual è la regione italiana più estesa?",
            options: ["Sicilia", "Piemonte", "Lombardia", "Sardegna"],
            correct: 0,
          },
          {
            text: "Qual è il capoluogo della Sardegna?",
            options: ["Sassari", "Cagliari", "Olbia", "Nuoro"],
            correct: 1,
          },
          {
            text: "Qual è il vulcano attivo più alto d'Europa?",
            options: ["Vesuvio", "Stromboli", "Etna", "Vulcano"],
            correct: 2,
          },
          {
            text: "Quale mare bagna la costa orientale della Puglia?",
            options: ["Tirreno", "Ionio", "Adriatico", "Ligure"],
            correct: 2,
          },
        ],
      },
    ],
  },
  {
    name: "Scienza",
    quizzes: [
      {
        title: "Il corpo umano",
        questions: [
          {
            text: "Quante ossa ha un adulto?",
            options: ["106", "206", "306", "412"],
            correct: 1,
          },
          {
            text: "Quale organo pompa il sangue in tutto il corpo?",
            options: ["Fegato", "Polmoni", "Cuore", "Rene"],
            correct: 2,
          },
          {
            text: "Quale vitamina produce la pelle grazie al sole?",
            options: ["Vitamina A", "Vitamina C", "Vitamina D", "Vitamina B12"],
            correct: 2,
          },
          {
            text: "Qual è l'organo più grande del corpo umano?",
            options: ["Fegato", "Pelle", "Intestino", "Cervello"],
            correct: 1,
          },
          {
            text: "Quale gas assorbiamo dall'aria respirando per vivere?",
            options: ["Azoto", "Anidride carbonica", "Ossigeno", "Elio"],
            correct: 2,
          },
        ],
      },
      {
        title: "Il Sistema Solare",
        questions: [
          {
            text: "Qual è il pianeta più vicino al Sole?",
            options: ["Venere", "Mercurio", "Marte", "Terra"],
            correct: 1,
          },
          {
            text: "Qual è il pianeta più grande del Sistema Solare?",
            options: ["Saturno", "Giove", "Nettuno", "Urano"],
            correct: 1,
          },
          {
            text: 'Quale pianeta è chiamato il "pianeta rosso"?',
            options: ["Marte", "Venere", "Giove", "Mercurio"],
            correct: 0,
          },
          {
            text: "Quale pianeta è famoso per i suoi anelli?",
            options: ["Giove", "Urano", "Saturno", "Nettuno"],
            correct: 2,
          },
          {
            text: "Come si chiama il satellite naturale della Terra?",
            options: ["Luna", "Fobos", "Titano", "Europa"],
            correct: 0,
          },
        ],
      },
    ],
  },
];
