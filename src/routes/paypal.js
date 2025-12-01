const router = require("express").Router();
const paypal = require("../controllers/paypalControlador");

router.post("/crear-orden", paypal.crearOrden);
router.post("/capturar-orden", paypal.capturarOrden);

module.exports = router;
