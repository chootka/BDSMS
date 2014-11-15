var twilio			= require('twilio')
	, client		= twilio('AC3248e744302535fb1bf3d2347b02fc1d', '7b8af20a4682a407b93269983cc5954b')
	 , express 		= require("express")
  // , logfmt          = require("logfmt")
  // , EventSource     = require('eventsource')
  // , http            = require('http')
  // , fs              = require('fs')
  // , url             = require('url')
  // , cors            = require('cors')
  , bodyParser      = require('body-parser')
  // , json            = require('json')
  , urlencode       = require('urlencode')
  , cronJob 		= require('cron').CronJob
  // , swagger         = require('swagger-node-express')
  // , models          = require('./swagger-models.js')
  ;

var numbers = ['9176058517', '9176058517'];
var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: true
}));

app.post('/inbound', function (req, res) {
  var resp = new twilio.TwimlResponse();
  resp.message('Welcome to Brand Development Short Message Service. Which of your identities would you like to develop?');
  res.writeHead(200, {
    'Content-Type':'text/xml'
  });
  res.end(resp.toString());
});

for( var i = 0; i < numbers.length; i++ ) {
  client.sendMessage( { to:numbers[i], from:'6467791010', body:'Hello! Hope you’re having a good day.'}, function( err, data ) {
    console.log( data.body );
  });
}

app.listen(3000);