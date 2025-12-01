const express = require('express');
const router = express.Router();
const ReservaControlador = require('../controllers/reservaControlador');

router.post('/consultar', ReservaControlador.consultar);
router.post('/crear', ReservaControlador.crear);
router.put('/liberar', ReservaControlador.liberar);

router.put('/cancelar/:id', ReservaControlador.cancelar);
router.put('/cancelar', ReservaControlador.cancelar);

router.get('/usuario/:id', ReservaControlador.listarPorUsuario);

module.exports = router;
