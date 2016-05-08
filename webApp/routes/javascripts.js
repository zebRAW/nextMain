var express = require('express');
var router = express.Router();
var path = require('path');

/* GET home page. */
router.get('/:filename', function(req, res, next) {
  res.sendFile(path.join(__dirname + "/../public/javascripts/" +  req.params.filename));
});

module.exports = router;
