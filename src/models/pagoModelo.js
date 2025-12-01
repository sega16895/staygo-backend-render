const sql = require('mssql');
const { getConnection } = require('../config/db');

const pagoModelo = {

  async guardarTransaccion({ IdUsuario, IdReserva, MetodoPago, Monto }) {
    try {
      const pool = await getConnection();

      const result = await pool.request()
        .input('IdUsuario', sql.Int, IdUsuario)
        .input('IdOrden', sql.VarChar(50), `RES-${IdReserva}`)
        .input('Monto', sql.Money, Monto)
        .input('Moneda', sql.VarChar(10), 'USD')
        .input('IdPasarela', sql.VarChar(50), MetodoPago)
        .input('Estado', sql.VarChar(20), 'Completado')
        .execute('sp_guardarTransaccion');

      const idTransaccion = result.recordset[0]?.IdNuevaTransaccion ?? null;
      return idTransaccion;
    } catch (err) {
      console.error(' Error en pagoModelo.guardarTransaccion:');
      console.error('Mensaje:', err.message);
      console.error('Stack:', err.stack);
      if (err.precedingErrors) console.error('Errores previos:', err.precedingErrors);
      throw new Error('Error al guardar la transacción');
    }
  },

  async actualizarEstadoPago(IdReserva) {
    const pool = await getConnection();
    const result = await pool.request()
      .input('IdReserva', sql.Int, IdReserva)
      .input('Estado', sql.VarChar(20), 'Confirmada')
      .execute('sp_actualizarEstadoPago');

    const filas = result.recordset[0]?.FilasAfectadas ?? 0;
    if (filas === 0) console.warn('No se actualizó ningún registro en actualizarEstadoPago');
    return filas;
  }


};

module.exports = pagoModelo;
