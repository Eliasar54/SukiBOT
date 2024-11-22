const fs = require('fs');
const path = require('path');
const os = require('os');

const tmpFolder = os.tmpdir();

module.exports = {
    command: 's',
    handler: async (conn, { message }) => {
        const { key, message: msgContent } = message;
        const from = key.remoteJid;
        const quoted = msgContent?.extendedTextMessage?.contextInfo?.quotedMessage;
        const mime = quoted?.imageMessage?.mimetype || quoted?.videoMessage?.mimetype;

        if (!quoted || !mime) {
            await conn.sendMessage(from, { text: 'Responde a una imagen o video con el comando.' });
            return;
        }

        try {
            const media = await conn.downloadMediaMessage(quoted);
            const filePath = path.join(tmpFolder, `media_${Date.now()}`);
            const packname = global.packname || 'EliasarYT';
            const author = global.author || 'The SukiBOT';

            if (/image/.test(mime)) {
                const encmedia = await conn.sendImageAsSticker(from, media, message, { packname, author });
                await fs.unlinkSync(encmedia);
            } else if (/video/.test(mime)) {
                if ((quoted?.videoMessage?.seconds || 0) > 20) {
                    await conn.sendMessage(from, { text: 'El video no puede durar más de 20 segundos.' });
                    return;
                }

                const encmedia = await conn.sendVideoAsSticker(from, media, message, { packname, author });
                await new Promise((resolve) => setTimeout(resolve, 2000));
                await fs.unlinkSync(encmedia);
            } else {
                await conn.sendMessage(from, { text: 'Formato no soportado. Usa una imagen o video.' });
            }
        } catch (err) {
            await conn.sendMessage(from, { text: 'Ocurrió un error procesando tu solicitud.' });
        }
    },
};