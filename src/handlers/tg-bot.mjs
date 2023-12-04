import { Telegraf, Markup, session } from 'telegraf';
import categories from './categories.js';

const bot = new Telegraf(process.env.TELEGRAM_TOKEN, { telegram: { webhookReply: false } });
bot.use(session());

bot.hears(categories.flat(), async (ctx) => {
  if (!ctx.session?.amount) {
    return ctx.reply('Please start by entering your spending.');
  }

  const category = ctx.message.text;
  const { amount, comment } = ctx.session;

  // Submit data to Google Form
  await submitToGoogleForm(amount, comment, category);
  ctx.session.amount = ctx.session.comment = undefined;
  return ctx.reply(`Submitted: ${amount}zł for ${category}${comment ? ` - ${comment}` : ''}`);
});

bot.on('text', (ctx) => {
  const text = ctx.message.text;
  const [amount, ...commentParts] = text.split(' ');
  const comment = commentParts.join(' ');

  if (isNaN(amount)) {
    ctx.reply('Please send a message in the format "number comment"');
    return;
  }

  // Save amount and comment in the session and proceed to category selection
  ctx.session ??= {};
  ctx.session.amount = amount;
  ctx.session.comment = comment;

  return ctx.reply(
    'Select a category',
    Markup.keyboard(categories).oneTime().resize()
  );
});

async function submitToGoogleForm(amount, comment, category) {
  // Implement function to submit data to Google Form
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
    return await bot.handleUpdate(JSON.parse(event.body));
  } catch (e) {
    console.error(e);
    return { statusCode: 400, body: 'This was not a valid request.' };
  }
};