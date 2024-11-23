const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function handler(conn, { message, args }) {
    const query = args.join(' ');
    if (!query) {
        return conn.sendMessage(message.key.remoteJid, { text: '💭 *The SukiBOT* te recuerda: Por favor, ingresa un término de búsqueda para el video. 🎬' });
    }

    try {
        const searchResponse = await axios.get(`https://eliasar-yt-api.vercel.app/api/search/youtube?query=${encodeURIComponent(query)}`);
        if (searchResponse.data && searchResponse.data.status && searchResponse.data.results.resultado.length > 0) {
            const firstResult = searchResponse.data.results.resultado[0];

            const messageText = `✨ *The SukiBOT* ha encontrado un resultado: ✨\n\n` +
                                `🎬 *Título:* ${firstResult.title}\n` +
                                `⏳ *Duración:* ${firstResult.duration}\n` +
                                `📅 *Subido:* ${firstResult.uploaded}\n` +
                                `👀 *Vistas:* ${firstResult.views.toLocaleString()}\n\n` +
                                `🔽 *Descargando el video...* 🎥\n\n` +
                                `🎧 *The SukiBOT* se está encargando de todo para ti. ¡Espera un momento, monita~! 💖\n` +
                                `> Si lo desea en solo audio, use */play* *${firstResult.title}*`;

            const imageUrl = firstResult.thumbnail;

            await conn.sendMessage(message.key.remoteJid, { 
                image: { url: imageUrl },
                caption: messageText 
            });

            const videoDownloadUrl = await getVideoDownloadUrl(firstResult.url);

            if (videoDownloadUrl) {
                await sendVideoAsFile(conn, message, videoDownloadUrl, firstResult.title);
            } else {
                throw new Error('No se pudo obtener el video.');
            }
        } else {
            await conn.sendMessage(message.key.remoteJid, { text: '🔍 *The SukiBOT* no encontró resultados para tu búsqueda. Intenta con otro término. 💭' });
        }
    } catch (err) {
        await conn.sendMessage(message.key.remoteJid, { text: '⚠️ *The SukiBOT* encontró un error al intentar descargar el archivo de video. Intenta con otro término de búsqueda. ❌' });
    }
}

async function getVideoDownloadUrl(videoUrl) {
    const apiUrl = `https://api.nyxs.pw/dl/yt-direct?url=${encodeURIComponent(videoUrl)}`;

    try {
        const response = await axios.get(apiUrl);
        if (response.data && response.data.status) {
            return response.data.result.urlVideo;
        }
    } catch (err) {
        console.error("Error al obtener la URL de descarga del video:", err);
    }

    return null;
}

async function sendVideoAsFile(conn, message, videoUrl, videoTitle) {
    const sanitizedTitle = videoTitle.replace(/[<>:"/\\|?*\x00-\x1F]/g, '');
    const videoPath = path.resolve(__dirname, `${Date.now()}_${sanitizedTitle}.mp4`);

    try {
        const writer = fs.createWriteStream(videoPath);
        const videoStream = await axios({
            url: videoUrl,
            method: 'GET',
            responseType: 'stream',
        });

        videoStream.data.pipe(writer);

        await new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });

        await conn.sendMessage(message.key.remoteJid, {
            document: { url: videoPath },
            mimetype: 'video/mp4',
            fileName: `${sanitizedTitle}.mp4`
        });

        fs.unlinkSync(videoPath);
    } catch (err) {
        await conn.sendMessage(message.key.remoteJid, { text: '⚠️ *The SukiBOT* no pudo enviar el archivo de video. Intenta nuevamente. ❌' });
    }
}

module.exports = {
    command: 'play2',
    handler,
};
