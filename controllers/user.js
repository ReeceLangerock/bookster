var express = require('express');
var router = express.Router();
var request = require('request');
var bookModel = require('../models/bookModel');
var userModel = require('../models/userModel');
var bodyParser = require('body-parser');
var ObjectID = require('mongodb').ObjectID;

router.use(bodyParser.urlencoded({
    extended: true
}));
router.use(bodyParser.json());


router.get('/', function(req, res) {
    if (req.isAuthenticated()) {
      var userData;
        getUser(req.user.mongoID).then(function(response, error) {
          userData = response;
        }).then(
        getUsersBooks(req.user.mongoID).then(function(response, error) {
            res.render('user', {
                authenticatedUser: true,
                bookData: false,
                userBooks: response,
                userData: userData
            });
        }));
    } else {
        res.render('user', {
            authenticatedUser: false,
            bookData: false,
            userBooks: false
        });



    }
});

router.post('/', function(req, res) {
    searchForBook(req.body.bookTitle).then(function(response, error) {

        res.render('user', {
            authenticatedUser: true,
            bookData: response,
            userBooks: false
        });

    })
})

router.post('/add-book', function(req, res) {
    addBook(req.body, req.user.mongoID).then(function(response, error) {
        if (response == 'ALREADY_OWNED') {

        } else if (response == 'BOOK_CREATED') {

        } else if (response == 'BOOK_ADDED') {

        }
    })
})

router.post('/delete-book', function(req, res) {
    deleteBook(req.body, req.user.mongoID).then(function(response, error) {
        if (response == 'ALREADY_OWNED') {

        } else if (response == 'BOOK_CREATED') {

        } else if (response == 'BOOK_ADDED') {

        }
    })
})

function getUsersBooks(userID) {
    return new Promise(function(resolve, reject) {
            bookModel.find({ownedBy: [userID]}, function(err, doc) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(doc);
                    }
                });

            });
    }

    function getUser(userID){
      return new Promise(function(resolve, reject) {
              userModel.findOne({_id: userID}, function(err, doc) {
                      if (err) {
                          reject(err);
                      } else {
                          resolve(doc);
                      }
                  });

              });
    }


    function addBook(bookToAdd, userID) {
        return new Promise(function(resolve, reject) {
            bookModel.findOne({
                    isbn13: bookToAdd.bookID
                },
                function(err, doc) {
                    if (err) {
                        reject(err);
                    } else if (doc) {
                        if (doc.ownedBy.includes(userID) == false) {
                            bookModel.findOneAndUpdate({
                                isbn13: bookToAdd.bookID
                            }, {
                                $push: {
                                    ownedBy: userID
                                }
                            }, function(err) {
                                if (err) {
                                    console.log(err);
                                }
                            });

                            userModel.findOneAndUpdate({
                                '_id': userID
                            }, {
                                $push: {
                                    books: doc['_id']
                                }
                            }, function(err) {
                                if (err) {
                                    console.log(err);
                                }
                            });
                            resolve("BOOK_ADDED");
                        } else {
                            resolve("ALREADY_OWNED")
                        }
                    } else {
                        var tempID = new ObjectID();
                        bookModel.schema.methods.newBook(tempID, bookToAdd, userID);
                        userModel.findOneAndUpdate({
                            '_id': userID
                        }, {
                            $push: {
                                books: tempID
                            }
                        }, function(err) {
                            if (err) {
                                console.log(err);
                            }
                        });
                        resolve("BOOK_CREATED");
                    }
                });
        })
    }

    function searchForBook(bookTitle) {
        var requestURL = `https://www.googleapis.com/books/v1/volumes?q=${bookTitle}`
        return new Promise(function(resolve, reject) {
            request(requestURL, function(err, res, body) {
                if (err) {
                    console.log(err);
                    reject(err);
                } else if (!err && res.statusCode == 200) {
                    var info = JSON.parse(body);
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
