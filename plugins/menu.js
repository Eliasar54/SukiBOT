const fs = require('fs');
const path = require('path');
const { users, comads } = require('../main.js');

const sendMessage = async (conn, to, message, type = 'text', caption = '') => {
    if (type === 'text') {
        await conn.sendMessage(to, { text: message });
    } else if (type === 'image') {
        const imageBuffer = fs.readFileSync(message);
        await conn.sendMessage(to, { image: imageBuffer, caption });
    } else {
        await conn.sendMessage(to, { text: 'Tipo de mensaje no soportado.' });
    }
};

async function handler(conn, { message }) {
    const botPrefix = '/';
    const waitMessage = "*🌸 Espera un momento, monita~*\n\n> 💖 No hagas spam, ¿sí?";
    await sendMessage(conn, message.key.remoteJid, waitMessage, 'text');

    const currentFile = path.basename(__filename);
    const files = fs.readdirSync(__dirname)
        .filter(file => file !== currentFile && file.endsWith('.js'))
        .map(file => file.replace('.js', ''));

    const totalPlugins = files.length;
    let dynamicMenu = '';
    for (const file of files) {
        dynamicMenu += `   ➻ ${botPrefix}${file}\n`;
    }

    const menu = `
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

    const imagePath = './media/menu.jpg';

    try {
        await sendMessage(conn, message.key.remoteJid, imagePath, 'image', menu);
    } catch (err) {
        console.log('Error al enviar el menú:', err);
        await sendMessage(conn, message.key.remoteJid, 'Error al enviar el menú.', 'text');
    }
}

module.exports = {
    command: 'menu',
    handler,
};