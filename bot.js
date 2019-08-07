var HTTPS = require('https');

var botID = process.env.BOT_ID,
botCommand =  /^\/roll/;


function respond() {
  var request = JSON.parse(this.req.chunks[0]);
  if(request.text && botCommand.test(request.text)){
      commandHandler(this, request);
  } else {
    console.log("don't care");
    this.res.writeHead(200);
    this.res.end();
  }
}

function toSignedString(num) {
  if (isNaN(num) || num == 0) return '';
  if (num < 0) return '' + num;
  return '+' + num;
}

function toNumber(str) {
 if (typeof str == "string") str = str.replace(/\s/g, '');
 return parseInt(str);
}

function commandHandler(relThis, command){

  var count = 1, min = 1, max = 100, pre = NaN, post = NaN, msg = "1-100", rolls = [], sum = 0;

  if (args = command.text.match(/(\d+)(\s*[+-]?\s*\d+)?[dD](\d+)(\s*[+-]?\s*\d+)?/)) {

      [count, pre, max, post] = args.slice(1).map(toNumber);

      msg = count + toSignedString(pre) + "d" + max + toSignedString(post);

  } else if (args = command.text.match(/(\d+)[\s-]+(\d+)(\s*[+-]?\s*\d+)?/)) {

      [min, max, post] = args.slice(1).map(toNumber);

      msg = min + "-" + max + toSignedString(post);

  } else if (args = command.text.match(/[Mm]{2,}\s*[+-]?(\d+)?/)) {

    var [level] = args.slice(1).map(toNumber);
    level = level || 1;

    max = 4;
    count = 2 + level;
    pre = 1;

    msg = "Magic Missle Level " + level;

  }

  for (var i = 0; i < count; i++) {

    var roll = min + Math.floor(Math.random()*(max-min+1));

    rolls.push(roll);

    sum += roll;

    if (!isNaN(pre)) sum += pre;

  }

  if (!isNaN(post)) sum += post;

  msg = "" + command.name + " rolled " + msg + ": " + sum;

  if ((count > 1 || !isNaN(pre) || !isNaN(post)) && count < 50) {

    msg += " [" + rolls.join(" ") + "]";

  }

  console.log({count, min, max, pre, post, sum, rolls, msg});

  relThis.res.writeHead(200);
  relThis.res.end();

  setTimeout(function(){ postMessage(msg, command.name, command.user_id); }, 500);

}

function postMessage(message, name, id) {
  var botResponse, options, body, botReq;
  options = {
    hostname: 'api.groupme.com',
    path: '/v3/bots/post',
    method: 'POST'
  };

  body = {
    "bot_id" : botID,
    "text" : message,
    "attachments": [
    {
      "type": "mentions",
      "user_ids": [id],
      "loci": [
        [0,name.length + 1]
      ]

    }
    ]
  };

  botReq = HTTPS.request(options, function(res) {
      if(res.statusCode == 202) {
        //neat
      } else {
        console.log('rejecting bad status code ' + res.statusCode);
      }
  });

  botReq.on('error', function(err) {
    console.log('error posting message '  + JSON.stringify(err));
  });
  botReq.on('timeout', function(err) {
    console.log('timeout posting message '  + JSON.stringify(err));
  });
  botReq.end(JSON.stringify(body));
}


exports.respond = respond;
