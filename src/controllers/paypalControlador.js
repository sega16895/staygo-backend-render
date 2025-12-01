const axios = require("axios");

const PAYPAL_CLIENT = process.env.PAYPAL_CLIENT;
const PAYPAL_SECRET = process.env.PAYPAL_SECRET;
const PAYPAL_API = process.env.PAYPAL_API;

exports.crearOrden = async (req, res) => {
  try {
    const { total, IdUsuario, IdReserva } = req.body;

    if (!total || !IdUsuario || !IdReserva)
      return res.status(400).json({ error: "Datos incompletos" });

    const token = await axios({
      url: `${PAYPAL_API}/v1/oauth2/token`,
      method: "post",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      auth: { username: PAYPAL_CLIENT, password: PAYPAL_SECRET },
      data: "grant_type=client_credentials",
    });

    const accessToken = token.data.access_token;

    const order = await axios.post(
      `${PAYPAL_API}/v2/checkout/orders`,
      {
        intent: "CAPTURE",
        purchase_units: [
          { amount: { currency_code: "USD", value: total } },
        ],
      },
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    res.json({
      ...order.data,
      IdUsuario,
      IdReserva,
    });

  } catch (err) {
    console.error("Error crearOrden:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.capturarOrden = async (req, res) => {
  try {
    const { orderID, IdUsuario, IdReserva } = req.body;

    if (!orderID || !IdUsuario || !IdReserva)
      return res.status(400).json({ error: "Datos incompletos" });

    const token = await axios({
      url: `${PAYPAL_API}/v1/oauth2/token`,
      method: "post",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      auth: { username: PAYPAL_CLIENT, password: PAYPAL_SECRET },
      data: "grant_type=client_credentials",
    });

    const accessToken = token.data.access_token;

    const captura = await axios.post(
      `${PAYPAL_API}/v2/checkout/orders/${orderID}/capture`,
      {},
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    const pagoModelo = require("../models/pagoModelo");

    const idTransaccion = await pagoModelo.guardarTransaccion({
      IdUsuario,
      IdReserva,
      MetodoPago: "PayPal",
      Monto: captura.data.purchase_units[0].payments.captures[0].amount.value
    });

    await pagoModelo.actualizarEstadoPago(IdReserva);

    res.json({
      ok: true,
      idTransaccion,
      paypalResponse: captura.data,
    });

  } catch (err) {
    console.error("Error capturarOrden:", err);
    res.status(500).json({ error: err.message });
  }
};
