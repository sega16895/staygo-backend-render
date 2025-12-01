const { getConnection, sql } = require("../config/db");

const DestinosModelo = {
  async obtenerCatalogoDestinos() {
    const pool = await getConnection();
    const result = await pool.request().execute("sp_catalogoDestinos");
    return result.recordset;
  },
};

module.exports = DestinosModelo;
