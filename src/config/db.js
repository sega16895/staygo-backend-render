const sql = require("mssql");
require("dotenv").config();

const dbSettings = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  port: parseInt(process.env.DB_PORT),
  options: {
    encrypt: true,               // ✔️ Requerido por Azure SQL
    trustServerCertificate: false,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
  connectionTimeout: 30000,
  requestTimeout: 60000,
};

async function getConnection() {
  try {
    const pool = await sql.connect(dbSettings);
    return pool;
  } catch (err) {
    console.error(" Error de conexión a SQL Server:", err.message);
    throw err;
  }
}

module.exports = { getConnection, sql };
