var CronJob = require("cron").CronJob;

// telegram settings
const TelegramBot = require("node-telegram-bot-api");
const token = "1062087849:AAFnz4p26ac3DsjPXEDh0fvMiahQjEZQRS8";
const bot = new TelegramBot(token, { polling: true });

//googlesheet setting

const { GoogleSpreadsheet } = require("google-spreadsheet");
const doc = new GoogleSpreadsheet(
  "16ctbzOVdulA8poPSlj6SUNk50HO-Fi94aJbh8O_kvsg"
);
const apikey = "AIzaSyA47786EfVYYCcALQRV5JcsvNR-YVAAKR8";

user = {};

state = {};

// run the job everyday at 8 a.m.
var job = new CronJob(
  "0 0 8,9 ? * * *",
  function() {
    Object.keys(user).forEach(e => {
      // console.log(e)
      const req = require("./request.js");
      req.autofill(e, user[e].name).then(res => {
        bot.sendMessage(user[e].telegramId, res);
      });
    });
  },
  null,
  true,
  "Asia/Taipei"
);

job.start();
job.nextDates(5);

bot.onText(/\/start/, msg => {
  bot.sendMessage(
    msg.chat.id,
    `*Quick start* 
 /info - check user information
 /add - add new user`,
    { parse_mode: "Markdown" }
  );
});

bot.onText(/((\d{7,8}))/, (msg, match) => {
  if (state[msg.chat.id] !== undefined) {
    if (state[msg.chat.id].status === "info") {
      reloadUserList()
        .then(() => {
          if (user[match[1]] !== undefined) {
            bot.sendMessage(
              msg.chat.id,
              `userId: ${match[1]} , name: ${user[match[1]].name} ,chatId: ${
                user[match[1]].telegramId
              }`
            );
            bot.sendMessage(
              msg.chat.id,
              `user: ${match[1]} is already add in daily job`
            );
          } else {
            bot.sendMessage(
              msg.chat.id,
              `no information of userid:  ${match[1]}`
            );
          }
        })
        .then(() => {
          state[msg.chat.id].status = "";
        });
    }
  }
});

bot.onText(/\/add/, msg => {
  bot.sendMessage(
    msg.chat.id,
    "Please add your info at https://docs.google.com/spreadsheets/d/16ctbzOVdulA8poPSlj6SUNk50HO-Fi94aJbh8O_kvsg/edit?usp=sharing"
  );
  bot.sendMessage(msg.chat.id, "Your chat ID is " + msg.chat.id);
  bot.sendMessage(
    msg.chat.id,
    "Please copy your chat ID, you have to fill this in the sheet."
  );
});

bot.onText(/\/info/, msg => {
  if (state[msg.chat.id] === undefined) {
    state[msg.chat.id] = stateInfo(msg.chat.id, "info");
  } else {
    state[msg.chat.id].status = "info";
  }
  // console.log(state)
  bot.sendMessage(msg.chat.id, "Please enter your employee ID");
});

bot.onText(/\/test/, msg => {
  if (msg.chat.id === 1097526124) {
    const req = require("./request.js");
    req.autofill("10610150", user["10610150"].name).then(res => {
      // console.log(res)
      bot.sendMessage(user["10610150"].telegramId, res);
    });
  }
});

bot.onText(/\/job/, msg => {
  if (msg.chat.id === 1097526124) {
    Object.keys(user).forEach(e => {
      // console.log(e)
      const req = require("./request.js");
      req.autofill(e, user[e].name).then(res => {
        bot.sendMessage(1097526124, res);
      });
    });
  }
});

bot.onText(/\/reload/, msg => {
  reloadUserList().then(() => {
    bot.sendMessage(msg.chat.id, "Reload user complete");
  });
});

async function reloadUserList() {
  doc.useApiKey(apikey);

  await doc.loadInfo();
  const sheet = doc.sheetsByIndex[0];
  const rows = await sheet.getRows();

  rows.forEach(e => {
    user[e.userId] = {
      name: e.name,
      telegramId: e.chatId
    };
  });
}

function stateInfo(chatId, type) {
  return {
    status: type
  };
}

reloadUserList();

bot.sendMessage(1097526124, `service was rebuilt complete`);
