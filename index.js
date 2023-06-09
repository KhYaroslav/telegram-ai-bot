require("dotenv").config();
const TelegramApi = require("node-telegram-bot-api");
const { Configuration, OpenAIApi } = require("openai");
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

const ask = async (chatId) => {  
  try {
  const user = await User.findOne({ where: { telegram_id: chatId }})
  const question = await Question.findAll({ where: { user_id: user.id }})
  const answer = await Answer.findAll({where: {user_id: user.id}})
  const questionArr = question.map((el) => [{ role: 'user', content: el.question}])
  const answerArr = answer.map((el) => [{ role: 'assistant', content: el.answer }])

  function rewriteData() {
    const data = [];

    for (let i = 0; i < questionArr.length || i < answerArr.length; i++) {
      if (questionArr[i]) {
        data.push(questionArr[i][0]);
      }
      if (answerArr[i]) {
        data.push(answerArr[i][0]);
      }
    }
    return data
  }

    const response = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: rewriteData(),
      temperature: 0.5,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    });
    const result = response.data.choices[0].message.content; 
      await Answer.create({
      answer: result,
      user_id: user.id
    })
    return bot.sendMessage(chatId, result);
  } catch (error) {
    return bot.sendMessage(chatId, 'Произошла непредвиденная ошибка, используйте команду /clear');
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
    { command: "/clear", description: "Очистить контекст" },
  ]);

  bot.on("message", async (msg) => {
    const text = msg.text;
    const chatId = JSON.stringify(msg.chat.id);
    const username = msg.from.first_name ?? msg.from.username
    
    if (text === "/start") {
      try {
        await User.create({
          username,
          telegram_id: chatId
        });
        await bot.sendMessage(
          chatId,
          `Привет ${username}`
        );
      } catch (error) {
        await bot.sendMessage(
          chatId,
          `Привет ${username}`
        );
      }
    } else if (text === "/clear") {
      try {
        const user = await User.findOne({ where: { telegram_id: chatId } })
        await Question.destroy({ where: { user_id: user.id } })
        await Answer.destroy({where: {user_id: user.id}})
      } catch (error) {
        await bot.sendMessage(
          chatId,
          `Произошла ошибка при очисти контекста`
        );
      }
    } else if (text.length < 4096) {
      await bot.sendMessage(chatId, `Ожидание...`);
      try {
        const user = await User.findOne({ where: { telegram_id: chatId } })
        await Question.create({
          question: text,
          user_id: user.id
        })
      } catch (error) {
          console.log(error.message);
        }
      ask(chatId);
    } else {
      return bot.sendMessage(chatId, 'Масимальное количество символов 4096');
    }
  });
};
start();

app.listen(PORT, () => {
  console.log(`App has started on port ${PORT}`);
})