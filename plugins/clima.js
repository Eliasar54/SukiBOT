const axios = require('axios');

module.exports = {
    command: 'clima',
    handler: async (conn, { message, args }) => {
        const from = message.key.remoteJid;
        const city = args.join(' ').trim() || 'Estados';
        const apiURL = `https://api.dorratz.com/v2/clima-s?city=${encodeURIComponent(city)}`;

        try {
            const response = await axios.get(apiURL);
            const data = response.data;

            if (data && data.weather) {
                const reply = `🌤️ *The SukiBOT - Clima en ${data.location}*\n\n` +
                    `🌍 *País:* ${data.country}\n` +
                    `🌦️ *Clima:* ${data.weather}\n` +
                    `🌡️ *Temperatura:* ${data.temperature}\n` +
                    `🔻 *Mínima:* ${data.minimumTemperature}\n` +
                    `🔺 *Máxima:* ${data.maximumTemperature}\n` +
                    `💧 *Humedad:* ${data.humidity}\n` +
                    `🌬️ *Viento:* ${data.wind}`;

                await conn.sendMessage(from, { text: reply });
            } else {
                await conn.sendMessage(from, { text: '⚠️ No se pudo obtener el clima. Intenta de nuevo más tarde.' });
            }
        } catch (err) {
            await conn.sendMessage(from, { text: '❌ Error al obtener el clima. Por favor, verifica la ciudad.' });
            console.error(err.message);
        }
    }
};