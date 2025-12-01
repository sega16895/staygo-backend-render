const { getConnection } = require("../config/db");

async function listarHotelesConServicios() {
  try {
    const pool = await getConnection();
    const result = await pool.request().execute("sp_listarHotelesConServicios");
    const rows = result.recordset;

    const baseUrl = process.env.BASE_URL || "http://localhost:4000/images/";
    const mapaHoteles = new Map();

    rows.forEach((r) => {
      if (!mapaHoteles.has(r.IdHotel)) {
        mapaHoteles.set(r.IdHotel, {
          idHotel: r.IdHotel,
          nombre: r.NombreHotel,
          ciudad: r.Ciudad,
          estrellas: r.CantidadEstrellas,
          descripcion: r.Descripcion,
          precio: r.PrecioPorNoche || r.PrecioBase || 0,
          imagen: r.ImagenUrl ? `${baseUrl}${r.ImagenUrl}` : null,
          servicios: [],
        });
      }

      if (r.IdServicio && r.NombreServicio) {
        mapaHoteles.get(r.IdHotel).servicios.push({
          id: r.IdServicio,
          nombre: r.NombreServicio,
        });
      }
    });

    return Array.from(mapaHoteles.values());
  } catch (error) {
    throw new Error("Error al listar hoteles con servicios: " + error.message);
  }
}

async function filtrarHoteles({ precioMin, precioMax, estrellas, servicios }) {
  try {
    const pool = await getConnection();
    const request = pool.request();

    request.input("PrecioMin", precioMin || null);
    request.input("PrecioMax", precioMax || null);
    request.input("Estrellas", estrellas || null);
    request.input("Servicios", servicios && servicios.length > 0 ? servicios.join(",") : null);

    const result = await request.execute("sp_filtrarHoteles");
    const rows = result.recordset;

    const baseUrl = process.env.BASE_URL || "http://localhost:4000/images/";

    return rows.map((r) => ({
      idHotel: r.IdHotel,
      nombre: r.NombreHotel,
      ciudad: r.Ciudad,
      estrellas: r.CantidadEstrellas,
      descripcion: r.Descripcion,
      precio: r.PrecioPorNoche || r.PrecioBase || 0,
      imagen: r.ImagenUrl ? `${baseUrl}${r.ImagenUrl}` : null,
    }));
  } catch (error) {
    throw new Error("Error al filtrar hoteles: " + error.message);
  }
}

async function buscarHoteles(query) {
  try {
    const pool = await getConnection();
    const request = pool.request();
    request.input("Query", query);

    const result = await request.execute("sp_buscarHoteles");
    const rows = result.recordset;

    const baseUrl = process.env.BASE_URL || "http://localhost:4000/images/";

    return rows.map((r) => ({
      idHotel: r.IdHotel,
      nombre: r.NombreHotel,
      ciudad: r.Ciudad,
      estrellas: r.CantidadEstrellas,
      descripcion: r.Descripcion,
      precio: r.PrecioPorNoche || r.PrecioBase || 0,
      imagen: r.ImagenUrl ? `${baseUrl}${r.ImagenUrl}` : null,
    }));
  } catch (error) {
    throw new Error("Error al buscar hoteles: " + error.message);
  }
}
//API PARA CONSUMO EXTERNO
async function busquedaAvanzadaHoteles({ destino, fechaInicio, fechaFin, personas, habitaciones }) {
  try {
    const pool = await getConnection();
    const request = pool.request();

    request.input("Destino", destino || null);
    request.input("FechaInicio", fechaInicio);
    request.input("FechaFin", fechaFin);
    request.input("Personas", personas || null);
    request.input("Habitaciones", habitaciones || null); 

    const result = await request.execute("sp_busquedaAvanzadaHoteles");
    const rows = result.recordset;

    const baseUrl = process.env.BASE_URL || "http://localhost:4000/images/";

    return rows.map((r) => ({
      idHotel: r.IdHotel,
      nombre: r.NombreHotel,
      ciudad: r.Ciudad,
      estrellas: r.CantidadEstrellas,
      descripcion: r.Descripcion,
      tipoHabitacion: r.TipoHabitacion || null, 
      capacidadPersonas: r.CapacidadPersonas || 0,
      numeroHabitacionesSeleccionadas: r.NumeroHabitacionesSeleccionadas || 0,
      precioPorNoche: r.PrecioPorNoche || 0,
      montoEstimadoTotal: r.MontoEstimadoTotal || 0,
      habitacionesDisponibles: r.HabitacionesDisponibles || 0,
      fechaInicio: r.FechaInicioBusqueda,
      fechaFin: r.FechaFinBusqueda,
      cantidadNoches: r.CantidadNoches || 0,
      imagen: r.ImagenUrl
        ? `${baseUrl}${r.ImagenUrl}`
        : "https://via.placeholder.com/300x180.png?text=Sin+imagen",
      servicios: r.Servicios
        ? r.Servicios.split(",").map((s) => s.trim())
        : [],
    }));
  } catch (error) {
    throw new Error("Error en la búsqueda avanzada: " + error.message);
  }
}

module.exports = {
  listarHotelesConServicios,
  filtrarHoteles,
  buscarHoteles,
  busquedaAvanzadaHoteles,
};
