import { Telegraf, Markup, session } from 'telegraf';
import { message } from 'telegraf/filters'
import submitToGoogleForm from '../utils/submitToGoogleForm';
import categories from '../utils/categories.json';

const ALLOWED_USERS = process.env.ALLOWED_USERS.split(',').map(Number);

const bot = new Telegraf(process.env.TELEGRAM_TOKEN, { telegram: { webhookReply: false } });
bot.use((ctx, next) => {
  const userId = ctx.from.id;
  if (ALLOWED_USERS.includes(userId)) {
    return next();
  } else {
    console.log(`Access denied for user: ${userId}`);
    return ctx.reply(`Sorry, ${userId}, you are not authorized to use this bot.`);
  }
});
bot.use(session());

bot.on('callback_query', async ctx => {
  if (!ctx.session?.amount) {
    return ctx.reply('Please start by entering your spending.');
  }

  const category = ctx.callbackQuery.data;
  const { amount, comment } = ctx.session;
  ctx.session.amount = ctx.session.comment = undefined;

  const submissionResult = await submitToGoogleForm(amount, category, comment);
  const replyText = submissionResult
    ? `Submitted: ${amount}zł for ${category}${comment ? ` - ${comment}` : ''}`
    : 'Failed to submit';

  const chatId = ctx.callbackQuery.message.chat.id;
  const messageId = ctx.callbackQuery.message.message_id;

  return Promise.all([
    ctx.telegram.deleteMessage(chatId, messageId),
    ctx.reply(replyText)
  ]);
});

bot.on(message('text'), (ctx) => {
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
    'Select Category',
    Markup.inlineKeyboard(categories.map(row => row.map(c => ({ text: c.label, callback_data: c.label }))))
  );
});

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