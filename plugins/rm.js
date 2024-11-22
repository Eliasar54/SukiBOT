const fs = require('fs');
const path = require('path');
const { ownerid } = require('../settings');

module.exports = {
    command: 'rm',
    handler: async (conn, { message, args }) => {
        const from = message.key.remoteJid;
        const sender = message.key.participant || from;

        if (sender !== ownerid) {
            return await conn.sendMessage(from, {
                text: '❌ *Solo el propietario puede borrar archivos.*',
            });
        }

        if (args.length === 0) {
            return await conn.sendMessage(from, {
                text: '❌ *Por favor, proporciona la ruta del archivo a borrar.*\nEjemplo: `/rm ../main.js` o `/rm play.js`',
            });
        }

        const filePath = path.resolve(__dirname, args.join(' ').trim());

        try {
            if (!fs.existsSync(filePath)) {
                return await conn.sendMessage(from, {
                    text: `❌ *El archivo "${args.join(' ').trim()}" no existe.*`,
                });
            }

            fs.unlinkSync(filePath);

            return await conn.sendMessage(from, {
                text: `✅ *El archivo "${args.join(' ').trim()}" ha sido borrado correctamente.*`,
            });
        } catch (err) {
            console.error('Error al borrar el archivo:', err);
            return await conn.sendMessage(from, {
                text: '❌ *Ocurrió un error al intentar borrar el archivo.*',
            });
        }
    },
};