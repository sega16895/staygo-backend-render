const DestinosModelo = require("../models/destinosModelo");

const DestinosControlador = {
  async catalogo(req, res) {
    try {
      const destinos = await DestinosModelo.obtenerCatalogoDestinos();
      res.json(destinos);
    } catch (error) {
      console.error("❌ Error en catálogo de destinos:", error);
      res.status(500).json({ error: "Error al obtener el catálogo de destinos" });
    }
  },
};

module.exports = DestinosControlador;
