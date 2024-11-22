const axios = require("axios");

const cheerio = require("cheerio");

const clean = (data) => {

    let regex = /(<([^>]+)>)/gi;

    data = data.replace(/(<br?\s?\/>)/gi, " \n");

    return data.replace(regex, "");

};

async function shortener(url) {

    return url;

}

async function tiktokScraper(query) {

    try {

        const response = await axios("https://lovetik.com/api/ajax/search", {

            method: "POST",

            data: new URLSearchParams(Object.entries({
                query
            })),

        });

        let result = {};

        result.creator = "EliasarYT";

        result.title = clean(response.data.desc);

        result.author = clean(response.data.author);

        result.nowm = await shortener(

            (response.data.links[0].a || "").replace("https", "http")

        );

        result.watermark = await shortener(

            (response.data.links[1].a || "").replace("https", "http")

        );

        result.audio = await shortener(

            (response.data.links[2].a || "").replace("https", "http")

        );

        result.thumbnail = await shortener(response.data.cover);

        return result;

    } catch (error) {

        console.error("Error al obtener datos de TikTok:", error);

        return {
            error: "No se pudo obtener información del video."
        };

    }

}

module.exports = {

    tiktokScraper,

};