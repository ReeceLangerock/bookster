var express = require('express');
var router = express.Router();
var request = require('request');
var bodyParser = require('body-parser');
router.use(bodyParser.urlencoded({
    extended: true
}));
router.use(bodyParser.json());


router.get('/', function(req, res){
  if (req.isAuthenticated()) {
      res.render('user', {
          authenticatedUser: true,
          bookData: false
      });

  } else {
      res.render('user', {
          authenticatedUser: false,
          bookData: false
      });



  }
});

router.post('/', function(req, res){
  console.log(req.body);
  searchForBook(req.body.bookTitle).then(function(response, error){
    res.render('user',{
      authenticatedUser: true,
      bookData: response});

  })
})

function getUsersBooks(){

}

function searchForBook(bookTitle){
  console.log(bookTitle)
  var requestURL = `https://www.googleapis.com/books/v1/volumes?q=${bookTitle}`
  return new Promise(function(resolve, reject) {
      request(requestURL, function(err, res, body) {
          if (err) {
              console.log(err);
              reject(err);
          } else if (!err && res.statusCode == 200) {
              var info = JSON.parse(body)
              console.log(info.items[1].volumeInfo.title);
              resolve(info.items);
          } else if (res.statusCode == 404) {
              resolve('404');
          } else if (res.statusCode == 400) {
              resolve('400');
          }
      })
  });
}

module.exports = router;
