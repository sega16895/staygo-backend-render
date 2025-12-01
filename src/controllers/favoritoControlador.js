const FavoritoModelo = require('../models/favoritoModelo');

const FavoritoControlador = {
  async agregar(req, res) {
    try {
      const idUsuario = req.body.idUsuario || req.body.IdUsuario;
      const idHotel = req.body.idHotel || req.body.IdHotel;

      if (!idUsuario || !idHotel) {
        return res.status(400).json({ ok: false, msg: 'Faltan idUsuario o idHotel.' });
      }

      const data = await FavoritoModelo.agregarFavorito({
        idUsuario: Number(idUsuario),
        idHotel: Number(idHotel),
      });

      if (!data) {
        return res.status(500).json({ ok: false, msg: 'No se pudo crear favorito.' });
      }

      if (data.Inserted === 0) {
        return res.status(200).json({ ok: true, msg: 'Ya existe en favoritos.', favorito: data });
      }

      return res.status(201).json({ ok: true, msg: 'Favorito agregado.', favorito: data });
    } catch (err) {
      console.error('Error agregar favorito:', err);
      res.status(500).json({ ok: false, msg: 'Error al agregar favorito.', error: err.message });
    }
  },

  async eliminar(req, res) {
    try {
      const idUsuario =
        req.body.idUsuario ||
        req.body.IdUsuario ||
        req.query.idUsuario ||
        req.query.IdUsuario;
      const idHotel =
        req.body.idHotel ||
        req.body.IdHotel ||
        req.query.idHotel ||
        req.query.IdHotel;

      if (!idUsuario || !idHotel) {
        return res.status(400).json({ ok: false, msg: 'Faltan idUsuario o idHotel.' });
      }

      const ok = await FavoritoModelo.eliminarFavorito({
        idUsuario: Number(idUsuario),
        idHotel: Number(idHotel),
      });

      if (!ok) {
        return res.status(404).json({ ok: false, msg: 'No se encontró el favorito.' });
      }

      res.json({ ok: true, msg: 'Favorito eliminado.' });
    } catch (err) {
      console.error('Error eliminar favorito:', err);
      res.status(500).json({ ok: false, msg: 'Error al eliminar favorito.', error: err.message });
    }
  },

  async listar(req, res) {
    try {
      const idUsuario = Number(req.params.id);
      if (!idUsuario) {
        return res.status(400).json({ ok: false, msg: 'Falta idUsuario.' });
      }
      const favoritos = await FavoritoModelo.obtenerFavoritosUsuario({ idUsuario });
      res.json({ ok: true, favoritos });
    } catch (err) {
      console.error('Error listar favoritos:', err);
      res.status(500).json({ ok: false, msg: 'Error al obtener favoritos.', error: err.message });
    }
  },

  async check(req, res) {
    try {
      const idUsuario = Number(req.query.idUsuario || req.query.IdUsuario);
      const idHotel = Number(req.query.idHotel || req.query.IdHotel);

      if (!idUsuario || !idHotel) {
        return res.status(400).json({ ok: false, msg: 'Faltan idUsuario o idHotel.' });
      }

      const es = await FavoritoModelo.esFavorito({ idUsuario, idHotel });
      res.json({ ok: true, esFavorito: es });
    } catch (err) {
      console.error('Error check favorito:', err);
      res.status(500).json({ ok: false, msg: 'Error al comprobar favorito.', error: err.message });
    }
  },
};

module.exports = FavoritoControlador;
