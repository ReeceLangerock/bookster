var express = require('express');
var router = express.Router();
var request = require('request');


router.get('/', function(req, res){
  if (req.isAuthenticated()) {
      res.render('user', {
          authenticatedUser: true,
      });

  } else {
      res.render('user', {
          authenticatedUser: false,
      });



  }
});

router.post('/', function(req, res){
  searchForBook(true).then(function(response, error){
    res.send(response);
    res.end();
  })
})

function searchForBook(bookTitle){
  //var apiKey = process.env.QUANDL_API_KEY;// || config.getQuandlAPIKey();
  var requestURL = `https://www.googleapis.com/books/v1/volumes?q=harry+potter`
  return new Promise(function(resolve, reject) {
      request(requestURL, function(err, res, body) {
          if (err) {
              console.log(err);
              reject(err);
          } else if (!err && res.statusCode == 200) {
              var info = JSON.parse(body)
              console.log(info.items[1].volumeInfo.title);
              resolve(body);
          } else if (res.statusCode == 404) {
              resolve('404');
          } else if (res.statusCode == 400) {
              resolve('400');
          }
      })
  });
}

module.exports = router;
