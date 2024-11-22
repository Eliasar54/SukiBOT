const axios = require('axios');

async function handler(conn, { message, args }) {
    const query = args.join(' ');

    if (!query) {
        return conn.sendMessage(message.key.remoteJid, { text: 'Por favor, ingresa un término de búsqueda para Google.' });
    }

    try {
        const response = await axios.get(`https://eliasar-yt-api.vercel.app/api/google`, {
            params: { query },
        });

        if (response.data && response.data.status) {
            const results = response.data.results;
            if (results.length > 0) {
                let reply = `Resultados de búsqueda para: *${query}*\n\n`;
                results.slice(0, 5).forEach((result, index) => {
                    reply += `${index + 1}. *${result.title}*\n${result.link}\n\n`;
                });
                await conn.sendMessage(message.key.remoteJid, { text: reply });
            } else {
                await conn.sendMessage(message.key.remoteJid, { text: 'No se encontraron resultados para tu búsqueda.' });
            }
        } else {
            await conn.sendMessage(message.key.remoteJid, { text: 'Hubo un problema al realizar la búsqueda. Intenta nuevamente más tarde.' });
        }
    } catch (err) {
        console.error('Error en el comando Google:', err.message);
        await conn.sendMessage(message.key.remoteJid, { text: 'Hubo un error al procesar tu solicitud. Intenta nuevamente más tarde.' });
    }
}

module.exports = {
    command: 'google',
    handler,
};