const { getConnection } = require('../config/db');
const sql = require('mssql');

const FavoritoModelo = {
  async agregarFavorito({ idUsuario, idHotel }) {
    const pool = await getConnection();
    const request = pool.request();
    request.input('IdUsuario', sql.Int, idUsuario);
    request.input('IdHotel', sql.Int, idHotel);

    const result = await request.execute('sp_AgregarFavorito');
    const data = result.recordset && result.recordset[0];
    return data || null;
  },

  async eliminarFavorito({ idUsuario, idHotel }) {
    const pool = await getConnection();
    const request = pool.request();
    request.input('IdUsuario', sql.Int, idUsuario);
    request.input('IdHotel', sql.Int, idHotel);

    const result = await request.execute('sp_EliminarFavorito');
    const data = result.recordset && result.recordset[0];
    return data ? data.DeletedRows > 0 : false;
  },

  async obtenerFavoritosUsuario({ idUsuario }) {
    const pool = await getConnection();
    const request = pool.request();
    request.input('IdUsuario', sql.Int, idUsuario);
    const result = await request.execute('sp_ObtenerFavoritosUsuario');
    return result.recordset || [];
  },

  async esFavorito({ idUsuario, idHotel }) {
    const pool = await getConnection();
    const request = pool.request();
    request.input('IdUsuario', sql.Int, idUsuario);
    request.input('IdHotel', sql.Int, idHotel);
    const result = await request.query(
      'SELECT COUNT(1) AS cnt FROM Favoritos WHERE IdUsuario = @IdUsuario AND IdHotel = @IdHotel'
    );
    const cnt = result.recordset && result.recordset[0] ? result.recordset[0].cnt : 0;
    return cnt > 0;
  }
};

module.exports = FavoritoModelo;
