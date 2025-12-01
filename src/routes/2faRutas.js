const express = require("express");
const router = express.Router();

const {
  generarQR,
  verificarCodigo
} = require("../controllers/autenticacionControlador");

router.post("/generarQR", generarQR);
router.post("/verificar", verificarCodigo);

module.exports = router;
