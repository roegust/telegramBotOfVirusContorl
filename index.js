var CronJob = require("cron").CronJob;

// telegram settings
const TelegramBot = require("node-telegram-bot-api");
const token = "1062087849:AAFnz4p26ac3DsjPXEDh0fvMiahQjEZQRS8";
const bot = new TelegramBot(token, { polling: true });
const telegramId = []


user = {
  "10610150": {
    "name": "宗家榮",
    "telegramId": null
  },
  "10511141": {
    "name": "林應凱",
    "telegramId": null
  },
  "10602105": {
    "name": "盧建廷",
    "telegramId": null
  },
  "10506120": {
    "name": "杜承浩",
    "telegramId": null
  }
};

// run the job everyday at 8 a.m.
var job = new CronJob(
  "0 8  * * *",
  function () {
    Object.keys(user).forEach(e => {
      // console.log(e)
      const req = require("./request.js");
      req.autofill(e, user[e].name).then(res => {
        bot.sendMessage(user[e].telegramId, res);
      });
    })

  },
  null,
  true,
  "Asia/Taipei"
);

job.start();

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, "Please enter the empid to add yourself in daily job and check status");
});

bot.onText(/\d{8}/, (msg) => {
  const message = msg.text

  if (user[message].telegramId === null) {
    user[message].telegramId = msg.chat.id
    bot.sendMessage(msg.chat.id, "Add ( empid: " + message + " , name: " + user[message].name + " ) in Daily Job");
  }

  if (user[message] !== undefined) {
    const req = require("./request.js");
    req.autofill(message, user[message].name).then(res => {
      // console.log(res)
      bot.sendMessage(msg.chat.id, res);
    });
    // if(telegramId.indexOf(msg.chat.id))
  }
});
