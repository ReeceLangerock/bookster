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
        var requestPendingBookToReceiveArray = [];
        var requestPendingBookToOfferArray = [];
        for (let i = 0; i < response.requestsSent.length; i++) {

            requestSentBookToOfferArray.push(response.requestsSent[i].bookToSend);
            requestSentBookToReceiveArray.push(response.requestsSent[i].bookToReceive);
        }

        for (let i = 0; i < response.requestsPending.length; i++) {

            requestPendingBookToOfferArray.push(response.requestsPending[i].bookToSend);
            requestPendingBookToReceiveArray.push(response.requestsPending[i].bookToReceive);
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
                    requestPendingBooksOffered: responses[2],
                    requestPendingBooksReceiving: responses[3],
                    userID: req.user.mongoID
                });

            } else {
                res.send('error');
            }
        })



    })



});

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
