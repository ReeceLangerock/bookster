var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var user2 = require('../models/userModel');

router.get('/', function(req, res) {

    if (req.isAuthenticated()) {
        res.render('index', {
            authenticatedUser: true,
        });

    } else {
        res.render('index', {
            authenticatedUser: false,
        });



    }
});


function getAllBooks() {

}



module.exports = router;
