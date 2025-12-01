const express = require("express");
const router = express.Router();
const IndicadoresController = require("../controllers/indicadoresControlador");

router.get("/tipo-cambio", IndicadoresController.tipoCambio);
router.get("/tipo-cambio/historial", IndicadoresController.obtenerHistorialTipoCambio);

module.exports = router;
