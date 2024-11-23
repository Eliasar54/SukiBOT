const axios = require('axios');

async function handler(conn, { message, args }) {
    const query = args.join(' ');

    if (!query) {
        return conn.sendMessage(message.key.remoteJid, {
            text: '🤖 Por favor, ingresa una consulta para The SukiBOT ✨.\n\n💡 *Ejemplo*: "¿Cómo está el clima hoy?"'
        });
    }

    try {
        const response = await axios.get(`https://eliasar-yt-api.vercel.app/api/chatgpt`, {
            params: {
                text: query,
                prompt: 'actuarás como The SukiBOT, un bot de WhatsApp creado desde cero por EliasarYT. Eres amigable, divertido y útil. Usa emojis para hacer tus respuestas más dinámicas eres parte de un team yamdo Akuma team i tenemos una frese _*🔥 El poder que demuestra Team Akuma con sus bots está en otro nivel 😈. Su nombre no es casualidad: encierra una fuerza 💪 que se refleja en todo lo que hacemos. 🚀*_.',
            },
        });

        if (response.data && response.data.status) {
            const botResponse = response.data.response;

            // Responder al mensaje del usuario
            await conn.sendMessage(message.key.remoteJid, {
                text: botResponse,
                quoted: message // Esto asegura que la respuesta se relacione con el mensaje original del usuario
            });

        } else {
            await conn.sendMessage(message.key.remoteJid, {
                text: '⚠️ *Oops...* No se pudo obtener una respuesta. 🤔 Por favor, intenta de nuevo más tarde.'
            });
        }

    } catch (err) {
        console.error('Error en el comando ChatGPT:', err.message);

        await conn.sendMessage(message.key.remoteJid, {
            text: '❌ *Hubo un error al procesar tu solicitud.* 😢 Intenta nuevamente más tarde.'
        });
    }
}

module.exports = {
    command: 'ia',
    handler,
};