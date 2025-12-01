const express = require("express");
const router = express.Router();
const autenticacionControlador = require("../controllers/autenticacionControlador");

router.post("/register", autenticacionControlador.registrarUsuario);

router.post("/login", autenticacionControlador.iniciarSesion);

router.post("/recuperar-password", autenticacionControlador.recuperarPassword);

router.post("/verificar-codigo-recuperacion", autenticacionControlador.verificarCodigoRecuperacion);

router.post("/restablecer-password", autenticacionControlador.restablecerPassword);

router.post("/google", autenticacionControlador.loginConGoogle);

module.exports = router;
