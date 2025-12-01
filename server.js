const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const bodyParser = require("body-parser");
const { getConnection } = require("./src/config/db");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// ============================
// 🔔 1. WEBHOOK STRIPE (RAW BODY)
// Debe ir ANTES de bodyParser.json()
// ============================
app.post(
  "/api/pagos/webhook",
  bodyParser.raw({ type: "application/json" }),
  require("./src/controllers/pagosControlador").webhook
);

// ============================
// CORS
// ============================
const corsOptions = {
  origin: function (origin, callback) {
    callback(null, true);
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

// ============================
// BODY PARSER JSON DESPUÉS DEL WEBHOOK
// ============================
app.use(bodyParser.json());

// ============================
// Archivos estáticos
// ============================
app.use("/images", express.static("public/images"));

// ============================
// RUTAS
// ============================
app.use("/api/auth", require("./src/routes/autenticacionRutas"));
app.use("/api/2fa", require("./src/routes/2faRutas"));
app.use("/api/hoteles", require("./src/routes/hotelRutas"));
app.use("/api/usuarios", require("./src/routes/usuarioRutas"));
app.use("/api/destinos", require("./src/routes/destinosRutas"));
app.use("/api/reservas", require("./src/routes/reservaRuta"));
app.use("/api/favoritos", require("./src/routes/favoritoRutas"));
app.use("/api/pagos", require("./src/routes/pagosRutas"));
app.use("/api/resenas", require("./src/routes/resenasRutas"));
app.use("/api/indicadores", require("./src/routes/indicadoresRutas"));
app.use("/api/pagos/paypal", require("./src/routes/paypal"));

// ============================
// Endpoint raíz (para probar en Azure)
// ============================
app.get("/", (req, res) => {
  res.send("✅ API StayGo funcionando correctamente en Azure");
});

// ============================
// Iniciar servidor
// ============================
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
  getConnection();
});

// ============================
// CRON JOBS
// ============================
require("./src/jobs/liberarHabitacionesJob");
