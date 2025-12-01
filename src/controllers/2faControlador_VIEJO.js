const speakeasy = require("speakeasy");
const QRCode = require("qrcode");
const { getConnection } = require("../config/db");

const generarQR = async (req, res) => {
  const { idUsuario, email } = req.body;
  if (!idUsuario || !email) return res.status(400).json({ error: "Faltan datos" });

  try {
    const secret = speakeasy.generateSecret({
      name: `StayGo (${email})`,
      length: 20,
    });

    const qrDataUrl = await QRCode.toDataURL(secret.otpauth_url);

    const pool = await getConnection();
    await pool.request()
      .input("IdUsuario", idUsuario)
      .input("TwoFactorSecret", secret.base32)
      .query("UPDATE Usuarios SET TwoFactorSecret = @TwoFactorSecret WHERE IdUsuario = @IdUsuario");

    res.json({
      mensaje: "Código QR generado correctamente",
      qr: qrDataUrl,
      secret: secret.base32,
    });
  } catch (err) {
    console.error("Error generando QR:", err);
    res.status(500).json({ error: "Error generando QR" });
  }
};

const verificarCodigo = async (req, res) => {
  const { idUsuario, codigo } = req.body;

  try {
    const pool = await getConnection();
    const result = await pool.request()
      .input("IdUsuario", idUsuario)
      .query("SELECT TwoFactorSecret FROM Usuarios WHERE IdUsuario = @IdUsuario");

    const secret = result.recordset[0]?.TwoFactorSecret;
    if (!secret) return res.status(400).json({ error: "No hay secret configurado" });

    const verified = speakeasy.totp.verify({
      secret,
      encoding: "base32",
      token: codigo,
      window: 1,
    });

    if (verified) {
      res.json({ ok: true, mensaje: "Código verificado correctamente" });
    } else {
      res.status(401).json({ ok: false, mensaje: "Código incorrecto o expirado" });
    }
  } catch (err) {
    console.error("Error verificando código:", err);
    res.status(500).json({ error: "Error verificando código" });
  }
};

module.exports = { generarQR, verificarCodigo };
