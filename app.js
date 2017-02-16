/**
 * Module dependencies.
 */
var express = require('express');
var express_app = express();
var bodyParser = require('body-parser');
var alexa = require('alexa-app');
var url = require('url');
var verifier = require('alexa-verifier');
var client = "awis.amazonaws.com";
var SpeechHandler = require('./speech_handler.js')
var constants = require('./septa_constants.js');
var speechHandlerInstance = new SpeechHandler()



//var appId = 'amzn1.echo-sdk-ams.app.655fae42-075f-4425-827b-8999daeb188a' //Amazon Echo App ID
var app = new alexa.app("Philly Rails");

var responseHandler = function(shouldEndSession, speechText, cardTitle, cardSubtitle, cardContents, rempromptText, request, response){
    response.say(speechText);
    response.reprompt(rempromptText);
    response.card({ type: "Simple", title: cardTitle, subtitle: cardSubtitle, content: cardContents });
    response.shouldEndSession(shouldEndSession);
    response.send();
}

//Handle Echo Launch Request with welcome message
app.launch(function(request, response){
    var speechText = "Welcome to the " + constants.SKILL_NAME + " Skill. Try asking me for next trains from Philmont to Subarban Station'";
    var cardTitle = constants.SKILL_NAME + " Skill Launched";
    var cardSubtitle = "Get your train times here!";
    var cardContents = "Try a new command like 'Alexa, ask " + constants.SKILL_NAME + " for next trains from Philmont to Subarban station'";    
    var shouldEndSession = false;
    var rempromptText = "What stations would you like to know about? Say quit to cancel"
    responseHandler(shouldEndSession, speechText, cardTitle, cardSubtitle, cardContents, rempromptText, request, response, request, response);
});

//Handle Echo request for train time
app.intent('getNextArrival', {
    "slots": {
        "START": "LIST_OF_STATIONS",
        "END": "LIST_OF_STATIONS"        
    },
    "utterances": [
      "next train {leaving|from} {-|START} {to|going to} {-|END}",
      "{what's | what is | when is | when's} the next train {leaving|from} {-|START} {to|going to} {-|END}",
      "what {time's | time is} the next train {leaving|from} {-|START} {to|going to} {-|END}",
      "time {leaving|from} {-|START} {to|going to} {-|END}"
    ]
}, function (request, response, callback) {
    if (request.data.request.intent.slots) {
        speechHandlerInstance.handleSeptaRequest(request, response, callback);
        return false;
    } else {
        return callback(new Error("Missing required inputs, please try again"));
    }
});
app.intent('AMAZON.HelpIntent', function (request, response) {
    var speechText = "Try asking me about the arrival times to and from different train stations by saying 'when is the next train leaving Suburban Station to 30th Street Station'";
    var cardTitle = constants.SKILL_NAME + " Help";
    var cardSubtitle = "Hope this helps";
    var cardContents = "Try asking me about the arrival times for different train stations by saying 'What are the times from Airport to Subarban station' or " +
      "request a specific direction like 'Ask " + constants.SKILL_NAME + " for trains at Subarban station going to West Trenton'";
    var shouldEndSession = false;
    var rempromptText = "What stations would you like to know about? Say quit to cancel"
    responseHandler(shouldEndSession, speechText, cardTitle, cardSubtitle, cardContents, rempromptText, request, response);
});
app.intent('AMAZON.StopIntent', function (request, response) {
    var speechText = "Bye now";
    var cardTitle = constants.SKILL_NAME + " Session Closed";
    var cardSubtitle = "Have a great day";
    var cardContents = "";
    var repromptText = "";
    var shouldEndSession = true;
    responseHandler(shouldEndSession, speechText, cardTitle, cardSubtitle, cardContents, repromptText, request, response);
});
app.sessionEnded(function (request, response) {
    // cleanup the user's server-side session
    logout(request.userId);
    // no response required
});
app.post = function (request, response, type, exception) {
    if (exception) {
        // always turn an exception into a successful response
        response.clear().say(exception).send();
    }
};
//Setup for Express server
app.express({ expressApp: express_app, router: express.Router() });
exports.handler = app.lambda();
//var PORT = process.env.port || 8080;
//express_app.listen(PORT, function () {
//    console.log("Node app is running at localhost:"+PORT);
//});
//express_app.set("view engine", "ejs");
//app.schema();
//app.utterances();