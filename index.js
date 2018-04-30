'use strict';

console.log('App start');

const line = require('@line/bot-sdk');
const express = require('express');
const request = require('request');
const cheerio = require('cheerio');

// create LINE SDK config from env variables
const config = {
  channelAccessToken: 'YBj7tCC0v+3hSQS1OPOI3WGgpuiWwOqA+vs6AlZPgc7kksKaZnXXKMSDovk492L64WbEBSRPcq7Yr9WZ8EKS0un7/AJPpCP92Rr4Y+H+DxUnF/ZVzS20I+iNEBCe1oGEblvmazUj0D5157DnSQhAagdB04t89/1O/w1cDnyilFU=',
  channelSecret: 'cb52a3777c92132d08710579a22a5424'
};

const lawGovUrl = 'https://lis.ly.gov.tw/lglawc/lglawkm';
const countryLawUrl = 'https://law.moj.gov.tw//Schedule/cll.html';

let userId = '';
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
  Promise
    .all(req.body.events.map(handleEvent))
    .then((result) => res.status(200).json(result))
    .catch((err) => {
      console.error(err);
      res.status(500).end();
    });
});

// event handler
function handleEvent (event) {
  if (event.type !== 'message' || event.message.type !== 'text') {
    // ignore non-text-message event
    return Promise.resolve(null);
  }

  // create a echoing text message
  // const echo = { type: 'text', text: event.message.text };
  userId = event.source.userId;
  lawSearch();

  // use reply API
  // return client.replyMessage(event.replyToken, echo);
}

function lawSearch () {
  request({
    url: lawGovUrl,
    method: 'GET'
  }, function (error, response, body) {
    if (error || !body) {
      return;
    }
    let $ = cheerio.load(body); // 載入 body
    let lawsTableTrs = $('table.sumtab').find('tr');
    let results = [];
    for (let i = 1; i < lawsTableTrs.length; i++) {
      let lawsTds = lawsTableTrs.eq(i).find('td');
      let status = lawsTds.eq(2).text();
      let content = lawsTds.eq(3).text();

      let publishedLaw = {
        type: 'text',
        text: status.replace(/\r\n|\n/g, '') + ': ' + content.replace(/\r\n|\n/g, '')
      };
      results.push(publishedLaw);

      if (results.length === 5) {
        console.log(results);
        client.pushMessage(userId, results);
        results = [];
        console.log('empty: ' + results);
      }
    }
  });
}
