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

    getUser(req.user.mongoID).then(function(response, error) {
        var requestSentBookToOfferArray = [];
        var requestSentBookToReceiveArray = [];
        var requestSentIdArray = [];
        var requestPendingBookToReceiveArray = [];
        var requestPendingBookToOfferArray = [];
        var requestPendingArray = [];

        for (let i = 0; i < response.requestsSent.length; i++) {

            requestSentBookToOfferArray.push(response.requestsSent[i].bookToSend);
            requestSentBookToReceiveArray.push(response.requestsSent[i].bookToReceive);
            requestSentIdArray.push(response.requestsSent[i].requestID);
        }

        for (let i = 0; i < response.requestsPending.length; i++) {

            requestPendingBookToOfferArray.push(response.requestsPending[i].bookToSend);
            requestPendingBookToReceiveArray.push(response.requestsPending[i].bookToReceive);
            requestPendingArray.push(response.requestsPending[i]);
        }

        requestSentBooksOfferedProm = getRequestedBooks(requestSentBookToOfferArray);
        requestSentBooksReceivingProm = getRequestedBooks(requestSentBookToReceiveArray);

        requestPendingBooksOfferedProm = getRequestedBooks(requestPendingBookToOfferArray);
        requestPendingBooksReceivingProm = getRequestedBooks(requestPendingBookToReceiveArray);

        Promise.all([requestSentBooksOfferedProm, requestSentBooksReceivingProm, requestPendingBooksOfferedProm, requestPendingBooksReceivingProm]).then(function(responses, error) {
            if (req.isAuthenticated()) {
                res.render('trades', {
                    authenticatedUser: true,
                    requestSentBooksOffered: responses[0],
                    requestSentBooksReceiving: responses[1],
                    requestSentId: requestSentIdArray,
                    requestPendingBooksOffered: responses[2],
                    requestPendingBooksReceiving: responses[3],
                    requestPendingArray: requestPendingArray,
                    userID: req.user.mongoID
                });

            } else {
                res.send('error');
            }
        })


    });

    router.post('/cancel', function(req, res) {
        var removeProm1 = removeRequest('requestsSent.requestID', 'requestsSent', req.body.requestID);
        var removeProm2 = removeRequest('requestsPending.requestID', 'requestsPending', req.body.requestID);
        Promise.all([removeProm1, removeProm2]).then(function(responses, error) {
            if (responses[0] == "REMOVED" && responses[1] == "REMOVED") {
                req.flash('success', 'Trade Cancelled!!!.\nClick anywhere to close.')
                res.redirect('back');
            } else { // otherwise send successful send
                req.flash('error', 'The trade was not cancelled successfully. Please try again.\nClick anywhere to close.');
                res.redirect('back');
            }
        });
    });

    router.post('/decline', function(req, res) {

    })

    router.post('/accept', function(req, res) {
        var bookToReceive = req.body.bookToReceive;
        var bookToSend = req.body.bookToSend;
        var otherUsersID = req.body.otherUserID;
        var requestID = req.body.requestID;
        var acceptProm1 = acceptRequest(req.user.mongoID, bookToSend, bookToReceive);
        var acceptProm2 = acceptRequest(otherUsersID, bookToReceive, bookToSend);

        var swapProm1 = swapBookOwnership(bookToSend, otherUsersID);
        var swapProm2 = swapBookOwnership(bookToReceive, req.user.mongoID);

        Promise.all([acceptProm1, acceptProm2, swapProm1, swapProm2]).then(function(response, error) {
            var removeProm1 = removeRequest('requestsSent.requestID', 'requestsSent', req.body.requestID);
            var removeProm2 = removeRequest('requestsPending.requestID', 'requestsPending', req.body.requestID);

            Promise.all([removeProm1, removeProm2]).then(function(responses, error) {
                if (responses[0] == "REMOVED" && responses[1] == "REMOVED") {
                    req.flash('success', 'Trade accepted!!!.\nClick anywhere to close.')
                    res.redirect('back');
                } else { // otherwise send successful send
                    req.flash('error', 'The trade was not processed successfully. Please try again.\nClick anywhere to close.');
                    res.redirect('back');
                }
            })
        })

    })

})

function acceptRequest(userID, bookToSend, bookToReceive) {
    return new Promise(function(resolve, reject) {
        userModel.findOneAndUpdate({
                _id: userID
            }, {
                $pull: {
                    books: bookToSend
                }
            }, {
                $push: {
                    books: bookToReceive
                }
            },
            function(err, doc) {
                if (err) {
                    console.log(err)
                    reject('FAILED');
                } else if (doc) {
                    resolve("SWAPPED");
                } else {
                    resolve("NOT_FOUND");
                }
            })
    });
}

function swapBookOwnership(bookID, newOwner) {
    return new Promise(function(resolve, reject) {
        bookModel.findOneAndUpdate({
                _id: bookID
            }, {
                $set: {
                    ownedBy: newOwner
                }
            },
            function(err, doc) {
                if (err) {
                    console.log(err)
                    reject('FAILED');
                } else if (doc) {
                    resolve("SWAPPED");
                } else {
                    resolve("NOT_FOUND");
                }
            })
    });
}



function removeRequest(sentOrPendingID, sentOrPending, requestID) {
    return new Promise(function(resolve, reject) {
        userModel.findOneAndUpdate({
                [sentOrPendingID]: [requestID]
            }, {
                $pull: {
                    [sentOrPending]: {
                        requestID: requestID
                    }
                }
            },
            function(err, doc) {
                if (err) {
                    console.log(err)
                    reject('FAILED');
                } else if (doc) {
                    console.log(doc)
                    resolve("REMOVED");
                } else {
                    resolve("NOT_FOUND");
                }
            })
    });
}



function getRequestedBooks(bookID) {
    return new Promise(function(resolve, reject) {
        bookModel.find({
            _id: {
                $in: bookID
            }
        }, function(err, doc) {
            if (err) {
                reject(err);
            } else {
                var objects = {};
                doc.forEach(o => objects[o._id] = o);
                var dupArray = bookID.map(id => objects[id]);
                // here you have objects with duplicates in dupArray:
                console.log(dupArray);
                resolve(dupArray);
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
module.exports = router;
