const axios = require('axios');

async function handler(conn, { message }) {
    try {
        const response = await axios.get('https://eliasar-yt-api.vercel.app/api/anime-cosplay');
        if (response.data && response.data.status) {
            const cosplayImage = response.data.image;
            const description = '*Aquí está tu cosplay 🗣️*';

            await conn.sendMessage(message.key.remoteJid, {
                image: { url: cosplayImage },
                caption: description,
            });
        } else {
            await conn.sendMessage(message.key.remoteJid, {
                text: 'No se pudo obtener un cosplay en este momento. Intenta de nuevo más tarde.',
            });
        }
    } catch (err) {
        console.error('Error al obtener la imagen de cosplay:', err.message);
        await conn.sendMessage(message.key.remoteJid, {
            text: 'Hubo un error al procesar tu solicitud. Intenta de nuevo más tarde.',
        });
    }
}

module.exports = {
    command: 'cosplay',
    handler,
};