//SETUP ROUTER
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
    // Check if user is signed in, and if so get their books (needed for showing request button)
    if (req.isAuthenticated()) {
        var userBooksProm = getUserBooks(req.user.mongoID);
    } else {
        var userBooksProm = Promise.resolve(null);
    }
    // get all the books
    var allBooksProm = getAllBooks();


    Promise.all([userBooksProm, allBooksProm]).then(function(responses, error) {
        userBooks = responses[0];
        allBooks = responses[1];

        // send the user books along with all of the rest
        if (req.isAuthenticated()) {
            res.render('index', {
                authenticatedUser: true,
                books: allBooks,
                userBooks: userBooks,
                userID: req.user.mongoID
            });

        } else {
            // just send all the books
            res.render('index', {
                authenticatedUser: false,
                books: allBooks,
                userBooks: false,
                userID: false
            });
        }
    })
});

// handle sending of trade requests
router.post('/send-request', function(req, res) {

    var bookToSendID = req.body.bookToSendID
    var bookToReceiveID = req.body.bookToReceiveID;
    var bookOwnerID = req.body.bookOwnerID;

    // check if the user has already sent a trade offer for the selected book
    var pendingRequestProm = checkForRequest("requestsPending.bookToReceive", req.user.mongoID, bookToReceiveID);
    var pendingSendProm = checkForRequest("requestsPending.bookToSend", req.user.mongoID, bookToSendID);
    var sentRequestProm = checkForRequest("requestsSent.bookToReceive", req.user.mongoID, bookToReceiveID);
    var sentSendProm = checkForRequest("requestsSent.bookToSend", req.user.mongoID, bookToSendID);
    Promise.all([pendingRequestProm, pendingSendProm, sentRequestProm, sentSendProm]).then(function(responses, error) {
        if (responses[0] == "GOOD_TO_GO" && responses[1] == "GOOD_TO_GO" && responses[2] == "GOOD_TO_GO" && responses[3] == "GOOD_TO_GO") {
            //if the response wasn't found add a sent to request to current user and pending request to other user
            var requestID = new ObjectID();
            var addRequestToSelfProm = addRequestToSelf(req.user.mongoID, bookToSendID, bookToReceiveID, bookOwnerID, requestID);
            var sendRequestToOtherUserProm = sendRequestToOtherUser(req.user.mongoID, bookToSendID, bookToReceiveID, bookOwnerID, requestID);

            Promise.all([addRequestToSelfProm, sendRequestToOtherUserProm]).then(function(responses, error) {
                //if either update failed, send errr
                if (responses[0] == "FAILED" || responses[1] == "FAILED") {
                    req.flash('error', 'Request failed to send.\nClick anywhere to close.')
                    res.redirect('back');
                } else { // otherwise send successful send
                    req.flash('success', 'Request Sent!\nClick anywhere to close.');
                    res.redirect('back');
                }
            })
            // if the request was found(already been sent) let user know
        } else {

            var bookError = [];
            for(let i =0; i < responses.length; i++){
              console.log(responses);
              if (responses[i][0] == "ALREADY_REQUESTED"){
                bookError.push(responses[i][1].title);
              }
            }
            bookError.join(', ');
            req.flash('error', `A request for the selected book is already pending.\nClick anywhere to close.`)
            res.redirect('back');
        }
    });

});

// check for the request in the users sent request array
function checkForRequest(sentOrPending, id, bookToReceiveID) {
    return new Promise(function(resolve, reject) {
        userModel.findOne({
                _id: id,
                [sentOrPending]: [
                    bookToReceiveID
                ]
            },
            function(err, doc) {
                if (err) {
                    console.log(err)
                    reject('FAILED');
                } else if (doc) {
                    resolve("ALREADY_REQUESTED");
                } else {
                    resolve("GOOD_TO_GO");
                }
            })
    });
}

function addRequestToSelf(id, bookToSendID, bookToReceiveID, bookOwnerID, requestID) {
    return new Promise(function(resolve, reject) {
        userModel.findOneAndUpdate({
                _id: id
            }, {
                $push: { // push trade data into current user userModel
                    requestsSent: {
                        'requestID': requestID,
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

function sendRequestToOtherUser(id, bookToSendID, bookToReceiveID, bookOwnerID, requestID) {
    return new Promise(function(resolve, reject) {
        userModel.findOneAndUpdate({
                _id: bookOwnerID
            }, {
                $push: {
                    requestsPending: { //push trade data into other users userModel
                        'requestID': requestID,
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
        bookModel.find({}).sort({_id:-1}).exec(
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
                resolve(doc);
            }
        });

    });
}

module.exports = router;
