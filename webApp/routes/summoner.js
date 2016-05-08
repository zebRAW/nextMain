var express = require('express');
var router = express.Router();
var requests = require('../api-request/masteryRequest.js');
var path = require("path");

/* GET masterydata for summoner. */
router.get('/:region/:summoner', function(req, res, next) {
    var summoner = req.params.summoner;
    var region = req.params.region;
    if (typeof summoner === "number"){
        requests.getMasteryDataForId(summoner, region, function(data){
            res.send(data);
        });
    }else if (typeof summoner === "string"){
        requests.getMasteryDataForSummonerName(summoner, region, function(data){
            res.send(data);
        });
    }
});

router.get('/', function(req,res,next){
    res.redirect('../');
});

module.exports = router;