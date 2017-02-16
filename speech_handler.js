var SpeechHandler = function() {}

/**
 * Module dependencies.
 */
var septaApi = require('./septa_api.js')
var septaApiInstance = new septaApi()
var util = require('util')
var constants = require('./septa_constants.js');

//Print any errors
function handleError(errorText, intent, response, callback) {
    console.log(errorText);
    var shouldEndSession = true;
    responseHandler(shouldEndSession,errorText + " Please try again.","Error",null,errorText,null,intent,response)
}

/** 
* Credit to Dexter
* http://stackoverflow.com/questions/4878756/javascript-how-to-capitalize-first-letter-of-each-word-like-a-2-word-city
*/
function toTitleCase(str)
{
    if(str)
        return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
}
var responseHandler = function (shouldEndSession, speechText, cardTitle, cardSubtitle, cardContents, rempromptText, request, response) {
    response.say(speechText);
    response.reprompt(rempromptText);
    response.card({ type: "Simple", title: cardTitle, subtitle: cardSubtitle, content: cardContents });
    response.shouldEndSession(shouldEndSession);
    response.send();
}
/**
 * Filters the API results down to the event for a specific start station and destination
 * @param {Object} intent
 * @param {Function} callback
 */
SpeechHandler.prototype.handleSeptaRequest = function (intent, response, callback) {
    //console.log("FULL INTENT: " + util.inspect(intent, false, null));
    console.log("SLOTS: " + util.inspect(intent.data.request.intent.slots, false, null));
    console.log("Start: " + util.inspect(intent.slot('START'), false, null));
    console.log("End: " + util.inspect(intent.slot('END'), false, null));
    var start = intent.slot('START'), end = intent.slot('END');

    //only support request with both a start and a end
    var shouldEndSession = true;
    var cardContents, speechText;
    var cardTitle = start;
    var cardSubtitle = constants.SKILL_NAME + " Times";

    if (start && end) {
        start = toTitleCase(start);
        end = toTitleCase(end);
        
        //request several arrival times for that station from the Septa API
        septaApiInstance.getNextArrival(start, end, function (err, result) {
            if (err) {
                handleError(err, intent, response, callback);
                return false;
            } else {
                console.log(result)
                speechText = result[0].orig_line + " train leaving " + start;
                var hasSaidOneDirection = false;
                result.forEach(function (event) {
                    speechText += " at " + event.orig_departure_time + ", is ";
                    if (event.orig_delay === "On time") {
                        speechText += " on time";
                    } else {
                        speechText += event.orig_delay + " late"
                    }                    
                })
                console.log("SPEECH TEXT: " + speechText);
                cardContents = speechText;
                responseHandler(shouldEndSession, speechText, cardTitle, cardSubtitle, cardContents, "", intent, response);
                callback();
            }
        });
        return false;
    }
    else if (start && !end) {
        handleError("Must specify a start station and end station.", intent, response, callback);
        return;
    }
    else {
        handleError("Must specify a start station and end station.", intent, response, callback);
        return;
    }    
}


/**
 * Unit tests the handleMartaRequest function
 * execute 'nodeunit speech_handler.js' to run
 * @param {Object} test
 */
SpeechHandler.testHandleSeptaRequest = function(test){
    var testIntent = {
        "name": "Septa",
        "slots": {
            "Start": {
                "name": "LIST_OF_STATIONS",
                "value": "Philmont"
            },
            "End": {
                "name": "LIST_OF_STATIONS",
                "value": "Subarban Station"
            }
        }
    }
    septaApiInstance.getNextArrival = function(station, end, callback) {
        callback(null, 2)
    };

    var speechHandler = new SpeechHandler();
    speechHandler.handleSeptaRequest(testIntent, function callback(quitSession, speechText, cardTitle, cardSubtitle, cardContents, sessionObject) {
        var expectedSpeechText = "The next south bound train will arrive at North Avenue station in 2 minutes"
        test.equal(speechText, expectedSpeechText, "SpeechHandler failed to produced expected output");
    })
    test.done();
};

module.exports = SpeechHandler
