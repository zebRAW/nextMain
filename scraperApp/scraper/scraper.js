var express = require('express');
var requests = require('./requests.js');
var firebase = require('./firebase.js');
var router = express.Router();
var fbData;
var fbLoaded = false;
var regionalUrls = require('./regionalUrls');
var running = false;
var stacks = 0;
var maxStacks = 20000;
var firstTime = true;
var threads = 30;


function startScraping (){
    console.log("Scraping has been started.");

    if (running == false) {
        running = true;
        if (firstTime) {
            setTimeout(function () {
                for (var region in fbData.summoners) {
                    firstTime = false;
                    scraper(fbData.summoners[region], region);
                }
            }, 15000);
        }else{
            for (var region in fbData.summoners) {
                scraper(fbData.summoners[region], region);
            }
        }
    }
}

function scraperThread(summonerId, region) {
    stacks++;
    if (stacks%1000 === 0){
        console.log(stacks);
    }
    requests.getMasteryDataForId(summonerId, region, function (masteryData) {
        if (masteryData[0] !== undefined && fbData !== undefined) {
            firebase.addData(masteryData, fbData, region);
            fbData.summoners[region] = summonerId + threads;
            if (running && stacks < maxStacks) {
                scraperThread(summonerId+threads, region);
            }
        } else if (masteryData.length == 0) {
            fbData.summoners[region] = summonerId + threads;
            if (running && stacks < maxStacks) {
                scraperThread(summonerId+threads, region);
            }
        } else {
            if (running && stacks < maxStacks) {
                scraperThread(summonerId, region);
            }
        }
        if (!running) {
            console.log("Scraper for region " + region + " stopped.");
        }
        if (stacks > maxStacks - 1) {
            running = false;
            stacks = 0;
            setTimeout(function () {
                console.log("Saving the data of the last " + maxStacks + " analyzed summoners to the database.");
                firebase.firebase.set(fbData);
                startScraping();
            }, 10000);
        }
    });
}

function stopScraping(){
    running = false;
}

function scraper(summonerId, region) {
    for (var i = 0; i < threads; i++) {
        console.log(region + ": Started thread " + (i+1));
        scraperThread(summonerId+i, region);
    }
}

function isRunning(){
    return running;
}

firebase.firebase.once("value", function(data){
    fbData = data.val();
    fbLoaded = true;
});

module.exports = router;
module.exports.start = startScraping;
module.exports.stop = stopScraping;
module.exports.isRunning = isRunning;