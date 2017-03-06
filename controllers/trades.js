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
    })

});

router.post('/cancel', function(req, res) {
    removeRequest('requestsSent.requestID', 'requestsSent', req.body.requestID);
    removeRequest('requestsPending.requestID', 'requestsPending', req.body.requestID);

    res.send('cancel');
})

router.post('/decline', function(req, res) {
    console.log(req.body);
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

    Promise.all([acceptProm1,acceptProm2,swapProm1,swapProm2]).then(function(response, error){
      removeRequest('requestsSent.requestID', 'requestsSent', req.body.requestID);
      removeRequest('requestsPending.requestID', 'requestsPending', req.body.requestID);
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
                  console.log('failed')
                  reject('FAILED');
              } else if (doc) {
                console.log('swapped')
                  resolve("SWAPPED");
              } else {
                console.log('NOT_FOUND')
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
                  console.log('failed')
                  reject('FAILED');
              } else if (doc) {
                console.log('swapped')
                  resolve("SWAPPED");
              } else {
                console.log('NOT_FOUND')
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
module.exports = router;
