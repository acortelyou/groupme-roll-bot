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
   return '' + ((isNaN(num) || num == 0) ? '' : (num < 0 ? num : ('+' + num)));
}

function commandHandler(relThis, command){

  var msg = "@" + command.name + " rolled ";

  var count = 1, min = 1, max = 100, pre = NaN, post = NaN, sum = 0, rolls = [];

  if (args = command.text.match(/(\d+)(\s*[+-]?\s*\d+)?[dD](\d+)(\s*[+-]?\s*\d+)?/)) {

      [count, pre, max, post] = args.slice(1).map(x => parseInt(typeof x == "string" ? x.replace(/\s/g, '') : x));

      msg += count + toSignedString(pre) + "d" + max + toSignedString(post);

  } else if (args = command.text.match(/(\d+)[\s-]+(\d+)(\s*[+-]?\s*\d+)?/)) {

      [min, max, post] = args.slice(1).map(x => parseInt(typeof x == "string" ? x.replace(/\s/g, '') : x));

      msg += min + "-" + max + toSignedString(post);

  }

  for (var i = 0; i < count; i++) {

    var roll = min + Math.floor(Math.random()*(max-min+1));

    rolls.push(roll);

    sum += roll + (isNaN(pre) ? 0 : pre);
    
  }
  
  sum += (isNaN(post) ? 0 : post);

  msg += ": " + sum;

  if ((count > 1 || !isNaN(pre) || !isNaN(post)) && count < 50) {

    msg += " [" + rolls.join(" ") + "]";

  }

  console.log({count, min, max, pre, post, sum, rolls, msg});
  
  relThis.res.writeHead(200);
  relThis.res.end();
  
  postMessage(msg, command.name, command.user_id);
  
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
