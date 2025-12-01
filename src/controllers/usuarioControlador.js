const usuarioModelo = require("../models/usuarioModelo");

async function obtenerUsuario(req, res) {
  try {
    const { id } = req.params;
    const usuario = await usuarioModelo.obtenerUsuarioPorId(id);
    if (!usuario) return res.status(404).json({ mensaje: "Usuario no encontrado" });
    res.json(usuario);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function actualizarUsuario(req, res) {
  try {
    const datosUsuario = { ...req.body, IdUsuario: parseInt(req.params.id) };
    const actualizado = await usuarioModelo.actualizarUsuario(datosUsuario);
    res.json(actualizado);
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar usuario: " + error.message });
  }
}

async function obtenerPaises(req, res) {
  try {
    const data = await usuarioModelo.listarPaises();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function obtenerProvincias(req, res) {
  try {
    const data = await usuarioModelo.listarProvincias(req.params.idPais);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function obtenerCantones(req, res) {
  try {
    const data = await usuarioModelo.listarCantones(req.params.idProvincia);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}


async function obtenerDistritos(req, res) {
  try {
    const data = await usuarioModelo.obtenerDistritos(req.params.idCanton);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function obtenerDestinos(req, res) {
  try {
    const data = await usuarioModelo.listarDestinosFavoritos();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function actualizarDatosPago(req, res) {
  try {
    const datos = {
      IdUsuario: parseInt(req.params.id),
      DocumentoIdentidad: req.body.DocumentoIdentidad,
      DireccionFacturacion: req.body.DireccionFacturacion,
      CodigoPostal: req.body.CodigoPostal,
      MetodoPagoPreferido: req.body.MetodoPagoPreferido,
      IdClientePasarela: req.body.IdClientePasarela
    };

    const actualizado = await usuarioModelo.actualizarDatosPago(datos);
    res.json({ mensaje: "Datos de pago actualizados correctamente", actualizado });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function obtenerDatosPago(req, res) {
  try {
    const { id } = req.params;
    const datos = await usuarioModelo.obtenerDatosPago(id);
    if (!datos) return res.status(404).json({ mensaje: "Datos de pago no encontrados" });
    res.json(datos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  obtenerUsuario,
  actualizarUsuario,
  obtenerPaises,
  obtenerProvincias,
  obtenerCantones,
  obtenerDistritos,
  obtenerDestinos,
  actualizarDatosPago,
  obtenerDatosPago
};
