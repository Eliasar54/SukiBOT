const fs = require('fs');
const { prefix } = require('./settings.js');
const path = './database.json';
const chalk = require('chalk');
const pathPlugins = './plugins';

let plugins = {};

const readDB = () => {
    try {
        const data = fs.readFileSync(path, 'utf-8');
        return JSON.parse(data);
    } catch (err) {
        console.error('Error al leer DB:', err);
        return null;
    }
};

const writeDB = (data) => {
    try {
        fs.writeFileSync(path, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
        console.error('Error al escribir DB:', err);
    }
};

const incrementComms = () => {
    const db = readDB();
    if (db) {
        db.comads += 1;
        writeDB(db);
    }
};

const incrementGrups = () => {
    const db = readDB();
    if (db) {
        db.grups += 1;
        writeDB(db);
    }
};

const incrementUsers = () => {
    const db = readDB();
    if (db) {
        db.users += 1;
        writeDB(db);
    }
};

const getWelcomeStatus = () => {
    const db = readDB();
    return db ? db.welcomeStatus : 'off';
};

const sendText = async (conn, to, text) => {
    await conn.sendMessage(to, { text });
};

const sendImage = async (conn, to, image, caption = '') => {
    await conn.sendMessage(to, { image, caption });
};

const sendSticker = async (conn, to, sticker) => {
    await conn.sendMessage(to, { sticker });
};

const sendAudio = async (conn, to, audio, ptt = false) => {
    await conn.sendMessage(to, { audio, ptt });
};

const sendVideo = async (conn, to, video, caption = '') => {
    await conn.sendMessage(to, { video, caption });
};

const sendMedia = async (conn, to, media, caption = '', type = 'image') => {
    if (type === 'image') {
        await sendImage(conn, to, media, caption);
    } else if (type === 'sticker') {
        await sendSticker(conn, to, media);
    } else if (type === 'audio') {
        await sendAudio(conn, to, media);
    } else if (type === 'video') {
        await sendVideo(conn, to, media, caption);
    } else {
        await sendText(conn, to, 'Tipo de mensaje no soportado');
    }
};

const sendMessage = async (conn, to, message, type = 'text') => {
    if (type === 'text') {
        await sendText(conn, to, message);
    } else if (type === 'image') {
        await sendImage(conn, to, message);
    } else if (type === 'sticker') {
        await sendSticker(conn, to, message);
    } else if (type === 'audio') {
        await sendAudio(conn, to, message);
    } else if (type === 'video') {
        await sendVideo(conn, to, message);
    } else {
        await sendText(conn, to, 'Tipo de mensaje no soportado');
    }
};

const loadPlugins = () => {
    plugins = {};
    fs.readdirSync(pathPlugins).forEach((file) => {
        if (file.endsWith('.js')) {
            try {
                delete require.cache[require.resolve(`${pathPlugins}/${file}`)];
                const command = require(`${pathPlugins}/${file}`);
                plugins[command.command] = command;
            } catch (err) {
                console.error(`Error cargando plugin ${file}:`, err.message);
            }
        }
    });
};

fs.watch(pathPlugins, { recursive: true }, (eventType, filename) => {
    if (eventType === 'change' || eventType === 'rename') {
        console.log(`Detectado cambio en los plugins: ${filename}`);
        loadPlugins();
    }
});

loadPlugins();

async function logEvent(conn, m, type, user = 'Desconocido', groupName = '', groupLink = '') {
    console.log(
        chalk.bold.red('━━━━━━━━━━ 𝗦𝗨𝗞𝗜 𝗟𝗢𝗚𝗦 ━━━━━━━━━━') +
        '\n' + chalk.blue('│⏰ Fecha y hora: ') + chalk.green(new Date().toLocaleString('es-ES', { timeZone: 'America/Argentina/Buenos_Aires' })) +
        '\n' + chalk.yellow('️│🏷️ Modo: ') + chalk.magenta(`[${conn.public ? 'Público' : 'Privado'}]`) +
        '\n' + chalk.cyan('│📑 Tipo de mensaje: ') + chalk.white(type) +
        (m.isGroup ? 
            `\n${chalk.bgGreen('│🌸 Grupo:')} ${chalk.greenBright(groupName)} ➜ ${chalk.green(m.chat)}` +
            `\n${chalk.bgBlue('│🔗 Enlace del grupo:')} ${chalk.blueBright(groupLink)}` :
            `\n${chalk.bgMagenta('│💌 Usuario:')} ${chalk.magentaBright(user)}`)
    );
}

async function handleMessage(conn, message) {
    const { message: msgContent, key } = message;
    const from = key.remoteJid;
    const isGroup = from.endsWith('@g.us');
    const user = key.participant || from;
    let groupName = '', groupLink = '';

    if (isGroup) {
        try {
            const metadata = await conn.groupMetadata(from);
            groupName = metadata.subject;
            const inviteCode = await conn.groupInviteCode(from);
            groupLink = `https://chat.whatsapp.com/${inviteCode}`;
        } catch {
            groupLink = 'Error obteniendo el enlace del grupo';
        }
    }

    const body = msgContent?.conversation || 
                 msgContent?.extendedTextMessage?.text || 
                 msgContent?.imageMessage?.caption || 
                 msgContent?.videoMessage?.caption || 
                 null;

    if (body && body.startsWith(prefix[0])) {
        const args = body.slice(prefix[0].length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();

        if (plugins[commandName]) {
            try {
                await plugins[commandName].handler(conn, { message, args });
                await logEvent(conn, message, `Comando: ${commandName}`, user, groupName, groupLink);
                incrementComms();
            } catch (err) {
                console.error('Error ejecutando comando:', err.message);
            }
        } else {
            console.log(`Comando no reconocido: ${commandName}`);
        }
    } else if (msgContent?.stickerMessage) {
        await logEvent(conn, message, 'Sticker', user, groupName, groupLink);
    } else if (msgContent?.imageMessage) {
        await logEvent(conn, message, 'Imagen', user, groupName, groupLink);
    } else if (msgContent?.audioMessage) {
        await logEvent(conn, message, 'Audio', user, groupName, groupLink);
    } else if (msgContent?.videoMessage) {
        await logEvent(conn, message, 'Video', user, groupName, groupLink);
    } else if (!body) {
        await logEvent(conn, message, 'Mensaje vacío o no soportado', user, groupName, groupLink);
    }
}

async function handleGroupEvents(conn, update) {
    const { id, participants, action } = update;

    const welcomeStatus = getWelcomeStatus();
    if (welcomeStatus !== 'on') return;

    for (const participant of participants) {
        if (action === 'add') {
            try {
                const metadata = await conn.groupMetadata(id);
                const groupName = metadata.subject;
                await conn.sendMessage(id, {
                    text: `Bienvenido @${participant.split('@')[0]} a *${groupName}*`,
                    mentions: [participant],
                });
                incrementGrups();
            } catch (err) {
                console.error('Error enviando mensaje de bienvenida:', err.message);
            }
        } else if (action === 'remove') {
            try {
                await conn.sendMessage(id, {
                    text: `Adiós @${participant.split('@')[0]}`,
                    mentions: [participant],
                });
            } catch (err) {
                console.error('Error enviando mensaje de despedida:', err.message);
            }
        }
    }
}

module.exports = { handleMessage, handleGroupEvents, sendMedia, incrementComms, incrementGrups, incrementUsers, getWelcomeStatus };