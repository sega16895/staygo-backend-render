const { getPool } = require('../config/db');

module.exports = {
  crear: async ({ idUsuario, idOrden, monto, moneda, idPasarela, estado }) => {
    const pool = await getPool();
    const request = pool.request();
    request.input('IdUsuario', idUsuario);
    request.input('IdOrden', idOrden);
    request.input('Monto', monto);
    request.input('Moneda', moneda);
    request.input('IdPasarela', idPasarela);
    request.input('Estado', estado);
    const result = await request.execute('sp_guardarTransaccion');

    return result.recordset && result.recordset[0] ? result.recordset[0].IdNuevaTransaccion : null;
  },

  actualizarPorPasarela: async (idPasarela, estado, respuestaJson) => {
    const pool = await getPool();
    const request = pool.request();
    request.input('IdPasarela', idPasarela);
    request.input('Estado', estado);
    request.input('RespuestaJson', respuestaJson);
    const result = await request.execute('sp_actualizarTransaccion');
    return result.recordset && result.recordset[0] ? result.recordset[0].FilasAfectadas : 0;
  }
};
