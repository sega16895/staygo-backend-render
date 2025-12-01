const express = require("express");
const router = express.Router();
const usuarioControlador = require("../controllers/usuarioControlador");

router.get("/:id", usuarioControlador.obtenerUsuario);
router.put("/:id", usuarioControlador.actualizarUsuario);

router.get("/catalogos/paises", usuarioControlador.obtenerPaises);
router.get("/catalogos/provincias/:idPais", usuarioControlador.obtenerProvincias);
router.get("/catalogos/cantones/:idProvincia", usuarioControlador.obtenerCantones);
router.get("/catalogos/distritos/:idCanton", usuarioControlador.obtenerDistritos);
router.get("/catalogos/destinos", usuarioControlador.obtenerDestinos);

router.get("/pago/:id", usuarioControlador.obtenerDatosPago);
router.put("/pago/:id", usuarioControlador.actualizarDatosPago);


module.exports = router;
