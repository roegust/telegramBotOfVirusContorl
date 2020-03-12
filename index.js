var CronJob = require("cron").CronJob;

// telegram settings
const TelegramBot = require("node-telegram-bot-api");
const token = "1062087849:AAFnz4p26ac3DsjPXEDh0fvMiahQjEZQRS8";
const bot = new TelegramBot(token, { polling: true });
const telegramId = 1097526124;

user = {
  "10610150": "宗家榮",
  "10511141": "黎奕宏",
  "10602105": "盧建廷"
};

// run the job everyday at 8 a.m.
var job = new CronJob(
  "0 8 * * *",
  function() {
    const req = require("./request.js");
    req.autofill.then(res => {
      bot.sendMessage(telegramId, res);
    });
  },
  null,
  true,
  "Asia/Taipei"
);

job.start();

bot.onText(/\/echo (.+)/, (msg, match) => {
  bot.sendMessage(msg.chat.id, res);
  var message = match[1]
  if (user[message] !== undefined) {
    const req = require("./request.js");
    req.autofill(message, encodeURI(user[message])).then(res => {
      bot.sendMessage(msg.chat.id, res);
      // console.log(res)
    });
  }
});
