const axios = require('axios');
const fs = require('fs');
const path = require('path');

const tmpDir = path.resolve(__dirname, 'tmp');
if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir);
}

async function handler(conn, { message, args }) {
    const query = args.join(' ');
    if (!query) {
        console.log('No se ingresó un término de búsqueda.');
        return conn.sendMessage(message.key.remoteJid, { text: '💭 *The SukiBOT* te recuerda: Por favor, ingresa un término de búsqueda para el video. 🎬' });
    }

    try {
        console.log(`Buscando video para: ${query}`);
        const searchResponse = await axios.get(`https://eliasar-yt-api.vercel.app/api/search/youtube?query=${encodeURIComponent(query)}`);
        
        console.log('Respuesta de la búsqueda:', searchResponse.data);

        if (searchResponse.data && searchResponse.data.status && searchResponse.data.results.resultado.length > 0) {
            const firstResult = searchResponse.data.results.resultado[0];
            console.log('Primer resultado:', firstResult);

            const messageText = `✨ *The SukiBOT* ha encontrado un resultado: ✨\n\n` +
                                `🎬 *Título:* ${firstResult.title}\n` +
                                `⏳ *Duración:* ${firstResult.duration}\n` +
                                `📅 *Subido:* ${firstResult.uploaded}\n` +
                                `👀 *Vistas:* ${firstResult.views.toLocaleString()}\n\n` +
                                `🔽 *Descargando el video...* 🎥\n` +
                                `🎧 *SukiBOT* está trabajando en ello. ¡Espera un momento, monita~! 💖\n` +
                                `> Si lo quieres en audio, usa /play2 *${firstResult.title}*`;

            const imageUrl = firstResult.thumbnail;

            console.log('Enviando mensaje con imagen y detalles del video...');
            await conn.sendMessage(message.key.remoteJid, { 
                image: { url: imageUrl },
                caption: messageText 
            });

            const downloadResponse = await axios.get(`https://eliasar-yt-api.vercel.app/api/download/youtube?text=${encodeURIComponent(firstResult.url)}&format=mp4`);
            console.log('Respuesta de la descarga:', downloadResponse.data);

            if (downloadResponse.data && downloadResponse.data.status) {
                const title = downloadResponse.data.downloadInfo.title;
                const downloadUrl = downloadResponse.data.downloadInfo.downloadUrl;
                console.log('URL de descarga del video:', downloadUrl);

                const videoPath = path.resolve(tmpDir, `${Date.now()}_video.mp4`);
                const writer = fs.createWriteStream(videoPath);

                const videoStream = await axios({
                    url: downloadUrl,
                    method: 'GET',
                    responseType: 'stream',
                });

                videoStream.data.pipe(writer);

                writer.on('finish', async () => {
                    console.log('Video descargado correctamente en:', videoPath);
                    try {
                        await conn.sendMessage(message.key.remoteJid, {
                            video: { url: videoPath },
                            caption: `🎥 Aquí está el video: *${title}* 💖`
                        });
                        fs.unlinkSync(videoPath);
                    } catch (err) {
                        console.log('Error al intentar cargar el video:', err.message);
                        await conn.sendMessage(message.key.remoteJid, { text: '⚠️ *The SukiBOT* no pudo cargar el archivo. Intenta nuevamente más tarde. ❌' });
                    }
                });
            } else {
                console.log('No se pudo obtener la URL de descarga.');
                await conn.sendMessage(message.key.remoteJid, { text: '⚠️ *The SukiBOT* no pudo obtener el video. Intenta nuevamente más tarde. ❌' });
            }
        } else {
            console.log('No se encontraron resultados.');
            await conn.sendMessage(message.key.remoteJid, { text: '🔍 *The SukiBOT* no encontró resultados para tu búsqueda. Intenta con otro término. 💭' });
        }
    } catch (err) {
        console.log('Error en el proceso:', err.message);
        await conn.sendMessage(message.key.remoteJid, { text: '⚠️ *The SukiBOT* encontró un error al intentar descargar el archivo. Intenta con otro término de búsqueda. ❌' });
    }
}

module.exports = {
    command: 'play2',
    handler,
};