const { getConnection, sql } = require('../config/db');

const ResenasModelo = {
  async listarPorHotel(idHotel) {
    const pool = await getConnection();
    const result = await pool.request()
      .input('IdHotel', sql.Int, idHotel)
      .execute('sp_obtenerResenas');
    return result.recordset;
  },

  async agregarResena(data) {
    const pool = await getConnection();
    await pool.request()
      .input('IdUsuario', sql.Int, data.idUsuario)
      .input('IdHotel', sql.Int, data.idHotel)
      .input('Calificacion', sql.Int, data.calificacion)
      .input('Comentario', sql.NVarChar(500), data.comentario)
      .execute('sp_AgregarResena');
  },

  async resumenPorHotel(idHotel) {
    const pool = await getConnection();
    const result = await pool.request()
      .input('IdHotel', sql.Int, idHotel)
      .execute('sp_resumenResenas');
    return result.recordset[0];
  },

  async actualizarResena({ idResena, idUsuario, calificacion, comentario }) {
    const pool = await getConnection();
    const result = await pool.request()
      .input("IdResena", sql.Int, idResena)
      .input("IdUsuario", sql.Int, idUsuario)
      .input("Calificacion", sql.Int, calificacion)
      .input("Comentario", sql.NVarChar(500), comentario)
      .execute("sp_ActualizarResena");
    return result.recordset[0];
  },

  async eliminarResena({ idResena, idUsuario }) {
    const pool = await getConnection();
    const result = await pool.request()
      .input("IdResena", sql.Int, idResena)
      .input("IdUsuario", sql.Int, idUsuario)
      .execute("sp_EliminarResena");
    return result.recordset[0];
  },
  //API PARA CONSUMO EXTERNO
  async listarPublicasPorHotel(idHotel) {
  const pool = await getConnection();
  const result = await pool.request()
    .input('IdHotel', sql.Int, idHotel)
    .execute('sp_obtenerResenasPublicas');
  return result.recordset;
}

};

module.exports = ResenasModelo;
