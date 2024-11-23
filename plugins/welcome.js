module.exports = {
 command: 'welcome',
 handler: async (conn, { message, args }) => {
 const { key, participant, remoteJid } = message.key;
 const from = remoteJid;
 const isGroup = from.endsWith('@g.us');

 if (!isGroup) {
 await conn.sendMessage(from, { text: 'Este comando solo puede usarse en grupos.' });
 return;
 }

 if (args.length === 0 || !['on', 'off'].includes(args[0].toLowerCase())) {
 await conn.sendMessage(from, { text: 'Uso: welcome <on|off>' });
 return;
 }

 const status = args[0].toLowerCase();

 try {
 const groupMetadata = await conn.groupMetadata(from);
 const admins = groupMetadata.participants.filter((p) => p.admin).map((p) => p.id);
 const isAdmin = admins.includes(participant) || participant === conn.user.id;

 if (!isAdmin) {
 await conn.sendMessage(from, { text: 'Solo los administradores del grupo pueden usar este comando.' });
 return;
 }

 const { setWelcomeStatus } = require('../main'); // Ajusta la ruta según tu estructura.

 setWelcomeStatus(from, status);
 await conn.sendMessage(from, { text: `Mensaje de bienvenida ${status === 'on' ? 'activado' : 'desactivado'}.` });
 } catch (err) {
 await conn.sendMessage(from, { text: 'Hubo un error al intentar cambiar el estado del mensaje de bienvenida.' });
 console.error('Error en el comando welcome:', err.message);
 }
 }
};