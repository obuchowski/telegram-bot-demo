import { Telegraf } from 'telegraf';
import https from 'https';
import sharp from 'sharp';

const bot = new Telegraf(process.env.TELEGRAM_TOKEN);

bot.start(ctx => ctx.reply('Welcome'));
bot.help(ctx => ctx.reply('Send me a sticker'));
bot.hears('hi', ctx => ctx.reply('Hey there'));

bot.on('message', async (ctx) => {
  if (ctx.message.sticker) {
    await ctx.reply('👍');
  } else if (ctx.message.photo || (ctx.message.document && ctx.message.document.mime_type.indexOf('image/') === 0)) {
    await imageTransform(ctx);
  } else {
    await ctx.reply('Unsupported request.')
  }
});

const getFileBuffer = (fileLink) => {
  return new Promise((resolve, reject) => {
    https.get(fileLink, (res) => {
      const chunks = [];
      res.on("data", (chunk) => {
        chunks.push(chunk);
      });
      res.on("end", () => {
        resolve(Buffer.concat(chunks));
      });
      res.on("error", (err) => {
        reject(err);
      });
    });
  });
};

const imageTransform = async (ctx) => {
  try {
    let fileId;
    let fileName = 'image.png';

    if (ctx.message.photo) {
      fileId = ctx.message.photo[ctx.message.photo.length - 1].file_id;
    } else {
      fileId = ctx.message.document.file_id;
      fileName = `${ctx.message.document.file_name.split('.')[0]}.png`;
    }

    const fileLink = await ctx.telegram.getFileLink(fileId);
    const buffer = await getFileBuffer(fileLink);
    const pngBuffer = await sharp(buffer)
    .png()
    .toBuffer();

    await ctx.replyWithDocument(
      {
        source: Buffer.from(pngBuffer),
        filename: fileName,
        mimeType: 'image/png'
      }
    );
  } catch (e) {
    console.error(e);
    await ctx.reply('Send me an image to convert to PNG or a sticker.');
  }
}

export const handler = async (event) => {
  if (event['warmer']) {
    console.log('Warming event');
    return { statusCode: 500, body: '' };
  }

  if (event.requestContext.http.method !== 'POST') {
    return { statusCode: 400, body: 'Not a POST request!' };
  }

  try {
    return bot.handleUpdate(JSON.parse(event.body));
  } catch (e) {
    console.error(e);
    return { statusCode: 400, body: 'This was not a valid request.' };
  }
};