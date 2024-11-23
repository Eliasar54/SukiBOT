const fs = require('fs');
const path = require('path');
const { users, comads } = require('../main.js');

const sendMessage = async (conn, to, message, options = {}, additionalOptions = {}) => {
    try {
        await conn.sendMessage(to, message, additionalOptions);
    } catch (error) {
        console.error('Error enviando el mensaje:', error);
    }
};

async function handler(conn, { message }) {
    const botPrefix = '/';
    const waitMessage = "*🌸 Espera un momento, monita~*\n\n> 💖 No hagas spam, ¿sí?";
    await sendMessage(conn, message.key.remoteJid, { text: waitMessage });

    const currentFile = path.basename(__filename);
    const files = fs.readdirSync(__dirname)
        .filter(file => file !== currentFile && file.endsWith('.js'))
        .map(file => file.replace('.js', ''));

    const totalPlugins = files.length;
    let dynamicMenu = '';
    for (const file of files) {
        dynamicMenu += `   ➻ ${botPrefix}${file}\n`;
    }

    const menuCaption = `
━━━━━━━━━━━━━━━
*✨ 𝑺𝒖𝒌𝒊𝒃𝒐𝒕 𝑴𝑬𝑵𝑼*
   ➻ Usuarios: ${users}
   ➻ Comandos ejecutados: ${comads}
   ➻ Total plugins: ${totalPlugins}
   ➻ Prefijo actual: ${botPrefix}
━━━━━━━━━━━━━━━
*📂 𝑪𝒐𝒎𝒂𝒏𝒅𝒐𝒔 𝑫𝒊𝒔𝒑𝒐𝒏𝒊𝒃𝒍𝒆𝒔*
${dynamicMenu}━━━━━━━━━━━━━━━
`;

    try {
        const thumbnailBuffer = fs.readFileSync('./media/menu.jpg');

        const menuMessage = {
            text: menuCaption,
            contextInfo: {
                externalAdReply: {
                    title: 'SukiBOT',
                    body: 'Opciones del bot',
                    thumbnail: thumbnailBuffer,
                    mediaType: 1,
                    sourceUrl: 'https://whatsapp.com/channel/0029VasWDKr8fewr4GjSb31g'
                }
            }
        };

        await sendMessage(conn, message.key.remoteJid, menuMessage, { quoted: message });
    } catch (err) {
        console.log('Error al enviar el menú:', err);
        await sendMessage(conn, message.key.remoteJid, { text: 'Error al enviar el menú.' });
    }
}

module.exports = {
    command: 'menu',
    handler,
};