const { getConnection, sql } = require("../config/db");
const pagosServicio = require('../services/pagosServicio');
const pagoModelo = require('../models/pagoModelo');


exports.crearIntento = async (req, res) => {
  try {
    const { idFactura, idUsuario } = req.body;

    if (!idFactura || !idUsuario)
      return res.status(400).json({ error: 'idFactura e idUsuario son requeridos' });

    const resultado = await pagosServicio.crearIntentoPago({ idFactura, idUsuario });
    res.json(resultado);

  } catch (err) {
    console.error(' Error en crearIntento:', err);
    res.status(500).json({ error: err.message || 'Error al crear intento de pago' });
  }
};

exports.webhook = async (req, res) => {
  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  const sig = req.headers['stripe-signature'];

  let evento;
  try {
    evento = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error(' Webhook Stripe: verificación fallida:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    await pagosServicio.procesarEventoWebhook(evento);
    res.status(200).send('ok');
  } catch (err) {
    console.error(' Error procesando webhook:', err);
    res.status(500).send('error');
  }
};

exports.estado = async (req, res) => {
  try {
    const { idPasarela } = req.params;
    if (!idPasarela)
      return res.status(400).json({ error: 'idPasarela requerido' });

    const estado = await pagosServicio.obtenerEstadoPorPasarela(idPasarela);
    res.json(estado);

  } catch (err) {
    console.error(' Error en estado:', err);
    res.status(500).json({ error: err.message || 'Error al obtener estado del pago' });
  }
};

exports.estadoReserva = async (req, res) => {
  try {
    const { idReserva } = req.params;

    const pool = await getConnection();
    const result = await pool.request()
      .input("IdReserva", sql.Int, idReserva)
      .query(`
        SELECT Estado
        FROM Reservas
        WHERE IdReserva = @IdReserva
      `);

    if (result.recordset.length === 0)
      return res.status(404).json({ estado: "No existe" });

    return res.json({
      estado: result.recordset[0].Estado,
    });

  } catch (err) {
    console.error("Error estadoReserva:", err);
    res.status(500).json({ error: "Error consultando estado de reserva" });
  }
};



exports.realizarPago = async (req, res) => {
  try {
    const { IdUsuario, IdReserva, MetodoPago, Monto } = req.body;

    if (!IdUsuario || !IdReserva || !MetodoPago || !Monto) {
      return res.status(400).json({ error: 'Datos incompletos para procesar el pago' });
    }

    const idTransaccion = await pagoModelo.guardarTransaccion({
      IdUsuario,
      IdReserva,
      MetodoPago,
      Monto
    });

    await pagoModelo.actualizarEstadoPago(IdReserva); 

    res.json({
      exito: true,
      mensaje: 'Pago registrado correctamente',
      idTransaccion
    });

  } catch (err) {
    console.error(' Error en realizarPago:', err);
    res.status(500).json({
      exito: false,
      error: err.message || 'Error interno al procesar el pago'
    });
  }
};
