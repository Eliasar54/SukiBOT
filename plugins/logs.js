const { exec } = require('child_process');
const { ownerid } = require('../settings');

module.exports = {
    command: 'logs',
    handler: async (conn, { message, args }) => {
        const from = message.key.remoteJid;
        const sender = message.key.participant || from;

        if (sender !== ownerid) {
            return await conn.sendMessage(from, {
                text: '❌ *Solo el propietario puede ver los logs.*',
            });
        }

        exec('dmesg | tail -n 10', async (error, stdout, stderr) => {
            if (error) {
                return await conn.sendMessage(from, {
                    text: `❌ *Error al obtener los logs:*\n${error.message}`,
                });
            }

            if (stderr) {
                return await conn.sendMessage(from, {
                    text: `❌ *Error en los logs:*\n${stderr}`,
                });
            }

            return await conn.sendMessage(from, {
                text: `📝 *Últimos mensajes de la terminal:*\n\`\`\`\n${stdout}\n\`\`\``,
            });
        });
    },
};