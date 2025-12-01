const express = require("express");
const router = express.Router();
const hotelControlador = require("../controllers/hotelControlador");

router.get("/", hotelControlador.obtenerHoteles);

router.post("/filtrar", hotelControlador.filtrarHoteles);

router.get("/buscar", hotelControlador.buscarHoteles);
//API PARA CONSUMO EXTERNO
router.post("/busqueda-avanzada", hotelControlador.busquedaAvanzadaHoteles);
//API PARA CONSUMO EXTERNO
router.get("/tarifas", hotelControlador.obtenerTarifasHoteles);


module.exports = router;
