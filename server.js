const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

app.post("/api/generate-quiz", (req, res) => {
  const { prompt } = req.body;
  res.json({ quiz: `Aquí estaría el quiz generado para: ${prompt}` });
});

app.listen(5000, () => console.log("Servidor corriendo en http://localhost:5000"));
