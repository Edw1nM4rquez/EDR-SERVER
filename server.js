//Required dot env configuration.
require("dotenv").config();

const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000;

const SITE_URL = process.env.HOST;
const CHECK_INTERVAL = 60000; // Intervalo para verificar (1 minuto)
const SLACK_WEBHOOK_URL = process.env.SLAKURL;

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
      "Error al intentar disparar el Action. Verifica los logs del servidor.",
      error?.response?.data || error?.message || JSON.stringify(error)
    );
  }
});




// Función para verificar el estado del sitio web
async function checkWebsite() {
  try {
    const response = await axios.get(SITE_URL);
    if (response.status === 200) {
      console.log(`✅ El sitio ${SITE_URL} está funcionando correctamente.`);
    } else {
      console.error(
        `⚠️ El sitio ${SITE_URL} devolvió el estado: ${response.status}`
      );
      // await sendSlackNotification(
      //   `⚠️ El sitio ${SITE_URL} devolvió el estado HTTP ${response.status}.`
      // );
    }
  } catch (error) {
    console.error(
      `❌ No se pudo acceder al sitio ${SITE_URL}: ${error.message}`
    );
    await sendSlackNotification(
      `❌ No se pudo acceder al sitio ${SITE_URL}. Error: ${error.message}`
    );
  }
}

// Función para enviar notificaciones a Slack
async function sendSlackNotification(message) {
  if (!SLACK_WEBHOOK_URL) {
    console.error("❌ No se ha configurado la URL del webhook de Slack.");
    return;
  }
  try {
    await axios.post(
      SLACK_WEBHOOK_URL,
      { text: message },
    );
    console.log("✅ Notificación enviada a Slack.");
  } catch (error) {
    console.error("❌ Error al enviar la notificación a Slack:", error.message);
  }
}

// Inicia la verificación automática del sitio
setInterval(checkWebsite, CHECK_INTERVAL);



app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});


