require("dotenv").config();
const TelegramApi = require("node-telegram-bot-api");
const { Configuration, OpenAIApi } = require("openai");
const { gameOptions, againOptions } = require("./options");
const express = require("express");
const { User, Question, Answer } = require("./db/models");

const PORT = process.env.port ?? 8080;

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const configuration = new Configuration({
  organization: process.env.organization,
  apiKey: process.env.apiKey,
});

const bot = new TelegramApi(process.env.token, { polling: true });
const openai = new OpenAIApi(configuration);

const chats = {};

const ask = async (message, chatId) => {
  try {
    const response = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: message }],
      temperature: 0.5,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    });
    const answer = response.data.choices[0].message.content;
    
    try {
      const user = await User.findOne({ where: { telegram_id: chatId } })
      await Answer.create({
      answer,
      user_id: user.id
    })
    } catch (error) {
      console.log('Ошибка');
    }
    
    return bot.sendMessage(chatId, `${answer}`);
  } catch (error) {
    return bot.sendMessage(chatId, "Произошла непредвиденная ошибка");
  }
};

const startGame = async (chatId) => {
  const randomNumber = Math.floor(Math.random() * 10);
  chats[chatId] = randomNumber;
  await bot.sendMessage(chatId, "Выберете число", gameOptions);
};

const start = () => {
  bot.setMyCommands([
    { command: "/start", description: "Начальное приветствие" },
    { command: "/game", description: "Игра угадай число" },
  ]);

  bot.on("message", async (msg) => {
    const text = msg.text;
    const chatId = JSON.stringify(msg.chat.id);
    const username = msg.from.first_name ?? msg.from.username
    
    if (text === "/start") {
      await bot.sendMessage(
        chatId,
        `Привет ${username}`
      );
      try {
        await User.create({
          username,
          telegram_id: chatId
        });
      } catch (error) {
        bot.sendMessage(chatId, `Вы уже зарегистрировались`);
      }
      
    } else if (text === "/game") {
      await bot.sendMessage(
        chatId,
        `Привет сейчас я загада число от 0 до 9, а вы должны его угадать`
      );
      return startGame(chatId);
    } else if (text) {
      await bot.sendMessage(chatId, `Ожидание...`);
      try {
        const user = await User.findOne({ where: { telegram_id: chatId } })
        await Question.create({
          question: text,
          user_id: user.id
        })
      } catch (error) {
        console.log('Ошибка');
          console.log(error.message);
        }
      
      ask(text, chatId);
    } else {
      return bot.sendMessage(chatId, "Такой команды нет");
    }
  });

  bot.on("callback_query", async (msg) => {
    const data = msg.data;
    const chatId = msg.message.chat.id;
    if (data === "/again") {
      return startGame(chatId);
    }
    if (data == chats[chatId]) {
      return bot.sendMessage(
        chatId,
        `Поздравляю, вы угадали чисто ${chats[chatId]}`,
        againOptions
      );
    } else {
      return bot.sendMessage(
        chatId,
        `К сожалению вы не угадали, бот загадал число ${chats[chatId]}`,
        againOptions
      );
    }
  });
};
start();

app.listen(PORT, () => {
  console.log(`App has started on port ${PORT}`);
})