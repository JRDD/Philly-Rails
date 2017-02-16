var unirest, constants, septaApiBaseUrl, stationVerificationError = "Unexpected Error occured. GoodBye.";
var stationsVerified = function (start, end) {
    
    var startExist = constants.LIST_OF_STATIONS.indexOf(start);
    var endExist = constants.LIST_OF_STATIONS.indexOf(end)
    if (startExist > -1 && endExist > -1) {
        return true
    }
    else if (startExist === -1) {
        stationVerificationError = start + " is not a recognized as a valid station.";
    }
    else if (endExist === -1) {
        stationVerificationError = end + " is not a recognized as a valid station."
    }
    return stationVerificationError
}
var Septa = function() {
    unirest = require('unirest');
    constants = require('./septa_constants.js');
	//Base URL for Septa API
	septaApiBaseUrl = "https://www3.septa.org/hackathon/NextToArrive/{startStation}/{endStation}/1"
}

/**
 * Makes request to Septa API to get next arrival for start and end station
 * @param {String} startStation
 * @param {String} endStation
 * @param {Function} callback
 */
Septa.prototype.getNextArrival = function (startStation, endStation, callback) {
    var startParam = startStation, endParam = endStation;
    if (startStation.indexOf("Street") > -1 && startStation.indexOf("30th") === -1) {
        startParam = startStation.replace("Street", "St");
    }
    if (endStation.indexOf("Street") > -1 && endStation.indexOf("30th") === -1) {
        endParam = endStation.replace("Street", "St");
    }
    if (stationsVerified(startParam, endParam) === true) {
        
        var url = septaApiBaseUrl.replace('{startStation}', startParam).replace('{endStation}', endParam);
        console.log(url);

        unirest.get(url)
        .header("Accept", "application/json")
        .end(function (result) {
            console.log(result);
            if (result.status > 400) {
                callback(constants.SKILL_NAME + " is experiancing some unexpected error.", null);
                return;
            }
            if (result.body.length)
                callback(null, result.body);
            else
                callback("I could not find times for " + startStation + " to " + endStation + ". Please make sure that the stations are connected by the same line.", null)
        });        
    }
    else {
        console.log("station not verified")
        callback(stationVerificationError, null)
    }
    return false;
}


module.exports = Septa
