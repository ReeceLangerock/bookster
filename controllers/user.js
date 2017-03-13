//setup
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
        //get the user data and their book data
        var userDataProm = getUser(req.user.mongoID);
        var userBooksProm = getUsersBooks(req.user.mongoID);


        Promise.all([userDataProm, userBooksProm]).then(function(responses, error) {
            var userData = responses[0];
            var userBooks = responses[1];
            res.render('user', {
                authenticatedUser: true,
                bookData: false,
                userBooks: userBooks,
                userData: userData
            });
        });
    } else {
        res.render('user', {
            authenticatedUser: false,
            bookData: false,
            userBooks: false,
            userData: userData
        });



    }
});

router.post('/', function(req, res) {
    searchForBook(req.body.bookTitle).then(function(response, error) {

        res.json(response);
        res.end();

    })
})

router.post('/add-book', function(req, res) {
    addBook(req.body, req.user.mongoID).then(function(response, error) {
        if (response == 'ALREADY_OWNED') {
          req.flash('error', 'Book not added, you already own it!.\nClick anywhere to close.')
          res.redirect('back');
        } else if (response == 'BOOK_CREATED') {
          req.flash('success', 'Book added to your collection!\nClick anywhere to close.');
          res.redirect('back');
        } else if (response == 'BOOK_ADDED') {
          req.flash('success', 'Book added to your collection!!\nClick anywhere to close.');
          res.redirect('back');
        }
    })
})


function getUsersBooks(userID) {
    return new Promise(function(resolve, reject) {
        bookModel.find({
            ownedBy: [userID]
        }, function(err, doc) {
            if (err) {
                reject(err);
            } else {
                resolve(doc);
            }
        });

    });
}

function getUser(userID) {
    return new Promise(function(resolve, reject) {
        userModel.findOne({
            _id: userID
        }, function(err, doc) {
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
        // search the book collection by book isbn
        bookModel.findOne({
                isbn13: bookToAdd.bookID
            },
            function(err, doc) {
                if (err) {
                    reject(err);
                } else if (doc) {
                    // if the user doesn't own the book
                    if (doc.ownedBy.includes(userID) == false) {
                        bookModel.findOneAndUpdate({
                            isbn13: bookToAdd.bookID
                        }, {
                            $set: {
                                ownedBy: userID
                            }
                        }, function(err) {
                            if (err) {
                                console.log(err);
                            }
                        });
                        //update the users books
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
                    // create a new book
                    var tempID = new ObjectID();
                    bookModel.schema.methods.newBook(tempID, bookToAdd, userID);
                    //add the book to the user
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
