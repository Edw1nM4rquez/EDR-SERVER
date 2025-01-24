//Required dot env configuration.
require("dotenv").config();

const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  const htmlResponse = `<hmtl>
<head>
<title> API SLAK</title>
</head>
<body>
<h1>Happy Hacking....</h1>
</body>
 </html>`;
 res.send(htmlResponse);
});
// Ruta para el Slash Command
app.post("/slack-command", async (req, res) => {
  const { text, user_name } = req.body; // 'text' contiene la palabra clave ingresada

  if (!text || text.trim() === "") {
    return res.send("Por favor, proporciona una acción o palabra clave.");
  }

  // Configuración para activar el GitHub Action
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN; // Configura tu token de GitHub
  const REPO = process.env.REPOINFO; // Reemplaza con tu repositorio
  const WORKFLOW_FILE = "main.yml"; // Reemplaza con el nombre del archivo .yml
  const BRANCH = "main"; // Rama desde donde ejecutar el workflow

  try {
    // Llamada a la API de GitHub para disparar el Action
    const response = await axios.post(
      `https://api.github.com/repos/${REPO}/actions/workflows/${WORKFLOW_FILE}/dispatches`,
      {
        ref: BRANCH,
        inputs: { reason: text }, // Opcional: envía el texto como input
      },
      {
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );
    res.send(`Acción '${text}' disparada por ${user_name}.`);
  } catch (error) {
    console.error(
      "Error al disparar el Action:",
      error.response?.data || error.message
    );
    res.send(
      "Error al intentar disparar el Action. Verifica los logs del servidor."
    );
  }
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
