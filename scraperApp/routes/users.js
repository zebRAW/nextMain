var express = require('express');
var requests = require('../scraper/requests.js');
var firebase = require('../scraper/firebase.js');
var router = express.Router();
var fbData;


/* GET users listing. */
router.get('/:summoner', function(req, res, next) {
    requests.getMasteryDataForSummonerName(req.params.summoner, function(masteryData){
        if (masteryData !== undefined && fbData !== undefined) {
            firebase.addData(masteryData, fbData);
            res.send(masteryData);
        }else{
            res.send("Mastery Data not defined!");
        }
    });
});

firebase.firebase.on("value", function(data){
    fbData = data.val();
});

module.exports = router;
