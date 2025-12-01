const express = require('express');
const router = express.Router();
const pagosControlador = require('../controllers/pagosControlador');

router.post('/stripe/crear-intento', pagosControlador.crearIntento);
router.get('/stripe/estado/:idPasarela', pagosControlador.estado);
router.post('/stripe/webhook', pagosControlador.webhook);
router.post('/realizar', pagosControlador.realizarPago);
router.get('/estado/:idReserva', pagosControlador.estadoReserva);

module.exports = router;
