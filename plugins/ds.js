const fs = require('fs');
const path = require('path');
const { ownerid, botname } = require('../settings');

module.exports = {
    command: 'ds',
    handler: async (conn, { message }) => {
        const from = message.key.remoteJid;
        const sender = message.key.participant || from;

        if (sender !== ownerid) {
            return await conn.sendMessage(from, {
                text: `❌ Solo el *propietario* de ${botname} puede ejecutar este comando.`,
            });
        }

        try {
            const sessionsPath = path.resolve(__dirname, '../sessions');

            if (!fs.existsSync(sessionsPath)) {
                return await conn.sendMessage(from, {
                    text: '❌ ¡Error! La carpeta *sessions* no existe.',
                });
            }

            const files = fs.readdirSync(sessionsPath);

            const unnecessaryFiles = files.filter((file) => file !== 'creds.json');

            if (unnecessaryFiles.length === 0) {
                return await conn.sendMessage(from, {
                    text: '✅ *No se encontraron archivos innecesarios* para borrar. ¡Todo en orden!',
                });
            }

            unnecessaryFiles.forEach((file) => {
                fs.unlinkSync(path.join(sessionsPath, file));
            });

            await conn.sendMessage(from, {
                text: `🗑️ *Sesiones eliminadas con éxito*:\n${unnecessaryFiles.map(file => `- ${file}`).join('\n')}\n\n¡Todo listo para *${botname}*! 🤖✨`,
            });

            await conn.sendMessage(from, {
                text: '*Hola, puedes verme.*',
            });
        } catch (err) {
            await conn.sendMessage(from, {
                text: '❌ Ocurrió un error al intentar eliminar las sesiones. Por favor, intenta de nuevo.',
            });
        }
    },
};