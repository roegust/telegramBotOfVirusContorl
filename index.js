var CronJob = require("cron").CronJob;

// telegram settings
const TelegramBot = require("node-telegram-bot-api");
const token = "1062087849:AAFnz4p26ac3DsjPXEDh0fvMiahQjEZQRS8";
const bot = new TelegramBot(token, { polling: true });

//googlesheet setting

const { GoogleSpreadsheet } = require('google-spreadsheet');
const doc = new GoogleSpreadsheet('16ctbzOVdulA8poPSlj6SUNk50HO-Fi94aJbh8O_kvsg');
const apikey = "AIzaSyA47786EfVYYCcALQRV5JcsvNR-YVAAKR8"


user = {};


// run the job everyday at 8 a.m.
var job = new CronJob(
  "0 8  * * *",
  function () {
    
    reloadUserList().then(() =>{
      Object.keys(user).forEach(e => {
        // console.log(e)
        const req = require("./request.js");
        req.autofill(e, user[e].name).then(res => {
          bot.sendMessage(user[e].telegramId, res);
        });
      })
    });
    

  },
  null,
  true,
  "Asia/Taipei"
);

job.start();

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, `*Quick start* 
  /info empid - 1. Check your information in the google sheet is correct.
                2. If you haven't add your info in sheet,
                   please attention on the chatId and fill in your infomation on the google sheet.
  `, {parse_mode: "Markdown"});
});

bot.onText(/\/info (\d{8})/, (msg, match) => {  
  reloadUserList().then(()=>{
    if(user[match[1]] !== undefined){    
      bot.sendMessage(msg.chat.id, `userId: ${match[1]} , name: ${user[match[1]].name} ,chatId: ${user[match[1]].telegramId}`);
    }else{
      bot.sendMessage(msg.chat.id, ``);
      bot.sendMessage(msg.chat.id, `There is no information of  ${match[1]}
                      Your Chat ID is ${msg.chat.id}
                      Please add your info at https://docs.google.com/spreadsheets/d/16ctbzOVdulA8poPSlj6SUNk50HO-Fi94aJbh8O_kvsg/edit?usp=sharing
                      `, {parse_mode: "Markdown"});
    }
  });
  
});

user
bot.onText(/\/test (\d{8})/, (msg, match) => {
  
  reloadUserList().then(()=>{
    const message = match[1];

    if (user[message] !== undefined && user[message].telegramId === null) {
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
  
});

async function reloadUserList(){
  
  doc.useApiKey(apikey);

  await doc.loadInfo();
  const sheet = doc.sheetsByIndex[0];
  const rows = await sheet.getRows();

  rows.forEach(e=>{
    user[e.userId] = {
      "name": e.name,
      "telegramId": e.chatId
    }
  })

}


reloadUserList();
