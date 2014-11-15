/////////////////////////////
// vars + includes

var twilio			= require('twilio')
 	, client		= twilio('AC3248e744302535fb1bf3d2347b02fc1d', '7b8af20a4682a407b93269983cc5954b')
 	, express 		= require("express")
  // , logfmt          = require("logfmt")
  // , EventSource     = require('eventsource')
  // , http            = require('http')
  // , fs              = require('fs')
  // , url             = require('url')
  // , cors            = require('cors')
 	, bodyParser 	= require('body-parser')
  // , json            = require('json')
 	, urlencode 	= require('urlencode')
 	, cronJob 		= require('cron').CronJob
 	, Firebase 		= require('firebase')
 	, firebaseUrl	= 'https://dazzling-inferno-1361.firebaseio.com/'
 	, dbRef 		= new Firebase( firebaseUrl )
  // , swagger         = require('swagger-node-express')
  // , models          = require('./swagger-models.js')
 	, tNumber 		= '6467791010'
	, numbers 		= []
	, mSubscribe 	= 'Welcome to Brand Development Short Message Service.\nText "Subscribe" receive updates.'
	, mSubscribeError = 'You already subscribed to BDSMS. Text "Menu" to see a list of commands.'
	, mHelp			= 'Text "Leave" or "STOP" to stop receiving updates.\nText "Twitter" with your Twitter username\nor "Instagram" with your Instagram username to be added to BDSMS.net.'
	, mConfirm 		= 'Thank you, you are now subscribed.'
	// , mCron 		= 'Hello! Hope you’re having a good day.'
	, mLeave		= 'You have been removed from the BDSMS system. Thanks for playing!'
	, mAbout		= 'BDSMS stands for Brand Development Short Message System. Use BDSMS to promote your personal brand on the internet! The more you check your stats by typing "Rank" or "R" for short, the more visible your profile will be on BDSMS.net. Enjoy!'
	, app 			= express()
	;

	// Text "Subscribe" receive updates.

/////////////////////////////
// application config 
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: true
}));

/////////////////////////////
// firebase listeners
/* modify numbers array for keeping track of who is subscribed */
dbRef.on('child_added', function(snapshot) {
	numbers.push( snapshot.val().number );
	console.log( 'Added number ' + snapshot.val().number );
	console.log("current numbers: " + numbers);
});
dbRef.on('child_removed', function(snapshot) {
	var index = numbers.indexOf(  snapshot.val().number );
	if (index > -1) {
		numbers.splice(index, 1);
		console.log( 'Removed number ' + snapshot.val().number );
		console.log("current numbers: " + numbers);
	}
});

/////////////////////////////
// application listeners 

/* for when BDSMS receives requests */
app.post('/inbound', function (req, res) {
	
	var resp 		= new twilio.TwimlResponse()
    	, fromNum 	= req.body.From
		, userRef 	= new Firebase( firebaseUrl + '/' + encodeURIComponent(fromNum) )
		, body 		= req.body.Body.trim().toLowerCase()
		;

 	switch (true) {
 		case /subscribe/.test(body):

	    	if (numbers.indexOf(fromNum) !== -1) {
	      		resp.message(mSubscribeError);
	    	} else {
	      		resp.message(mConfirm + ' ' + mHelp);
	      		// definie user model + init vals
	      		dbRef.child( fromNum ).set({"number": fromNum, "rank": 0});
	    	}
	    	break;

	    case /leave/.test(body):
		
			if (numbers.indexOf(fromNum) === -1) {
				resp.message(mSubscribe);
	    	} else {
	    		resp.message(mLeave);
		      	userRef.remove();
		     }
	      	break;

	    case /twitter/.test(body):
		
			if (numbers.indexOf(fromNum) === -1) {
				resp.message(mSubscribe);
	    	} else {
				// remove the first 'twitter ' eight chars from body
	    		var handle = body.slice(8, body.length);
				
				if ( handle.length ) {
					userRef.update({ 
						twitter: handle,
					}
					, onUpdateComplete);
				}
				else {
					resp.message('Did you forget your Twitter username? Text "Twitter" with your Twitter username to be added to BDSMS.net.');
				}
			}
			break;

	    case /instagram/.test(body):
		
			if (numbers.indexOf(fromNum) === -1) {
				resp.message(mSubscribe);
	    	} else {
				// remove the first 'instagram ' ten chars from body
	    		var handle = body.slice(10, body.length);
				
				if ( handle.length ) {
					userRef.update({ 
						instagram: handle,
					}
					, onUpdateComplete);
				}
				else {
					resp.message('Did you forget your Instagram username? Text "Instagram" with your Instagram username to be added to BDSMS.net.');
				}
			}
			break;

 		case /about/.test(body):
		
			if (numbers.indexOf(fromNum) === -1) {
				resp.message(mSubscribe);
	    	} else {

				resp.message(mAbout);
			}
	    	break;

 		case /r/.test(body):
 		case /rank/.test(body):
		
			if (numbers.indexOf(fromNum) === -1) {
				resp.message(mSubscribe);
	    	} else {

				// return user's ranking
				var ref = new Firebase( firebaseUrl + '/' + encodeURIComponent(fromNum) + '/rank' );
				ref.transaction(function(currentRank) {
   					// If rank has never been set, currentRank will be null.

   					var newRank = currentRank+1; // dangerous - should check if currentRan is null or not
					resp.message( "Your rank is now ranked " + newRank + " out of 100" );
  					return newRank;
				}, function(error, committed, snapshot) {
					if (error) {
						// console.log('Transaction failed abnormally!', error);
						resp.message( "Error retrieving your rank! Try again later." );
					} else if (!committed) {
						// console.log('We aborted the transaction.');
						resp.message( "Error retrieving your rank! Try again later." );
					} else {
						// if was updated successfully...
						// resp.message( "Your rank is now ranked " + snapshot.val() + " out of 100" );
					}
				});
			}
	    	break;

		case /menu/.test(body):
		
			if (numbers.indexOf(fromNum) === -1) {
				resp.message(mSubscribe);
	    	} else {
	      		resp.message(mHelp);
	    	}
	    	break;

		default:

			if (numbers.indexOf(fromNum) !== -1) {
	      		resp.message('You already subscribed to BDSMS. Text "Menu" to see a list of commands.');
	    	} else {
				resp.message(mSubscribe);
	    	}
	}
 
	res.writeHead(200, {
		'Content-Type':'text/xml'
	});
	res.end(resp.toString());
});

var onUpdateComplete = function(error) {
  if (error) {
    console.log('Synchronization failed');
  } else {
    console.log('Synchronization succeeded');
  }
};

/* for when BDSMS sends a response */
for( var i = 0; i < numbers.length; i++ ) {

	client.sendMessage( { to:numbers[i], from:tNumber, body:mCron}, function( err, data ) {
		console.log( data.body );
	});
}

/* assign BDSMS to run on port 3000 */
app.listen(3000);