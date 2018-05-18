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
  var rollCount = 1, rollMin = 1, rollMax = 100, rollMod = NaN;

  if (args = command.text.match(/(\d+)[dD](\d+)(\s+[+-]?\d+)?/)) {
      [rollCount, rollMax, rollMod] = args.slice(1).map(Number);
  } else if (args = command.text.match(/(\d+)\s+(\d+)(\s+\d+)?/)) {
      [rollMin, rollMax, rollMod] = args.slice(1).map(Number);
  }  

  var rollResult = roll(rollCount, rollMin, rollMax, rollMod);
  var rollString = 
    "[" + 
    (rollCount == 1 ? '' : (rollCount + "x ")) +
    (rollMin + "-" + rollMax) +
    (isNaN(rollMod) ? '' : (rollMod < 0 ? (" " + rollMod) : (" +" + rollMod))) +
    "]";

  console.log({rollCount, rollMin, rollMax, rollMod, rollResult, rollString});
  relThis.res.writeHead(200);
  postMessage("@" + command.name + " rolled: " + rollResult + " " + rollString, command.name, command.user_id);
  relThis.res.end();
  
}

function roll(count, min, max, mod){
  var result = 0;
  for (var i = 0; i < count; i++) {
    result += (min + Math.floor(Math.random()*(max-min+1)));
  }
  if (!isNaN(mod)) {
    result += mod;
  }
  return result;
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
