const { getConnection } = require('../config/db');
const sql = require('mssql');

const ReservaModelo = {

  async consultarDisponibilidad({ idHotel, fechaInicio, fechaFin, personas }) {
    const pool = await getConnection();
    const request = pool.request();

    request.input('IdHotel', sql.Int, idHotel);
    request.input('FechaInicio', sql.Date, fechaInicio);
    request.input('FechaFinal', sql.Date, fechaFin);
    request.input('Personas', sql.Int, personas);

    const result = await request.execute('sp_ConsultarDisponibilidad');

    return result.recordset.map((r) => ({
      IdInventario: r.IdInventario ?? r.idInventario ?? r.IDINVENTARIO,
      IdTipoHabitacion: r.IdTipoHabitacion ?? r.idTipoHabitacion,
      TipoHabitacion: r.TipoHabitacion ?? r.tipoHabitacion,
      CapacidadPersonas: r.CapacidadPersonas ?? r.capacidadPersonas,
      TotalHabitaciones: r.TotalHabitaciones ?? r.totalHabitaciones,
      HabitacionesDisponibles: r.HabitacionesDisponibles ?? r.habitacionesDisponibles,
      PrecioPorNoche: r.PrecioPorNoche ?? r.precioPorNoche,
      IdHotel: r.IdHotel ?? r.idHotel ?? idHotel,
    }));
  },

  async registrarReserva({
    idUsuario,
    idInventario,
    fechaInicio,
    fechaFin,
    personas,
    cantidadHabitaciones = 1
  }) {
    const pool = await getConnection();
    const request = pool.request();

    request.input('IdUsuario', sql.Int, idUsuario);
    request.input('IdInventario', sql.Int, idInventario);
    request.input('FechaInicio', sql.Date, fechaInicio);
    request.input('FechaFin', sql.Date, fechaFin);
    request.input('Personas', sql.Int, personas);
    request.input('CantidadHabitaciones', sql.Int, cantidadHabitaciones);

    try {
      const result = await request.execute('sp_RegistrarReservaConTotales');
      const data = result.recordset && result.recordset[0];

      if (!data?.IdReserva) {
        throw new Error('No se pudo obtener IdReserva desde SP.');
      }

      return {
        idReserva: data.IdReserva,
        subtotal: data.Subtotal ?? null,
        impuestos: data.Impuestos ?? null,
        total: data.Total ?? null,
      };
    } catch (error) {
      const msg = error.message;

      if (msg.includes('No hay habitaciones disponibles')) {
        const err = new Error('No hay habitaciones disponibles para este tipo.');
        err.code = 'NO_DISPONIBLE';
        throw err;
      }

      if (msg.includes('excede la capacidad')) {
        const err = new Error('La cantidad de personas excede la capacidad máxima permitida.');
        err.code = 'CAPACIDAD_EXCEDIDA';
        throw err;
      }

      if (msg.includes('suficientes habitaciones disponibles')) {
        const err = new Error('No hay suficientes habitaciones disponibles para la cantidad solicitada.');
        err.code = 'NO_DISPONIBLE';
        throw err;
      }

      throw error;
    }
  },

  async liberarHabitacionesVencidas() {
    const pool = await getConnection();
    const request = pool.request();
    await request.execute('sp_LiberarHabitacionesVencidas');
    return true;
  },

  async cancelarReserva({ idReserva }) {
    const pool = await getConnection();
    const request = pool.request();
    request.input('IdReserva', sql.Int, idReserva);

    try {
      const result = await request.execute('sp_CancelarReserva');
      const data = result.recordset && result.recordset[0];
      return data || null;
    } catch (error) {
      throw error;
    }
  },

  async cancelarReservaConMotivo({ idReserva, motivo }) {
    const pool = await getConnection();
    const request = pool.request();
    request.input('IdReserva', sql.Int, idReserva);
    request.input('Motivo', sql.NVarChar(250), motivo || null);

    try {
      const result = await request.execute('sp_CancelarReserva');
      const data = result.recordset && result.recordset[0];
      return data || null;
    } catch (error) {
      throw error;
    }
  },

  async obtenerReservasPorUsuario({ idUsuario, tipo = 'Activas' }) {
    const pool = await getConnection();
    const request = pool.request();
    request.input('IdUsuario', sql.Int, idUsuario);
    request.input('Tipo', sql.NVarChar(20), tipo);

    try {
      const result = await request.execute('sp_ObtenerReservasUsuario');
      return result.recordset;
    } catch (error) {
      console.error('❌ Error obtenerReservasPorUsuario:', error);
      throw error;
    }
  },
};

module.exports = ReservaModelo;
