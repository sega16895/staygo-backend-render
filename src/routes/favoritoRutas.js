const express = require('express');
const router = express.Router();
const FavoritoControlador = require('../controllers/favoritoControlador');

router.post('/agregar', FavoritoControlador.agregar);

router.post('/eliminar', FavoritoControlador.eliminar);

router.get('/usuario/:id', FavoritoControlador.listar);

router.get('/check', FavoritoControlador.check);

module.exports = router;
