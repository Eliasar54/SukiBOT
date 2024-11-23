const { exec } = require('child_process');
const { ownerid } = require('../settings');
const path = require('path');

module.exports = {
    command: 'update',
    handler: async (conn, { message, args }) => {
        const from = message.key.remoteJid;
        const sender = message.key.participant || from;

        if (sender !== ownerid) {
            return await conn.sendMessage(from, {
                text: '❌ *Solo el propietario puede ejecutar el comando de actualización.*',
            });
        }

        await conn.sendMessage(from, {
            text: '🔄 *Iniciando actualización...*',
        });

        const botDirectory = path.join(__dirname, '..');

        exec('git pull origin main', { cwd: botDirectory }, async (error, stdout, stderr) => {
            if (error) {
                return await conn.sendMessage(from, {
                    text: `❌ *Error al actualizar:*\n${error.message}`,
                });
            }

            if (stderr) {
                return await conn.sendMessage(from, {
                    text: `❌ *Error en la actualización:*\n${stderr}`,
                });
            }

            return await conn.sendMessage(from, {
                text: `✅ *Actualización exitosa:*\n\`\`\`\n${stdout}\n\`\`\``,
            });
        });
    },
};