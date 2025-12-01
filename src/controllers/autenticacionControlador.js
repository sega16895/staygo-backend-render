const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const usuarioModelo = require("../models/usuarioModelo");
require("dotenv").config();

const speakeasy = require("speakeasy");
const QRCode = require("qrcode");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

const entorno = process.env.NODE_ENV || "development";
const MAX_INTENTOS = 3;
const MINUTOS_BLOQUEO = 15;

async function registrarUsuario(req, res) {
  try {
    const { Nombre, Email, Clave, captchaToken } = req.body;
    if (!Nombre || !Email || !Clave)
      return res.status(400).json({ error: "Faltan datos obligatorios" });

    if (entorno === "production") {
      try {
        const verifyUrl = `https://www.google.com/recaptcha/api/siteverify`;
        const { data } = await axios.post(verifyUrl, null, {
          params: {
            secret: process.env.RECAPTCHA_SECRET_KEY,
            response: captchaToken,
          },
        });
        if (!data.success || (data.score && data.score < 0.5)) {
          return res.status(403).json({ error: "Verificación reCAPTCHA fallida" });
        }
      } catch (e) {
        console.warn("⚠️ Error al verificar reCAPTCHA, ignorado en desarrollo");
      }
    } else {
      console.log("⚙️ Modo desarrollo: reCAPTCHA omitido");
    }

    const ClaveHash = await bcrypt.hash(Clave, 10);
    const nuevoUsuario = await usuarioModelo.crearUsuario({
      Nombre,
      Email,
      ClaveHash,
      TipoLogueo: "Email",
    });

    await usuarioModelo.insertarAuditoria({
      idUsuario: nuevoUsuario.NuevoIdUsuario,
      accion: "Registro de usuario",
      descripcion: `Nuevo usuario registrado con correo ${Email}`,
      ip: req.ip,
      navegador: req.headers["user-agent"],
    });

    res.status(201).json({
      mensaje: "Usuario registrado con éxito",
      usuarioId: nuevoUsuario.NuevoIdUsuario
    });

  } catch (error) {
    console.error("Error en registrarUsuario:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}


async function iniciarSesion(req, res) {
  try {
    const { Email, Clave } = req.body;
    if (!Email || !Clave)
      return res.status(400).json({ error: "Faltan datos obligatorios" });

    const usuario = await usuarioModelo.buscarUsuarioPorCorreo(Email);
    if (!usuario)
      return res.status(401).json({ error: "Credenciales inválidas" });

    let fechaBloqueo = null;
    if (usuario.FechaBloqueo) {
      try {
        fechaBloqueo = new Date(usuario.FechaBloqueo);
        if (isNaN(fechaBloqueo.getTime())) fechaBloqueo = null;
      } catch {
        fechaBloqueo = null;
      }
    }

    const ahora = new Date(new Date().toISOString());
    if (fechaBloqueo && fechaBloqueo > ahora) {
      const minutosRestantes = Math.ceil((fechaBloqueo - ahora) / 60000);
      await usuarioModelo.insertarAuditoria({
        idUsuario: usuario.IdUsuario,
        accion: "Intento de login bloqueado",
        descripcion: `Intento mientras estaba bloqueado (${minutosRestantes} min restantes)`,
        ip: req.ip,
        navegador: req.headers["user-agent"],
        exitoso: 0,
      });
      return res.status(403).json({
        error: `⏳ Cuenta bloqueada temporalmente. Intenta de nuevo en ${minutosRestantes} minutos.`,
      });
    }

    if (usuario.EstadoCuenta === 0)
      return res.status(403).json({ error: "Cuenta bloqueada. Contacta soporte." });

    const claveValida = await bcrypt.compare(Clave, usuario.ClaveHash);

    if (!claveValida) {
      await usuarioModelo.incrementarIntentosFallidos(
        usuario.IdUsuario,
        MAX_INTENTOS,
        MINUTOS_BLOQUEO
      );
      await usuarioModelo.insertarAuditoria({
        idUsuario: usuario.IdUsuario,
        accion: "Login fallido",
        descripcion: `Contraseña incorrecta para ${Email}`,
        ip: req.ip,
        navegador: req.headers["user-agent"],
        exitoso: 0,
      });
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    await usuarioModelo.reiniciarIntentosFallidos(usuario.IdUsuario);
    await usuarioModelo.actualizarUltimoAcceso(usuario.IdUsuario);

    const token = jwt.sign(
      { id: usuario.IdUsuario, email: usuario.Email },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    await usuarioModelo.insertarAuditoria({
      idUsuario: usuario.IdUsuario,
      accion: "Inicio de sesión exitoso",
      descripcion: "Usuario autenticado correctamente",
      ip: req.ip,
      navegador: req.headers["user-agent"],
    });

    return res.json({
      mensaje: "Login exitoso",
      token,
      usuario: {
        id: usuario.IdUsuario,
        nombre: usuario.Nombre,
        email: usuario.Email,
      },
    });
  } catch (error) {
    console.error("Error en login:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}

async function generarQR(req, res) {
  const { idUsuario, email } = req.body;
  if (!idUsuario || !email)
    return res.status(400).json({ error: "Faltan datos" });

  try {
    const usuario = await usuarioModelo.obtenerUsuarioPorId(idUsuario);

    if (
      usuario.TwoFactorSecret &&
      usuario.TwoFactorSecret !== "null" &&
      usuario.TwoFactorSecret.trim() !== ""
    ) {
      console.log(`ℹ️ Usuario ${idUsuario} ya tiene 2FA configurado.`);
      const secret = usuario.TwoFactorSecret;
      const otpauthUrl = speakeasy.otpauthURL({
        secret,
        label: `StayGo (${email})`,
        encoding: "base32",
      });
      const qrDataUrl = await QRCode.toDataURL(otpauthUrl);

      await usuarioModelo.insertarAuditoria({
        idUsuario,
        accion: "Consulta de 2FA existente",
        descripcion: "El usuario ya tenía 2FA configurado",
        ip: req.ip,
        navegador: req.headers["user-agent"],
      });

      return res.status(200).json({
        mensaje: "2FA ya configurado",
        qr: qrDataUrl,
        secret,
      });
    }


    const secret = speakeasy.generateSecret({
      name: `StayGo (${email})`,
      length: 20,
    });

    await usuarioModelo.guardarSecreto2FA(idUsuario, secret.base32);
    const qrDataUrl = await QRCode.toDataURL(secret.otpauth_url);

    await usuarioModelo.insertarAuditoria({
      idUsuario,
      accion: "Generación de nuevo 2FA",
      descripcion: "Se generó un nuevo secreto de autenticación",
      ip: req.ip,
      navegador: req.headers["user-agent"],
    });

    return res.status(201).json({
      mensaje: "2FA generado correctamente",
      qr: qrDataUrl,
      secret: secret.base32,
    });
  } catch (error) {
    console.error("Error generando QR:", error);
    res.status(500).json({ error: "Error generando QR" });
  }
}

async function verificarCodigo(req, res) {
  const { idUsuario, codigo } = req.body;
  try {
    const usuario = await usuarioModelo.obtenerUsuarioPorId(idUsuario);
    const secret = usuario?.TwoFactorSecret;

    if (!secret) {
      console.warn(`⚠️ verificarCodigo: Usuario ${idUsuario} no tiene 2FA configurado.`);
      return res.status(400).json({ error: "No hay 2FA configurado" });
    }

    const verified = speakeasy.totp.verify({
      secret,
      encoding: "base32",
      token: codigo,
      window: 0,
    });

    await usuarioModelo.insertarAuditoria({
      idUsuario,
      accion: "Verificación 2FA",
      descripcion: verified
        ? "Código 2FA correcto"
        : `Código 2FA incorrecto: ${codigo}`,
      ip: req.ip,
      navegador: req.headers["user-agent"],
      exitoso: verified ? 1 : 0,
    });

    if (verified) {
      return res.status(200).json({ ok: true, mensaje: "Código verificado correctamente" });
    } else {
      return res.status(401).json({ ok: false, mensaje: "Código incorrecto o expirado" });
    }
  } catch (error) {
    return res.status(500).json({ error: "Error verificando código 2FA" });
  }
}

async function recuperarPassword(req, res) {
  try {
    const { Email, codigo2FA } = req.body;
    if (!Email) return res.status(400).json({ error: "Debe ingresar su correo" });

    const usuario = await usuarioModelo.buscarUsuarioPorCorreo(Email);
    if (!usuario)
      return res.status(404).json({ error: "Usuario no encontrado" });

    if (usuario.TwoFactorSecret && !codigo2FA) {
      return res.status(200).json({
        requiere2FA: true,
        idUsuario: usuario.IdUsuario,
        mensaje: "Se requiere verificación con Google Authenticator.",
      });
    }

    if (usuario.TwoFactorSecret && codigo2FA) {
      const verified = speakeasy.totp.verify({
        secret: usuario.TwoFactorSecret,
        encoding: "base32",
        token: codigo2FA,
        window: 1,
      });

      await usuarioModelo.insertarAuditoria({
        idUsuario: usuario.IdUsuario,
        accion: "Verificación 2FA para recuperación",
        descripcion: verified
          ? "Código 2FA correcto"
          : "Código 2FA incorrecto al intentar recuperar contraseña",
        ip: req.ip,
        navegador: req.headers["user-agent"],
        exitoso: verified ? 1 : 0,
      });

      if (!verified) {
        return res.status(401).json({ error: "Código 2FA incorrecto o expirado" });
      }
    }

    const codigoRecuperacion = Math.floor(100000 + Math.random() * 900000).toString();
    await usuarioModelo.guardarCodigoRecuperacion(usuario.IdUsuario, codigoRecuperacion);

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: `"StayGo Soporte" <${process.env.SMTP_USER}>`,
      to: Email,
      subject: "Código de recuperación - StayGo",
      html: `<p>Hola ${usuario.Nombre},</p>
             <p>Tu código de recuperación es:</p>
             <h2 style="color:#004D40;">${codigoRecuperacion}</h2>
             <p>Este código expirará en 10 minutos.</p>`,
    });

    await usuarioModelo.insertarAuditoria({
      idUsuario: usuario.IdUsuario,
      accion: "Inicio de recuperación de contraseña",
      descripcion: `Se envió código de recuperación al correo ${Email}`,
      ip: req.ip,
      navegador: req.headers["user-agent"],
    });

    res.json({
      mensaje: "Código enviado correctamente al correo.",
      idUsuario: usuario.IdUsuario,
    });
  } catch (error) {
    console.error("Error en recuperarPassword:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

async function verificarCodigoRecuperacion(req, res) {
  try {
    const { idUsuario, codigo } = req.body;
    if (!idUsuario || !codigo)
      return res.status(400).json({ error: "Faltan datos" });

    const usuario = await usuarioModelo.obtenerUsuarioPorId(idUsuario);
    if (!usuario || !usuario.CodigoRecuperacion)
      return res.status(404).json({ error: "Código no encontrado" });

    if (String(usuario.CodigoRecuperacion).trim() !== String(codigo).trim()) {
      await usuarioModelo.insertarAuditoria({
        idUsuario,
        accion: "Verificación de código de recuperación",
        descripcion: "Código incorrecto",
        ip: req.ip,
        navegador: req.headers["user-agent"],
        exitoso: 0,
      });
      return res.status(401).json({ error: "Código incorrecto o expirado" });
    }

    if (new Date(usuario.ExpiraCodigo) < new Date()) {
      return res.status(401).json({ error: "El código ha expirado" });
    }

    const token = crypto.randomBytes(20).toString("hex");
    const expiraToken = new Date(Date.now() + 10 * 60 * 1000);

    await usuarioModelo.guardarTokenTemporal(idUsuario, token, expiraToken);

    await usuarioModelo.insertarAuditoria({
      idUsuario,
      accion: "Código de recuperación verificado",
      descripcion: "Código correcto, token temporal generado",
      ip: req.ip,
      navegador: req.headers["user-agent"],
    });

    res.json({ ok: true, token });
  } catch (error) {
    console.error("Error en verificarCodigoRecuperacion:", error.message);
    res.status(500).json({ error: error.message });
  }
}

async function restablecerPassword(req, res) {
  try {
    const { token, nuevaClave } = req.body;
    if (!token || !nuevaClave)
      return res.status(400).json({ error: "Faltan datos obligatorios" });

    const usuario = await usuarioModelo.buscarPorToken(token);
    if (!usuario)
      return res.status(404).json({ error: "Token inválido o expirado" });

    if (new Date(usuario.ExpiraToken) < new Date())
      return res.status(403).json({ error: "El token ha expirado" });

    const ClaveHash = await bcrypt.hash(nuevaClave, 10);
    await usuarioModelo.actualizarClave(usuario.IdUsuario, ClaveHash);

    await usuarioModelo.insertarAuditoria({
      idUsuario: usuario.IdUsuario,
      accion: "Restablecimiento de contraseña",
      descripcion: "Contraseña cambiada correctamente",
      ip: req.ip,
      navegador: req.headers["user-agent"],
    });

    res.json({ mensaje: "Contraseña actualizada correctamente" });
  } catch (error) {
    console.error("Error en restablecerPassword:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

async function loginConGoogle(req, res) {
  try {
    const { idToken } = req.body;
    if (!idToken)
      return res.status(400).json({ error: "Token de Google faltante" });

    const { data } = await axios.get(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
    const { email, name, picture, sub: googleId } = data;

    let usuario = await usuarioModelo.buscarUsuarioPorGoogleId(googleId);
    if (!usuario) {
      usuario = await usuarioModelo.buscarUsuarioPorCorreo(email);
    }

    if (!usuario) {
      const nuevo = await usuarioModelo.crearUsuarioGoogle({
        Nombre: name,
        Email: email,
        GoogleId: googleId,
        FotoPerfil: picture,
      });
      usuario = { IdUsuario: nuevo.NuevoIdUsuario, Nombre: name, Email: email };
    }

    await usuarioModelo.actualizarUltimoAcceso(usuario.IdUsuario);

    const token = jwt.sign(
      { id: usuario.IdUsuario, email: usuario.Email },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    await usuarioModelo.insertarAuditoria({
      idUsuario: usuario.IdUsuario,
      accion: "Inicio con Google",
      descripcion: `Login con cuenta Google (${email})`,
      ip: req.ip,
      navegador: req.headers["user-agent"],
    });

    res.json({
      mensaje: "Inicio con Google exitoso",
      token,
      usuario: {
        id: usuario.IdUsuario,
        nombre: usuario.Nombre,
        email: usuario.Email,
        foto: usuario.FotoPerfil || picture,
      },
    });
  } catch (error) {
    console.error("Error en loginConGoogle:", error.message);
    res.status(500).json({ error: "Error al autenticar con Google" });
  }
}

module.exports = {
  loginConGoogle,
  registrarUsuario,
  iniciarSesion,
  generarQR,
  verificarCodigo,
  recuperarPassword,
  verificarCodigoRecuperacion,
  restablecerPassword,
};
