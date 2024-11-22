const fs = require('fs');
const path = require('path');
const { ownerid } = require('../settings');

module.exports = {
    command: 'guar',
    handler: async (conn, { message, args }) => {
        const from = message.key.remoteJid;
        const sender = message.key.participant || from;

        if (sender !== ownerid) {
            return await conn.sendMessage(from, {
                text: '❌ *Solo el propietario puede guardar nuevos plugins.*',
            });
        }

        if (args.length < 2) {
            return await conn.sendMessage(from, {
                text: '❌ Uso incorrecto. Ejemplo:\n*guar nombre.js > código del archivo*',
            });
        }

        const [filename, ...codeParts] = args.join(' ').split('>');
        const code = codeParts.join('>').trim();

        if (!filename || !code) {
            return await conn.sendMessage(from, {
                text: '❌ Por favor, proporciona un nombre de archivo y el código.',
            });
        }

        try {
            const filePath = path.resolve(__dirname, filename.trim());

            if (fs.existsSync(filePath)) {
                return await conn.sendMessage(from, {
                    text: `❌ El archivo *${filename.trim()}* ya existe. No se sobrescribirá.`,
                });
            }

            fs.writeFileSync(filePath, code, 'utf-8');

            if (!conn.commands) {
                conn.commands = new Map();
            }

            delete require.cache[require.resolve(filePath)];
            const newPlugin = require(filePath);
            conn.commands.set(newPlugin.command, newPlugin.handler);

            await conn.sendMessage(from, {
                text: `✅ El plugin *${filename.trim()}* ha sido guardado y está listo para usarse.`,
            });
        } catch (err) {
            console.error('Error al guardar el plugin:', err);
            await conn.sendMessage(from, {
                text: '❌ Ocurrió un error al intentar guardar el plugin. Verifica el código y vuelve a intentarlo.',
            });
        }
    },
};