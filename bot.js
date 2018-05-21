var HTTPS = require('https');

var botID = process.env.BOT_ID,
botCommand =  /^\/roll/;
//roll
//d4, d6, d8, d10, d20 [mod]
//min max [mod]
// @User rolled: val


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

function commandHandler(relThis, command){

  var msg = "@" + command.name + " rolled ";

  var count = 1, min = 1, max = 100, mod = NaN, sum = 0, rolls = [];

  if (args = command.text.match(/(\d+)[dD](\d+)(\s*[+-]?\d+)?/)) {

      [count, max, mod] = args.slice(1).map(Number);

      msg += count + "d" + max;

  } else if (args = command.text.match(/(\d+)[\s-]+(\d+)(\s*[+-]?\d+)?/)) {

      [min, max, mod] = args.slice(1).map(Number);

      msg += min + "-" + max;

  }

  for (var i = 0; i < count; i++) {

    var roll = min + Math.floor(Math.random()*(max-min+1));

    rolls.push(roll);

    sum += roll;

  }

  if (!isNaN(mod)) {

    sum += mod;

    msg += mod < 0 ? mod : ("+" + mod);

  }

  msg += ": " + sum;

  if ((count > 1 || !isNaN(mod)) && count < 50) {

    msg += " [" + rolls.join(" ") + "]";

  }

  console.log({count, min, max, mod, sum, rolls, msg});
  
  relThis.res.writeHead(200);
  postMessage(msg, command.name, command.user_id);
  relThis.res.end();
  
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
