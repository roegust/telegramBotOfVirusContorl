const request = require("request");

const cookie = "youCookie=whrs=whrs&eventid=1";
const url = "https://familyweb.wistron.com/whrs/temperature_addnew_act.aspx";
const j = request.jar();

const moment = require("moment-timezone");
var dateToFill = moment()
  .tz("Asia/Taipei")
  .format("YYYY/MM/DD");

headers = {
  Cookie: "",
  Origin: "https://familyweb.wistron.com",
  Referer: "https://familyweb.wistron.com/whrs/temperature.aspx",
  "Upgrade-Insecure-Requests": 1
};

form = {
  survey: 0,
  empid: null,
  eventid: 1,
  trip: 1,
  travel: 1,
  notice: 1,
  measure_date: dateToFill, //like '2020/3/11'
  symptom: 1
};

// for fiddler fetch info
// process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';

exports.autofill(userid, usernm) = new Promise((res, rej) => {
  try {
    headers["Cookie"] = cookie + "&empid=" + userid + "&name=" + usernm;
    form["empid"] = userid;

    request.post(
      {
        url: url,
        jar: j,
        form: form,
        headers: headers
        // proxy: "http://127.0.0.1:8888" // for fiddler
      },
      function(err, resp, body) {
        // resp_msg = body
        resp_msg = body.split`('`[1].split`')`[0];
        res(`[${dateToFill}] (${userid}}) ${resp_msg}`);
      }
    );
  } catch (err) {
    rej(err);
  }
});
