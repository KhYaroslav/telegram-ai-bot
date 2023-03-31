const TelegramApi = require('node-telegram-bot-api')
const { gameOptions, againOptions } = require('./options')
const token = '6198495394:AAGV_XWd4pa_w5B_FcWmZj5vTO7Nv3FjGP8'

const bot = new TelegramApi(token, { polling: true })

const chats = {}

const startGame = async (chatId) => {
  const randomNumber = Math.floor(Math.random() * 10)
  chats[chatId] = randomNumber
  await bot.sendMessage(chatId, 'Выберете число', gameOptions)
}

const start = () => {
  bot.setMyCommands([
    { command: '/start', description: 'Начальное приветствие' },
    { command: '/game', description: 'Игра угадай число' },
  ])

  bot.on('message', async msg => {
    console.log(msg);
    const text = msg.text
    const chatId = msg.chat.id
    if (text === '/start') {
      await bot.sendMessage(chatId, `Привет ${msg.from.username}`)
    } else if (text === '/game') { 
      await bot.sendMessage(chatId, `Привет сейчас я загада число от 0 до 9, а вы должны его угадать`)
      return startGame(chatId)
    } else {
      return bot.sendMessage(chatId, 'Такой команды нет')
    }
  })

  bot.on('callback_query', async msg => {
    const data = msg.data
    const chatId = msg.message.chat.id
    if (data === '/again') {
      return startGame(chatId)
    }
    if (data == chats[chatId]) {
      return bot.sendMessage(chatId, `Поздравляю, вы угадали чисто ${chats[chatId]}`, againOptions)
    } else {
      return bot.sendMessage(chatId, `К сожалению вы не угадали, бот загадал число ${chats[chatId]}`, againOptions)
    }
  })
}

start()