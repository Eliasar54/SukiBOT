const axios = require('axios');

async function handler(conn, { message, args }) {
    const query = args.join(' ');
    if (!query) {
        return conn.sendMessage(message.key.remoteJid, { text: 'Por favor, ingresa una búsqueda.' });
    }

    const response = await axios.get(`https://miyanapi.vercel.app/bingSearch?query=${query}`);
    const searchResults = response.data.data
        .map((item, i) => `${i + 1}. *${item.Description}*\nLink: ${item.link}`)
        .join('\n\n');

    conn.sendMessage(message.key.remoteJid, { text: searchResults });
}

module.exports = {
    command: 'bingsearch',
    handler
};