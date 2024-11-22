const { exec } = require('child_process');
const { ownerid } = require('../settings');

module.exports = {
    command: 'trm',
    handler: async (conn, { message, args }) => {
        const from = message.key.remoteJid;
        const sender = message.key.participant || from;

        if (sender !== ownerid) {
            return await conn.sendMessage(from, {
                text: '❌ *Solo el propietario puede ejecutar comandos en la terminal.*',
            });
        }

        if (args.length === 0) {
            return await conn.sendMessage(from, {
                text: '❌ *Por favor, proporciona un comando para ejecutar.*\nEjemplo: `/trm ls`',
            });
        }

        const command = args.join(' ');
        try {
            exec(command, (error, stdout, stderr) => {
                if (error) {
                    return conn.sendMessage(from, {
                        text: `❌ *Error al ejecutar el comando:*\n${error.message}`,
                    });
                }

                const output = stdout || stderr;
                return conn.sendMessage(from, {
                    text: `✅ *Resultado del comando:*\n\`\`\`\n${output}\n\`\`\``,
                });
            });
        } catch (err) {
            await conn.sendMessage(from, {
                text: '❌ *Ocurrió un error inesperado al intentar ejecutar el comando.*',
            });
        }
    },
};