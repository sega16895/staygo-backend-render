const cron = require('node-cron');
const axios = require('axios');

const BACKEND_URL = process.env.BASE_URL_API || 'http://localhost:4000/api/reservas/liberar';

cron.schedule('5 0 * * *', async () => {
  try {
    console.log(' Ejecutando liberación automática de habitaciones vencidas...');
    await axios.put(BACKEND_URL);
    console.log(' Habitaciones vencidas liberadas correctamente.');
  } catch (err) {
    console.error(' Error en liberación automática:', err.message);
  }
});
