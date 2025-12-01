const express = require("express");
const router = express.Router();
const ResenasController = require("../controllers/resenasControlador");

router.get("/:idHotel", ResenasController.listar);

router.get("/resumen/:idHotel", ResenasController.resumen);

router.post("/", ResenasController.crear);

router.put("/:idResena", ResenasController.actualizar);

router.delete("/:idResena", ResenasController.eliminar);
//API PARA CONSUMO EXTERNO
router.get("/publicas/:idHotel", ResenasController.listarPublicas);

module.exports = router;
