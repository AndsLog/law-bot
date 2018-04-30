'use strict';

console.log("App start");

const line = require('@line/bot-sdk');
const express = require('express');

// create LINE SDK config from env variables
const config = {
  channelAccessToken: 'YBj7tCC0v+3hSQS1OPOI3WGgpuiWwOqA+vs6AlZPgc7kksKaZnXXKMSDovk492L64WbEBSRPcq7Yr9WZ8EKS0un7/AJPpCP92Rr4Y+H+DxUnF/ZVzS20I+iNEBCe1oGEblvmazUj0D5157DnSQhAagdB04t89/1O/w1cDnyilFU=',
  channelSecret: 'cb52a3777c92132d08710579a22a5424',
};

// create LINE SDK client
const client = new line.Client(config);

console.log("Line bot create");

// create Express app
// about Express itself: https://expressjs.com/
const app = express();

// listen on port
// const port = process.env.PORT || 3000;
// app.listen(port, () => {
//   console.log(`listening on ${port}`);
// });

const server = app.listen(process.env.PORT || 8080, function() {
  const port = server.address().port;
  console.log("App now running on port", port);
});

// register a webhook handler with middleware
// about the middleware, please refer to doc
app.post('/callback', line.middleware(config), (req, res) => {
  Promise
    .all(req.body.events.map(handleEvent))
    .then((result) => res.json(result))
    .catch((err) => {
      console.error(err);
      res.status(500).end();
    });
});

// event handler
function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') {
    // ignore non-text-message event
    return Promise.resolve(null);
  }

  // create a echoing text message
  const echo = { type: 'text', text: event.message.text };

  // use reply API
  return client.replyMessage(event.replyToken, echo);
}
