const { Telegraf } = require('telegraf');
const sharp = require('sharp');
const request = require('request-promise');
const bot = new Telegraf(process.env.TELEGRAM_TOKEN);

bot.start((ctx) => ctx.reply('Welcome'));
bot.help((ctx) => ctx.reply('Send me a sticker'));
bot.hears('hi', (ctx) => ctx.reply('Hey there'));

bot.on('message', async (ctx) => {
    try {
        const message = ctx.message;
        let fileId;
        let fileName;

        if (message.photo) {
            fileId = message.photo[message.photo.length - 1].file_id;
        } else if (message.document && message.document.mime_type.indexOf('image/') === 0) {
            fileId = message.document.file_id;
            fileName = message.document.file_name;
        } else if (ctx.message.sticker) {
            return ctx.reply('👍')
        } else {
            throw new Error('No image/sticker found');
        }

        const fileLink = await ctx.telegram.getFileLink(fileId);
        const response = await request({
            url: fileLink,
            encoding: null,
            resolveWithFullResponse: true
        });

        const pngBuffer = await sharp(response.body)
            .png()
            .toBuffer();

        const convertedFileName = fileName ? `${fileName.split('.')[0]}.png` : 'image.png';
        await ctx.replyWithDocument(
            {
                source: Buffer.from(pngBuffer),
                filename: convertedFileName,
                mimeType: 'image/png'
            }
        );
    } catch (e) {
        console.error(e);
        await ctx.reply('Send me an image to convert to PNG or a sticker.');
    }
});

exports.handler = async event => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 200, body: 'This was not a POST request!' };
    }

    try {
        const body = JSON.parse(event.body);
        await bot.handleUpdate(body);

        return { statusCode: 200, body: '' };
    } catch (e) {
        console.error(e);
        return { statusCode: 400, body: 'This was not a valid request.' };
    }
};