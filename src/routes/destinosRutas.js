const express = require("express");
const router = express.Router();
const sql = require("mssql");
const dbConfig = require("../config/db");

router.get("/", async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request().execute("sp_listarDestinosFavoritos");
    res.json(result.recordset);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener destinos: " + error.message });
  }
});

router.get("/catalogo", async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request().execute("sp_catalogoDestinos");
    res.json(result.recordset);
  } catch (error) {
    console.error("❌ Error al obtener catálogo de destinos:", error);
    res.status(500).json({ error: "Error al obtener el catálogo de destinos: " + error.message });
  }
});

module.exports = router;
