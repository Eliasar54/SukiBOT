const axios = require('axios');
const fs = require('fs');

const sendImage = async (conn, to, image, caption = '') => {
    await conn.sendMessage(to, { image, caption });
};

const sendSticker = async (conn, to, sticker) => {
    await conn.sendMessage(to, { sticker });
};

const sendAudio = async (conn, to, audio, ptt = false) => {
    await conn.sendMessage(to, { audio, ptt });
};

const downloadFile = async (url, output) => {
    const response = await axios({
        url,
        method: 'GET',
        responseType: 'stream',
    });
    return new Promise((resolve, reject) => {
        const writer = fs.createWriteStream(output);
        response.data.pipe(writer);
        writer.on('finish', () => resolve(output));
        writer.on('error', reject);
    });
};

const sendVideo = async (conn, to, videoUrl, caption = '') => {
    try {
        const filePath = './temp_video.mp4';
        await downloadFile(videoUrl, filePath);
        const videoStream = fs.readFileSync(filePath);
        await conn.sendMessage(to, { video: videoStream, caption });
        fs.unlinkSync(filePath);
    } catch (error) {
        console.error('Error enviando video:', error.message);
    }
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
        await conn.sendMessage(to, { text: 'Tipo de mensaje no soportado' });
    }
};

const downloadTikTokVideo = async (url) => {
    try {
        const response = await axios.get(`https://api.tiklydown.eu.org/api/download?url=${url}`);
        const videoData = response.data;
        const videoUrl = videoData.video.noWatermark;
        const coverImage = videoData.video.cover;
        const videoTitle = videoData.title;
        const likeCount = videoData.stats.likeCount;
        const commentCount = videoData.stats.commentCount;
        const shareCount = videoData.stats.shareCount;
        const playCount = videoData.stats.playCount;
        const saveCount = videoData.stats.saveCount;
        const musicTitle = videoData.music.title;
        const musicAuthor = videoData.music.author;
        const musicCover = videoData.music.cover_large;

        return {
            videoUrl,
            coverImage,
            videoTitle,
            likeCount,
            commentCount,
            shareCount,
            playCount,
            saveCount,
            musicTitle,
            musicAuthor,
            musicCover,
        };
    } catch (error) {
        return null;
    }
};

module.exports = {
    command: 'tiktok',
    handler: async (conn, { message, args }) => {
        if (args.length === 0) {
            await conn.sendMessage(message.key.remoteJid, { text: '⚠️ Por favor, proporciona un enlace de TikTok.' });
            return;
        }

        const tiktokUrl = args[0];
        const videoInfo = await downloadTikTokVideo(tiktokUrl);

        if (videoInfo) {
            const videoMessage = `
*🎥 Título del Video:* ${videoInfo.videoTitle}
*👍 Likes:* ${videoInfo.likeCount}
*💬 Comentarios:* ${videoInfo.commentCount}
*🔄 Compartidos:* ${videoInfo.shareCount}
*👀 Vistas:* ${videoInfo.playCount}
*💾 Guardados:* ${videoInfo.saveCount}
*🎵 Música:* ${videoInfo.musicTitle} por ${videoInfo.musicAuthor}`;

            await conn.sendMessage(message.key.remoteJid, {
                text: videoMessage,
                image: { url: videoInfo.musicCover },
                caption: 'Portada de la música 🎶',
            });

            await sendMedia(conn, message.key.remoteJid, videoInfo.videoUrl, videoMessage, 'video');
        } else {
            await conn.sendMessage(message.key.remoteJid, { text: '❌ No se pudo obtener el video de TikTok.' });
        }
    },
};