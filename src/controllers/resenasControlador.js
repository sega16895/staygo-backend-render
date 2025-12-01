const ResenasModelo = require('../models/resenasModelo');

const ResenasController = {
  async listar(req, res) {
    try {
      const { idHotel } = req.params;
      const resenas = await ResenasModelo.listarPorHotel(idHotel);
      res.json(resenas);
    } catch (error) {
      res.status(500).json({
        mensaje: 'Error al obtener las reseñas.',
        detalle: error.message,
      });
    }
  },

  async crear(req, res) {
    try {
      await ResenasModelo.agregarResena(req.body);
      res.json({ mensaje: 'Reseña agregada correctamente.' });
    } catch (error) {
      console.error(" Error al crear reseña:", error);
      res.status(400).json({ mensaje: error.message });
    }
  },

  async resumen(req, res) {
    try {
      const { idHotel } = req.params;
      const resumen = await ResenasModelo.resumenPorHotel(idHotel);
      res.json(resumen);
    } catch (error) {
      console.error(error);
      res.status(500).json({ mensaje: 'Error al obtener resumen de reseñas.' });
    }
  },

  async actualizar(req, res) {
    try {
      const { idResena } = req.params;
      const { idUsuario, calificacion, comentario } = req.body;
      const result = await ResenasModelo.actualizarResena({
        idResena,
        idUsuario,
        calificacion,
        comentario,
      });
      res.json({ mensaje: result?.Mensaje || "Reseña actualizada correctamente." });
    } catch (error) {
      console.error(" Error al actualizar reseña:", error);
      res.status(400).json({ mensaje: error.message });
    }
  },

  async eliminar(req, res) {
    try {
      const { idResena } = req.params;
      const { idUsuario } = req.body;
      const result = await ResenasModelo.eliminarResena({
        idResena,
        idUsuario,
      });
      res.json({ mensaje: result?.Mensaje || "Reseña eliminada correctamente." });
    } catch (error) {
      console.error(" Error al eliminar reseña:", error);
      res.status(400).json({ mensaje: error.message });
    }
  },
  //API PARA CONSUMO EXTERNO
  async listarPublicas(req, res) {
  try {
    const { idHotel } = req.params;
    const resenas = await ResenasModelo.listarPublicasPorHotel(idHotel);
    res.json(resenas);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener reseñas públicas.', detalle: error.message });
  }
}

};

module.exports = ResenasController;
