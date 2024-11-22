const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const os = require('os');
const fs = require('fs');
const readline = require('readline');
const pino = require('pino');
const chalk = require('chalk');
const figlet = require('figlet');
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const localtunnel = require('localtunnel');
const { handleMessage, handleGroupEvents, incrementComms, incrementGrups, incrementUsers, getWelcomeStatus } = require('./main.js');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (text) => new Promise((resolve) => rl.question(text, resolve));

const generateRandomSubdomain = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let randomString = '';
    for (let i = 0; i < 8; i++) {
        randomString += chars[Math.floor(Math.random() * chars.length)];
    }
    return `suki${randomString}`;
};

async function startBot() {
    console.clear();
    figlet('Sukibot', (err, data) => {
        if (err) return console.log('Error generando el banner ASCII');
        console.log(chalk.green(data));
    });

    await new Promise(resolve => setTimeout(resolve, 2000));
    console.clear();

    const { state, saveCreds } = await useMultiFileAuthState('./sessions');
    const { version } = await fetchLatestBaileysVersion();
    let opcion;

    if (!fs.existsSync('./sessions/creds.json')) {
        do {
            const lineM = '━━━━━━━━━━━━━━━━━━━━';
            opcion = await question(`╔${lineM}╗
❘ ${chalk.bgBlue('          𝗦𝗘𝗟𝗘𝗖𝗖𝗜𝗢𝗡𝗔           ')}
❘ ${chalk.bgMagenta('➥')} ${chalk.bold.cyan('1. Conexión mediante QR')}
❘ ${chalk.bgMagenta('➥')} ${chalk.green.bold('2. Conexión mediante número de teléfono')}
╚${lineM}╝\n${chalk.bold.yellow('➥ ')}${chalk.bold.green('➜ ')}`);

            if (!/^[1-2]$/.test(opcion)) {
                console.log(chalk.bold.redBright(`NO SE PERMITE NÚMEROS QUE NO SEAN ${chalk.bold.greenBright("1")} O ${chalk.bold.greenBright("2")}`));
            }
        } while (opcion !== '1' && opcion !== '2' || fs.existsSync('./sessions/creds.json'));
    }

    const socket = makeWASocket({
        version,
        auth: state,
        logger: pino({ level: 'silent' }),
    });

    const app = express();
    const server = http.createServer(app);
    const io = socketIo(server);

    app.get('/', (req, res) => {
        res.sendFile(__dirname + '/index.html');
    });

    const getServerStats = () => ({
        cpu: os.cpus().map(cpu => cpu.model)[0],
        ram: `${(os.totalmem() - os.freemem()) / (1024 ** 3).toFixed(2)} GB / ${(os.totalmem() / (1024 ** 3)).toFixed(2)} GB`,
        ipv4: Object.values(os.networkInterfaces())
            .flat()
            .filter(iface => iface.family === 'IPv4' && !iface.internal)
            .map(iface => iface.address)[0],
    });

    io.on('connection', (client) => {
        setInterval(() => {
            client.emit('serverStats', getServerStats());
        }, 5000);
    });

    socket.ev.on('connection.update', (update) => {
        io.emit('connectionUpdate', update);
        const { connection, qr } = update;
        if (connection === 'open') {
            console.log(chalk.green(`Bot conectado como ${socket.user.id}`));
        }
        if (qr) {
            console.log(chalk.blue('Escanea el siguiente código QR para conectar tu bot:'));
            qrcode.generate(qr, { small: true });
        }
    });

    socket.ev.on('messages.upsert', async (m) => {
        const message = m.messages[0];
        if (!message.key.fromMe) {
            await handleMessage(socket, message);
        }
    });

    socket.ev.on('group-participants.update', async (update) => {
        await handleGroupEvents(socket, update);
    });

    socket.ev.on('creds.update', saveCreds);

    const PORT = 3000;
    server.listen(PORT, async () => {
        console.log(chalk.green(`Servidor web en ejecución en http://localhost:${PORT}`));

        const randomSubdomain = generateRandomSubdomain();
        const tunnel = await localtunnel({ port: PORT, subdomain: randomSubdomain });
        console.log(chalk.blueBright(`Tu servidor web está disponible en: ${tunnel.url}`));
        console.log(chalk.magenta(`Clave de acceso al túnel: ${randomSubdomain}`));
    });
}

startBot();