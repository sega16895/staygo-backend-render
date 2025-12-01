const ReservaModelo = require('../models/reservaModelo');

const ReservaControlador = {
  async consultar(req, res) {
    try {
      const { idHotel, fechaInicio, fechaFin, personas } = req.body;

      if (!idHotel || !fechaInicio || !fechaFin || !personas) {
        return res.status(400).json({
          ok: false,
          msg: 'Faltan parámetros requeridos: idHotel, fechaInicio, fechaFin, personas.'
        });
      }

      const data = await ReservaModelo.consultarDisponibilidad({
        idHotel: Number(idHotel),
        fechaInicio,
        fechaFin,
        personas: Number(personas)
      });

      return res.status(200).json({
        ok: true,
        disponibilidad: data,
        msg: data.length > 0
          ? `Se encontraron ${data.length} tipos de habitación disponibles.`
          : 'No hay disponibilidad para las fechas seleccionadas.'
      });

    } catch (err) {
      console.error('❌ Error en consultar disponibilidad:', err);
      return res.status(500).json({
        ok: false,
        msg: 'Error al consultar disponibilidad.',
        error: err.message
      });
    }
  },

  async crear(req, res) {
    try {
      const {
        idUsuario,
        idInventario,
        fechaInicio,
        fechaFin,
        personas,
        cantidadHabitaciones
      } = req.body;

      if (!idUsuario || !idInventario || !fechaInicio || !fechaFin || !personas) {
        return res.status(400).json({
          ok: false,
          msg: 'Faltan parámetros: idUsuario, idInventario, fechaInicio, fechaFin, personas.'
        });
      }

      const result = await ReservaModelo.registrarReserva({
        idUsuario: Number(idUsuario),
        idInventario: Number(idInventario),
        fechaInicio,
        fechaFin,
        personas: Number(personas),
        cantidadHabitaciones: cantidadHabitaciones ? Number(cantidadHabitaciones) : 1
      });

      return res.status(201).json({
        ok: true,
        msg: 'Reserva creada exitosamente.',
        idReserva: result.idReserva,
        subtotal: result.subtotal,
        impuestos: result.impuestos,
        total: result.total
      });

    } catch (err) {
      console.error('❌ Error crear reserva:', err);

      if (err.code === 'NO_DISPONIBLE') {
        return res.status(409).json({
          ok: false,
          msg: 'No hay habitaciones disponibles para este tipo.'
        });
      }

      if (err.code === 'CAPACIDAD_EXCEDIDA') {
        return res.status(400).json({
          ok: false,
          msg: 'La cantidad de personas excede la capacidad máxima.'
        });
      }

      return res.status(500).json({
        ok: false,
        msg: 'Error al crear reserva.',
        error: err.message
      });
    }
  },

  async liberar(req, res) {
    try {
      await ReservaModelo.liberarHabitacionesVencidas();

      return res.status(200).json({
        ok: true,
        msg: 'Reservas vencidas liberadas correctamente.'
      });
    } catch (err) {
      console.error('❌ Error liberar habitaciones:', err);
      return res.status(500).json({
        ok: false,
        msg: 'Error al liberar reservas vencidas.',
        error: err.message
      });
    }
  },

  async cancelar(req, res) {
    try {
      const idReserva = Number(req.params.id || req.body.idReserva);
      const motivo = req.body.motivo || null;

      if (!idReserva) {
        return res.status(400).json({
          ok: false,
          msg: 'Debe proporcionar un idReserva válido.'
        });
      }

      const result = await ReservaModelo.cancelarReservaConMotivo({ idReserva, motivo });

      if (!result) {
        return res.status(404).json({
          ok: false,
          msg: 'No se encontró la reserva o no se pudo cancelar.'
        });
      }

      return res.status(200).json({
        ok: true,
        msg: 'Reserva cancelada correctamente.',
        data: result
      });
    } catch (err) {
      console.error('❌ Error cancelar reserva:', err);
      return res.status(500).json({
        ok: false,
        msg: 'Error al cancelar reserva.',
        error: err.message
      });
    }
  },

  async listarPorUsuario(req, res) {
    try {
      const idUsuario = Number(req.params.id);
      const tipo = req.query.tipo || 'Activas';

      if (!idUsuario) {
        return res.status(400).json({
          ok: false,
          msg: 'Debe proporcionar un IdUsuario válido.'
        });
      }

      const data = await ReservaModelo.obtenerReservasPorUsuario({
        idUsuario,
        tipo
      });

      return res.status(200).json({
        ok: true,
        msg: `Reservas ${tipo.toLowerCase()} del usuario ${idUsuario}.`,
        data
      });
    } catch (err) {
      console.error('❌ Error listar reservas usuario:', err);
      return res.status(500).json({
        ok: false,
        msg: 'Error al obtener las reservas del usuario.',
        error: err.message
      });
    }
  }
};

module.exports = ReservaControlador;
