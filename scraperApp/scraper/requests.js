var request = require('request');
var apiKey = require('./apiKey').apiKey;
var regionalUrls = require('./regionalUrls');

function getMasteryDataForId(summonerId, region, callback){
    var url = regionalUrls.urls[region].masteryUrl;
    url += summonerId;
    url += "/champions" + apiKey;
    request(url, function(error, response, body){
        if (error === null && response.statusCode === 429) {
            var timeout = parseInt(response.headers["retry-after"]) + 1;
            console.log("Request limit exceeded. Waiting: " + timeout + " seconds.");
            setTimeout(function() {
                getMasteryDataForId(summonerId, region, callback);
            }, timeout*1000);
        }else if (error === null) {
           //setTimeout(function() {
                callback(JSON.parse(body));
            //}, 6);
        }else{
            console.log(error.message);
            setTimeout(function() {
                getMasteryDataForId(summonerId, region, callback);
            }, 5000);
        }
    });
}

function getIdForSummonerName(summonerName, region, callback, callback2){
    var url = regionalUrls.urls[region].summonerUrl;
    url += summonerName;
    url += apiKey;

    request(url, function(error, response, body) {
        console.log(body);
        var data = JSON.parse(body);
        var keys = [];
        for (var key in data){
            keys.push(key);
        }
        var summonerId = data[keys[0]].id;

        callback(summonerId, callback2);
        return summonerId;
    });
}

function getMasteryDataForSummonerName(summonerName, region, callback){
    getIdForSummonerName(summonerName, region, getMasteryDataForId, callback);
}

module.exports.getMasteryDataForId = getMasteryDataForId;
module.exports.getIdForSummonerName = getIdForSummonerName;
module.exports.getMasteryDataForSummonerName = getMasteryDataForSummonerName;