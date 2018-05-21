'use strict';

console.log('App start');

const line = require('@line/bot-sdk');
const express = require('express');
const request = require('request');
const cheerio = require('cheerio');

// create LINE SDK config from env variables
const config = {
  channelAccessToken: process.env.channelAccessToken,
  channelSecret: process.env.channelSecret
};

const lawGovUrl = 'https://lis.ly.gov.tw/lglawc/lglawkm';
const countryLawUrl = 'https://law.moj.gov.tw//Schedule/cll.html';

const verifyUserId = 'Udeadbeefdeadbeefdeadbeefdeadbeef';

// create LINE SDK client
const client = new line.Client(config);

console.log('Line bot create');

// create Express app
// about Express itself: https://expressjs.com/
const app = express();

// listen on port
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`listening on ${port}`);
});

// register a webhook handler with middleware
// about the middleware, please refer to doc
app.post('/callback', line.middleware(config), (req, res) => {
  return Promise.all(req.body.events.map((event) => {
    let replyToken = event.replyToken;
    let eventType = undefined === event.type ? null : event.type;
    let messageType = undefined === event.message ? null : event.message.type;
    let userId = undefined === event.source.userId ? null : event.source.userId;

    if (eventType === 'join' || eventType === 'follow') {
      let sourceId = event.source.userId || event.source.roomId || event.source.groupId;
      let greetingString = '這是法律查詢 andy Bot，很高興為您服務';
      let results = {
        type: 'text',
        text: greetingString
      };
      return Promise.all([
        eventType,
        client.pushMessage(sourceId, results)
      ]);
    }

    if ((eventType === 'message' || messageType === 'text') && userId !== verifyUserId) {
      return new Promise((resolve, reject) => {
        request(lawGovUrl, function (error, response, body) {
          if (error || !body) {
            return;
          }

          let $ = cheerio.load(body); // 載入 body
          let lawsTableTrs = $('table.sumtab').find('tr');
          let textString = '';
          for (let i = 1; i < lawsTableTrs.length; i++) {
            let lawsTds = lawsTableTrs.eq(i).find('td');
            let date = lawsTds.eq(1).text();
            let status = lawsTds.eq(2).text();
            let content = lawsTds.eq(3).find('a').text();
            let url = lawsTds.eq(3).find('a').attr('href');

            textString += date.replace(/\r\n|\n/g, '') + '， ' +
            status.replace(/\r\n|\n/g, '') + ': ' + content.replace(/\r\n|\n/g, '') + '\n' +
            ' 網址: https://lis.ly.gov.tw' + encodeURI(url) + '\n' +
            '-----------' + '\n';
          }
          let results = {
            type: 'text',
            text: textString
          };
          console.log(results);
          resolve(results);
        });
      }).then((results) => {
        return Promise.all([
          eventType,
          client.replyMessage(replyToken, results)
        ]);
      });
    }

    return Promise.resolve(eventType);
  })).then((eventType) => {
    let types = eventType[0];
    let type = types instanceof Array ? types[0] : null;
    let resJson = {
      status: 'success',
      type: type === null ? types : type
    };
    console.log(resJson);
    res.status(200).json(resJson);
  }).catch((err) => {
    console.error(err);
    res.status(500).json(err);
  });
});
