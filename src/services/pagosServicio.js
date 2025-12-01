const Stripe = require('stripe');
const { getPool } = require('../config/db');
const transaccionesModelo = require('../models/transaccionesModelo');

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

module.exports = {
  crearIntentoPago: async ({ idFactura, idUsuario }) => {
    const pool = await getPool();
    const req = pool.request();
    req.input('IdFactura', idFactura);
    const result = await req.execute('sp_obtenerFactura');
    const factura = result.recordset && result.recordset[0] ? result.recordset[0] : null;
    if (!factura) throw new Error('Factura no encontrada');

    const total = parseFloat(factura.Total);
    if (isNaN(total)) throw new Error('Total de factura inválido');

    const montoCentavos = Math.round(total * 100);
    const moneda = 'usd';

    const paymentIntent = await stripe.paymentIntents.create({
      amount: montoCentavos,
      currency: moneda,
      description: `Pago Factura #${idFactura} Reserva #${factura.IdReserva}`,
      metadata: {
        idUsuario: String(idUsuario),
        idFactura: String(idFactura),
        idReserva: String(factura.IdReserva)
      }
    });

    await transaccionesModelo.crear({
      idUsuario,
      idOrden: `FAC-${idFactura}`,
      monto: montoCentavos,
      moneda,
      idPasarela: paymentIntent.id,
      estado: paymentIntent.status
    });

    return {
      clientSecret: paymentIntent.client_secret,
      idPasarela: paymentIntent.id,
      monto: montoCentavos,
      moneda
    };
  },

  procesarEventoWebhook: async (evento) => {
    const tipo = evento.type;

    if (tipo === 'payment_intent.succeeded' || tipo === 'payment_intent.payment_failed' || tipo === 'payment_intent.canceled') {
      const intent = evento.data.object;
      const idPasarela = intent.id;
      const estado = intent.status;
      const respuesta = JSON.stringify(intent);

      await transaccionesModelo.actualizarPorPasarela(idPasarela, estado, respuesta);

      if (tipo === 'payment_intent.succeeded') {
        const idFactura = intent.metadata && intent.metadata.idFactura ? parseInt(intent.metadata.idFactura, 10) : null;
        if (idFactura) {
          const pool = await getPool();
          const req = pool.request();
          req.input('IdFactura', idFactura);
          req.input('EstadoPago', 'Pagado');
          await req.execute('sp_actualizarEstadoPago');
        }
      }
    }
  },

  obtenerEstadoPorPasarela: async (idPasarela) => {
    try {
      const intent = await stripe.paymentIntents.retrieve(idPasarela);
      return { idPasarela: intent.id, estado: intent.status, detalle: intent };
    } catch (err) {
      throw err;
    }
  }
};
