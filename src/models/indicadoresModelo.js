const axios = require("axios");

const IndicadoresModelo = {
  async obtenerTipoCambio() {
    const baseUrl = "https://apim.bccr.fi.cr/";
    const token =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJCQ0NSLVNEREUiLCJzdWIiOiJtZWlkb25jaXRvQGdtYWlsLmNvbSIsImF1ZCI6IlNEREUtU2l0aW9FeHRlcm5vIiwiZXhwIjoyNTM0MDIzMDA4MDAsIm5iZiI6MTc2MjcxMTI1NSwiaWF0IjoxNzYyNzExMjU1LCJqdGkiOiIyOTRhYmM4Zi1kYTdkLTQ3OWYtOGQyNS05NGU3M2Q1NzFiNTYiLCJlbWFpbCI6Im1laWRvbmNpdG9AZ21haWwuY29tIn0.LtsVTOLHO9-mZY30WLbsVDFeGuOphneajbddL63mNno";

    const headers = {
      Authorization: `Bearer ${token}`,
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    };

    const endpoint = "SDDE/api/Bccr.GE.SDDE.Publico.Indicadores.API/cuadro/1/series";
    const hoy = new Date();
    const fecha = hoy.toISOString().split("T")[0].replace(/-/g, "/"); 

    const params = {
      fechaInicio: fecha,
      fechaFin: fecha,
      idioma: "ES",
    };

    try {
      const response = await axios.get(baseUrl + endpoint, { headers, params });
      const data = response.data;

      if (!data || !data.datos || !data.datos.length) {
        throw new Error("El BCCR no devolvió datos válidos.");
      }

      const indicadores = data.datos[0].indicadores;
      const compra = indicadores
        .find((i) => i.codigoIndicador === "317")
        ?.series?.[0]?.valorDatoPorPeriodo;
      const venta = indicadores
        .find((i) => i.codigoIndicador === "318")
        ?.series?.[0]?.valorDatoPorPeriodo;

      if (!compra || !venta) {
        throw new Error("No se encontraron valores de tipo de cambio.");
      }

      return {
        fecha: data.datos[0].fechaInicio || fecha,
        tipoCambio: {
          compra: parseFloat(compra),
          venta: parseFloat(venta),
        },
      };
    } catch (error) {
      console.error("❌ Error al obtener tipo de cambio:", error.message);
      throw new Error("Error al conectar con el BCCR: " + error.message);
    }
  },
};

module.exports = IndicadoresModelo;
