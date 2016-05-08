var express = require('express');
var router = express.Router();
var scraper = require('../scraper/scraper');

/* GET home page. */
router.get('/:start', function(req, res, next) {
    if (req.params.start === "start"){
        scraper.start();
        res.redirect("/scraper");
    }else if(req.params.start === "stop"){
        scraper.stop();
        res.redirect("/scraper");
    }
});

router.get("/", function(req, res, next){
    if (scraper.isRunning()) {
        res.render('scraper', {title: 'Champion Mastery Scraper v0.1 ', running: 'running'});
    }else{
        res.render('scraper', {title: 'Champion Mastery Scraper v0.1 ', running: 'not running'});
    }
});

module.exports = router;
