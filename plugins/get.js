const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { ownerid } = require('../settings');

module.exports = {
    command: 'get',
    handler: async (conn, { message, args }) => {
        const from = message.key.remoteJid;
        const sender = message.key.participant || from;

        if (sender !== ownerid) {
            return await conn.sendMessage(from, {
                text: '❌ *Solo el propietario puede usar este comando.*',
            });
        }

        if (args.length === 0) {
            return await conn.sendMessage(from, {
                text: '❌ *Por favor, proporciona una URL.*\nEjemplo: `/get https://example.com`',
            });
        }

        const url = args[0];
        const filename = path.basename(new URL(url).pathname) || 'archivo.html';

        try {
            const response = await axios({
                url,
                method: 'GET',
                responseType: 'arraybuffer',
            });

            const contentType = response.headers['content-type'];

            if (contentType.startsWith('image') || contentType.startsWith('video') || contentType.startsWith('application')) {
                const filePath = path.resolve(__dirname, filename);
                fs.writeFileSync(filePath, response.data);

                await conn.sendMessage(from, {
                    text: `✅ *Archivo descargado correctamente:* ${filename}`,
                });

                const mediaType = contentType.startsWith('image')
                    ? 'image'
                    : contentType.startsWith('video')
                    ? 'video'
                    : 'document';

                const media = fs.readFileSync(filePath);

                await conn.sendMessage(from, {
                    [mediaType]: media,
                    mimetype: contentType,
                    fileName: filename,
                    caption: `📥 *Archivo descargado desde:* ${url}`,
                });

                fs.unlinkSync(filePath);
            } else {
                const text = response.data.toString('utf-8').slice(0, 4000); // Limita el texto para WhatsApp
                await conn.sendMessage(from, {
                    text: `🌐 *Contenido de la página web:*\n\n${text}`,
                });
            }
        } catch (err) {
            console.error('Error al obtener la URL:', err);
            await conn.sendMessage(from, {
                text: `❌ *No se pudo obtener la URL:* ${url}\n${err.message}`,
            });
        }
    },
};