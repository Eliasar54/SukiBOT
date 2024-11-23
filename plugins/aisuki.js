const axios = require('axios');

async function handler(conn, { message, args }) {
    const query = args.join(' ');

    if (!query) {
        return conn.sendMessage(message.key.remoteJid, {
            text: 'Por favor, ingresa un texto para generar la imagen.',
        });
    }

    try {
        const promptText = query;
        const captionPrompt = `actuaras como SukiBot un bot de WhatsApp hecho desde 0 por EliasarYT y responderás como si creaste una imagen de: ${promptText}`;

        const imageResponse = await axios.get(
            `https://eliasar-yt-api.vercel.app/api/ai/text2img?prompt=${encodeURIComponent(promptText)}`,
            { responseType: 'arraybuffer' }
        );

        if (imageResponse.status === 200) {
            const imageBuffer = Buffer.from(imageResponse.data, 'binary');

            const captionResponse = await axios.get(
                `https://eliasar-yt-api.vercel.app/api/chatgpt?text=hola&prompt=${encodeURIComponent(captionPrompt)}`
            );

            const caption = captionResponse.data?.status
                ? captionResponse.data.response || 'Aquí está tu imagen.'
                : 'Aquí está tu imagen.';

            await conn.sendMessage(message.key.remoteJid, {
                image: imageBuffer,
                caption: caption,
            });
        } else {
            await conn.sendMessage(message.key.remoteJid, {
                text: 'No se pudo generar la imagen en este momento. Intenta de nuevo más tarde.',
            });
        }
    } catch (err) {
        console.log('Error al procesar la solicitud:', err.message);
        console.error(err); // Incluye detalles del error
        await conn.sendMessage(message.key.remoteJid, {
            text: 'Hubo un error al procesar tu solicitud. Intenta de nuevo más tarde.',
        });
    }
}

module.exports = {
    command: 'aisuki',
    handler,
};