var CronJob = require("cron").CronJob;

const request = require("request");
const j = request.jar();

// telegram settings
const TelegramBot = require("node-telegram-bot-api");
const token = "1062087849:AAFnz4p26ac3DsjPXEDh0fvMiahQjEZQRS8";
const bot = new TelegramBot(token, { polling: true });

// rxjs
const rxjs = require("rxjs");
const rxjs_op = require("rxjs/operators");

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
  " 0,30 8 * * *",
  async function() {
    await loadUserList();
    const userid = Object.keys(user);
    const req = require("./request.js");
    const getUser = rxjs
      .from(userid)
      .pipe(rxjs_op.concatMap(item => rxjs.of(item).pipe(rxjs_op.delay(2000))));
    const result = getUser.pipe(
      rxjs_op.mergeMap(item => req.autofill(item, user[item].name))
    );
    result.subscribe(res => {
      bot.sendMessage(user[res.userid].telegramId, res.response);
    });
  },
  null,
  true,
  "Asia/Taipei"
);

job.start();
// console.log(job.nextDates(2));

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
      loadUserList()
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
    state[msg.chat.id] = stateInfo("info");
  } else {
    state[msg.chat.id].status = "info";
  }
  // console.log(state)
  bot.sendMessage(msg.chat.id, "Please enter your employee ID");
});

bot.onText(/\/test/, msg => {
  if (msg.chat.id === 1097526124) {
    // const req = require("./request.js");
    req.autofill("10610150", user["10610150"].name).then(res => {
      // console.log(res)
      bot.sendMessage(user["10610150"].telegramId, res.response);
    });
  }
});
bot.onText(/\/apit/, msg => {
  request.post(
    "https://script.google.com/macros/s/AKfycbxcqmLhGC1Njn0vxJfvFpIfQaY81xMZmUU-3H9IgE7NpUiW7hR2/exec",
    {
      json: {
        userid: "222",
        name: "333",
        chatid: "444"
      }
    },
    (error, res, body) => {
      if (error) {
        console.error(error);
        return;
      }
      console.log(`statusCode: ${res.statusCode}`);
      console.log(body);
    }
  );
});

bot.onText(/\/reload/, async msg => {
  await loadUserList();
  console.log(user);
});

bot.onText(/\/rxjs/, async msg => {
  await loadUserList();
  const userid = Object.keys(user);
  const req = require("./request.js");
  const result = rxjs
    .from(userid)
    .pipe(rxjs_op.concatMap(item => rxjs.of(item).pipe(rxjs_op.delay(2000))));
  const example = result.pipe(
    rxjs_op.mergeMap(
      item => req.autofill(item, user[item].name)
      // return rxjs.from(prom)
    )
  );
  example.subscribe(res => {
    // console.log(res.userid)
    // console.log(res.response)
    bot.sendMessage(user[res.userid].telegramId, res.response);
  });
});

async function loadUserList() {
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

function stateInfo(type) {
  return {
    status: type
  };
}

loadUserList();

// loadUserList();

bot.sendMessage(1097526124, `service was rebuilt complete`);
