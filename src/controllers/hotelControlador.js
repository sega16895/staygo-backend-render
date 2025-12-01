const hotelModelo = require("../models/hotelModelo");

async function obtenerHoteles(req, res) {
  try {
    const hoteles = await hotelModelo.listarHotelesConServicios();
    res.json(hoteles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function filtrarHoteles(req, res) {
  try {
    const { precioMin, precioMax, estrellas, servicios } = req.body;

    const filtros = {
      precioMin: precioMin || null,
      precioMax: precioMax || null,
      estrellas: estrellas || null,
      servicios: servicios || [],
    };

    const hotelesFiltrados = await hotelModelo.filtrarHoteles(filtros);
    res.json(hotelesFiltrados);
  } catch (error) {
    res.status(500).json({ error: "Error al filtrar hoteles: " + error.message });
  }
}

async function buscarHoteles(req, res) {
  try {
    const query = req.query.texto || "";
    const hoteles = await hotelModelo.buscarHoteles(query);
    res.json(hoteles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function busquedaAvanzadaHoteles(req, res) {
  try {
    const { destino, fechaInicio, fechaFin, personas, habitaciones } = req.body;

    if (!fechaInicio || !fechaFin) {
      return res.status(400).json({ error: "Las fechas son obligatorias." });
    }

    const filtros = {
      destino: destino || null,
      fechaInicio,
      fechaFin,
      personas: personas || null,
      habitaciones: habitaciones || null,
    };

    const hoteles = await hotelModelo.busquedaAvanzadaHoteles(filtros);

    if (!hoteles || hoteles.length === 0) {
      return res.status(200).json({ mensaje: "No se encontraron hoteles disponibles." });
    }

    res.json(hoteles);
  } catch (error) {
    console.error("❌ Error en búsqueda avanzada:", error);
    res.status(500).json({ error: "Error al realizar la búsqueda avanzada: " + error.message });
  }
}

async function obtenerTarifasHoteles(req, res) {
  try {
    const hoteles = await hotelModelo.listarHotelesConServicios();
    const tarifas = hoteles.map(h => ({
      nombre: h.nombre,
      ciudad: h.ciudad,
      estrellas: h.estrellas,
      precioPorNoche: h.precio,
    }));
    res.json(tarifas);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener tarifas: " + error.message });
  }
}



module.exports = {
  obtenerTarifasHoteles,
  obtenerHoteles,
  filtrarHoteles,
  buscarHoteles,
  busquedaAvanzadaHoteles
};

