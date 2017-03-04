var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var ObjectID = require('mongodb').ObjectID;
var userModel = require('../models/userModel');
var bookModel = require('../models/bookModel');
var bodyParser = require('body-parser');
router.use(bodyParser.urlencoded({
    extended: true
}));
router.use(bodyParser.json());

router.get('/', function(req, res) {
    if (req.isAuthenticated()) {
        var userBooksProm = getUserBooks(req.user.mongoID);
    } else {
        var userBooksProm = Promise.resolve(null);
    }
    var allBooksProm = getAllBooks();



    Promise.all([userBooksProm, allBooksProm]).then(function(responses, error) {
        userBooks = responses[0];
        allBooks = responses[1];

        if (req.isAuthenticated()) {
            res.render('index', {
                authenticatedUser: true,
                books: allBooks,
                userBooks: userBooks,
                userID: req.user.mongoID
            });

        } else {
            res.render('index', {
                authenticatedUser: false,
                books: allBooks,
                userBooks: false,
                userID: false
            });
        }
    })

});

router.post('/send-request', function(req, res) {
    var bookToSendID = req.body.bookToSendID
    var bookToReceiveID = req.body.bookToReceiveID;
    var bookOwnerID = req.body.bookOwnerID;
    console.log(bookOwnerID);
    console.log(req.user.mongoID);
    var addRequestToSelfProm = addRequestToSelf(req.user.mongoID, bookToSendID, bookToReceiveID, bookOwnerID);
    var sendRequestToOtherUserProm = sendRequestToOtherUser(req.user.mongoID, bookToSendID, bookToReceiveID, bookOwnerID);
    Promise.all([addRequestToSelfProm, sendRequestToOtherUserProm]).then(function(responses, error) {
        if (responses[0] == "FAILED" || responses[1] == "FAILED") {
            res.send("failure")
        } else {
            res.send("Request Send");
            res.end();
        }
    })

});

function addRequestToSelf(id, bookToSendID, bookToReceiveID, bookOwnerID) {
    return new Promise(function(resolve, reject) {
        userModel.findOneAndUpdate({
                _id: id
            }, {
                $push: {
                    requestsSent: {
                        'requestID': new ObjectID(),
                        'bookToSend': bookToSendID,
                        'bookToReceive': bookToReceiveID,
                        'bookOwnerID': bookOwnerID
                    }
                }
            },
            function(err, doc) {
                if (err) {
                    reject('FAILED');
                } else {
                    resolve("SUCCESS");
                }
            });
    })
}

function sendRequestToOtherUser(id, bookToSendID, bookToReceiveID, bookOwnerID) {
    return new Promise(function(resolve, reject) {
        userModel.findOneAndUpdate({
                _id: bookOwnerID
            }, {
                $push: {
                    requestsPending: {
                        'requestID': new ObjectID(),
                        'bookToSend': bookToReceiveID, // these are flipped from requestPending
                        'bookToReceive': bookToSendID, // these are flipped from requestPending
                        'bookOwnerID': id
                    }
                }
            },
            function(err, doc) {
                if (err) {
                    reject('FAILED');
                } else {
                    resolve("SUCCESS");
                }
            });
    })
}


function getAllBooks() {
    return new Promise(function(resolve, reject) {
        bookModel.find({},
            function(err, doc) {
                if (err) {
                    reject(err);
                } else {
                    resolve(doc);
                }
            });

    });
}

function getUserBooks(userID) {
    return new Promise(function(resolve, reject) {
        bookModel.find({
            ownedBy: [userID]
        }, function(err, doc) {
            if (err) {
                reject(err);
            } else {
                console.log(doc);
                resolve(doc);
            }
        });

    });
}



module.exports = router;
