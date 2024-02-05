import { Telegraf, Markup, session } from 'telegraf';
import { message } from 'telegraf/filters';
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

bot.hears(categories.flat().map(c => c.label), async (ctx) => {
  if (!ctx.session?.amount) {
    return ctx.reply('Внеси свою покупку.');
  }

  const category = ctx.message.text;
  const { amount, comment } = ctx.session;
  ctx.session.amount = ctx.session.comment = undefined;

  // Submit data to Google Form
  const submissionResult = await submitToGoogleForm(amount, category, comment);

  try {
    await ctx.deleteMessage(ctx.message.message_id - 1);
  } catch (e) {
    console.error(e);
  }

  const response = submissionResult
    ? `Внесено ${amount}zł за ${category}${comment ? ` - ${comment}` : ''}`
    : 'Не удалось внести';
  return ctx.reply(response);
});

bot.on(message('text'), (ctx) => {
  const text = ctx.message.text;
  const [amount, ...commentParts] = text.split(' ');
  const comment = commentParts.join(' ');

  if (isNaN(amount)) {
    ctx.reply('Ожидаемый формат сообщения: "число [комментарий]"');
    return;
  }

  ctx.session ??= {};
  ctx.session.amount = amount;
  ctx.session.comment = comment;

  return ctx.reply('Категория:', Markup.keyboard(categories.map(row => row.map(c => c.label))).oneTime());
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