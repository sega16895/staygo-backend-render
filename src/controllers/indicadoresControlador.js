const axios = require("axios");
const IndicadoresModelo = require("../models/indicadoresModelo");
const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJCQ0NSLVNEREUiLCJzdWIiOiJtZWlkb25jaXRvQGdtYWlsLmNvbSIsImF1ZCI6IlNEREUtU2l0aW9FeHRlcm5vIiwiZXhwIjoyNTM0MDIzMDA4MDAsIm5iZiI6MTc2MjcxMTI1NSwiaWF0IjoxNzYyNzExMjU1LCJqdGkiOiIyOTRhYmM4Zi1kYTdkLTQ3OWYtOGQyNS05NGU3M2Q1NzFiNTYiLCJlbWFpbCI6Im1laWRvbmNpdG9AZ21haWwuY29tIn0.LtsVTOLHO9-mZY30WLbsVDFeGuOphneajbddL63mNno";

const IndicadoresController = {
  async tipoCambio(req, res) {
    try {
      const data = await IndicadoresModelo.obtenerTipoCambio();
      res.json(data);
    } catch (error) {
      res.status(500).json({
        mensaje: "Error al obtener tipo de cambio del BCCR.",
        detalle: error.message,
      });
    }
  },

  async obtenerHistorialTipoCambio(req, res) {
    try {
      const { fechaInicio, fechaFin } = req.query;
      const response = await axios.get(
        "https://apim.bccr.fi.cr/SDDE/api/Bccr.GE.SDDE.Publico.Indicadores.API/cuadro/1/series",
        {
          headers: {
            Authorization: `Bearer ${TOKEN}`,
            "User-Agent": "Mozilla/5.0",
          },
          params: { fechaInicio, fechaFin, idioma: "ES" },
        }
      );

      const data = response.data;
      if (!data?.datos?.length) {
        return res.status(404).json({ error: "Sin datos disponibles" });
      }

      const indicadores = data.datos[0].indicadores;
      const compra = indicadores.find(i => i.codigoIndicador === "317")?.series || [];
      const venta = indicadores.find(i => i.codigoIndicador === "318")?.series || [];

      const historial = compra.map((c, i) => ({
        fecha: c.fecha,
        compra: c.valorDatoPorPeriodo,
        venta: venta[i]?.valorDatoPorPeriodo ?? null,
      }));

      res.json(historial);
    } catch (err) {
      console.error("Error BCCR:", err.message);
      res.status(500).json({ error: "Error al consultar el BCCR" });
    }
  },
};

module.exports = IndicadoresController;
