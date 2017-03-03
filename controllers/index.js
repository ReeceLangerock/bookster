var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var user = require('../models/userModel');
var bookModel = require('../models/bookModel');

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
