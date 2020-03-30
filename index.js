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
  " 0 8 * * *",
  async function() {
    await loadUserList();
    const userid = Object.keys(user);
    const req = require("./request.js");
    const getUser = rxjs
      .from(userid)
      .pipe(rxjs_op.filter(item => user[item].active === "1"))
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
  if (state[msg.chat.id] !== undefined) {
    state[msg.chat.id].status = "";
  }
  bot.sendMessage(
    msg.chat.id,
    `*Quick start* 
 /info - check user information
 /add - add new user
 /active - active user in daily job
 /deactive - deactive user in daily job`,
    { parse_mode: "Markdown" }
  );
});

bot.onText(/((\d{7,8}))/, async (msg, match) => {
  if (state[msg.chat.id] !== undefined) {
    if (state[msg.chat.id].status === "info") {
      await loadUserList();
      if (user[match[1]] !== undefined) {
        await bot.sendMessage(
          msg.chat.id,
          `userId: ${match[1]} , name: ${user[match[1]].name} ,chatid: ${
            user[match[1]].telegramId
          }`
        );
        await bot.sendMessage(
          msg.chat.id,
          `user: ${match[1]} ${
            user[match[1]].active === "1"
              ? "is already actived in daily job"
              : "is not actived in daily job"
          }`
        );
      } else {
        await bot.sendMessage(
          msg.chat.id,
          `no information of user: ${match[1]}, please add user first`
        );
      }

      state[msg.chat.id].status = "";
    } else if (
      state[msg.chat.id].status === "deactive" ||
      state[msg.chat.id].status === "active"
    ) {
      if (
        user[match[1]] !== undefined &&
        msg.chat.id === user[match[1]].telegramId
      ) {
        await request.post(
          {
            url:
              "https://script.google.com/macros/s/AKfycbxcqmLhGC1Njn0vxJfvFpIfQaY81xMZmUU-3H9IgE7NpUiW7hR2/exec",
            followAllRedirects: true,
            form: {
              userid: match[1],
              action: state[msg.chat.id].status
            }
          },
          (error, res, body) => {
            if (error) {
              console.error(error);
              return;
            }
            bot.sendMessage(msg.chat.id, body);
          }
        );
      } else if (user[match[1]] === undefined) {
        await bot.sendMessage(
          msg.chat.id,
          `There is no user of userid: ${match[1]}, please add user first`
        );
      } else if (msg.chat.id !== user[match[1]].telegramId) {
        await bot.sendMessage(
          msg.chat.id,
          `You have no authority to do active/deactive for this user: ${match[1]}`
        );
      }

      state[msg.chat.id].status = "";
    }
  }
});

bot.onText(/(\d{7,8})(\@)(.+)/, async (msg, match) => {
  // console.log(match[1], match[3]);
  if (state[msg.chat.id] !== undefined) {
    if (state[msg.chat.id].status === "add") {
      if (user[match[1]] === undefined) {
        await request.post(
          {
            url:
              "https://script.google.com/macros/s/AKfycbxcqmLhGC1Njn0vxJfvFpIfQaY81xMZmUU-3H9IgE7NpUiW7hR2/exec",
            followAllRedirects: true,
            form: {
              userid: match[1],
              name: match[3],
              chatid: msg.chat.id,
              action: "add"
            }
          },
          (error, res, body) => {
            if (error) {
              console.error(error);
              return;
            }
            bot.sendMessage(msg.chat.id, `Add user ${match[1]} success`);
          }
        );
      } else {
        bot.sendMessage(msg.chat.id, `User ${match[1]} is already in the list`);
      }

      state[msg.chat.id].status = "";
    }
  }
});

bot.onText(/\/add/, msg => {
  if (state[msg.chat.id] === undefined) {
    state[msg.chat.id] = stateInfo("add");
  } else {
    state[msg.chat.id].status = "add";
  }
  // bot.sendMessage(
  //   msg.chat.id,
  //   "Please add your info at https://docs.google.com/spreadsheets/d/16ctbzOVdulA8poPSlj6SUNk50HO-Fi94aJbh8O_kvsg/edit?usp=sharing"
  // );
  // bot.sendMessage(msg.chat.id, "Your chat ID is " + msg.chat.id);
  bot.sendMessage(
    msg.chat.id,
    "Please enter your information. ex: '10610150@宗家榮'"
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

bot.onText(/\/active/, msg => {
  if (state[msg.chat.id] === undefined) {
    state[msg.chat.id] = stateInfo("active");
  } else {
    state[msg.chat.id].status = "active";
  }
  // console.log(state)
  bot.sendMessage(msg.chat.id, "Please enter your employee ID");
});

bot.onText(/\/deactive/, msg => {
  if (state[msg.chat.id] === undefined) {
    state[msg.chat.id] = stateInfo("deactive");
  } else {
    state[msg.chat.id].status = "deactive";
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

bot.onText(/\/reload/, async msg => {
  await loadUserList();
  console.log(user);
});

bot.onText(/\/rxjs/, async msg => {
  await loadUserList();
  const userid = Object.keys(user);
  const req = require("./request.js");
  const getUser = rxjs
    .from(userid)
    .pipe(rxjs_op.filter(item => user[item].active === "1"))
    .pipe(rxjs_op.concatMap(item => rxjs.of(item).pipe(rxjs_op.delay(2000))));
  // const result = getUser.pipe(
  //   rxjs_op.mergeMap(item => req.autofill(item, user[item].name))
  // );
  // result.subscribe(res => {
  //   bot.sendMessage(user[res.userid].telegramId, res.response);
  // });
  getUser.subscribe(e => {
    console.log(e);
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
      telegramId: e.chatId,
      active: e.active
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
