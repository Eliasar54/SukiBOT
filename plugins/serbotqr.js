const fs = require('fs');
const path = require('path');
const { useMultiFileAuthState, makeWASocket, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode');
const { v4: uuidv4 } = require('uuid');

module.exports = {
    command: 'serbotqr',
    handler: async (conn, { message, args }) => {
        const subBotName = uuidv4(); 
        const subBotPath = path.join('./subBots', subBotName);

        try {
            fs.mkdirSync(subBotPath, { recursive: true });
            const { state, saveCreds } = await useMultiFileAuthState(subBotPath);
            const { version } = await fetchLatestBaileysVersion();

            const subBot = makeWASocket({ auth: state, version });
            let qrSent = false; 

            subBot.ev.on('connection.update', async (update) => {
                const { connection, qr } = update;

                if (connection === 'open') {
                    await conn.sendMessage(message.key.remoteJid, { text: `✅ Sub-bot conectado exitosamente.` });
                }

                if (connection === 'close' && !qrSent) {
                    fs.rmdirSync(subBotPath, { recursive: true });
                    console.log(`❌ QR no utilizado. Carpeta eliminada.`);
                    await conn.sendMessage(message.key.remoteJid, { text: `❌ QR expirado. Sub-bot eliminado.` });
                }

                if (qr && !qrSent) {
                    const qrPath = path.join(subBotPath, 'qr.png');
                    await qrcode.toFile(qrPath, qr);
                    await conn.sendMessage(message.key.remoteJid, {
                        image: { url: qrPath },
                        caption: `Escanea este código QR para conectar el sub-bot.`
                    });
                    qrSent = true; 
                }
            });

            subBot.ev.on('creds.update', saveCreds);
            await conn.sendMessage(message.key.remoteJid, { text: `🟢 Sub-bot inicializado. Escanea el QR enviado.` });
        } catch (err) {
            console.error('Error:', err.message);
            if (fs.existsSync(subBotPath)) {
                fs.rmdirSync(subBotPath, { recursive: true });
            }
            await conn.sendMessage(message.key.remoteJid, { text: '❌ Error al crear el sub-bot.' });
        }
    },
};