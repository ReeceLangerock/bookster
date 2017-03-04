var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var user = require('../models/userModel');
var bookModel = require('../models/bookModel');
var bodyParser = require('body-parser');
router.use(bodyParser.urlencoded({
    extended: true
}));
router.use(bodyParser.json());

router.get('/', function(req, res) {
    getAllBooks().then(function(response, error) {


            if (req.isAuthenticated()) {
                res.render('index', {
                    authenticatedUser: true,
                    books: response,
                    userID : req.user.mongoID
                });

            } else {
                res.render('index', {
                    authenticatedUser: false,
                    books: response,
                    userID: false
                });
            }

    });
});

router.post('/send-request', function(req, res){
  console.log(req.body);
});


function getAllBooks() {
    return new Promise(function(resolve, reject) {
            bookModel.find({}
                ,
                function(err, doc) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(doc);
                    }
                });

    });
}



module.exports = router;
