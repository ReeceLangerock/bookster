//SETUP
var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var userModel = require('../models/userModel');
var bodyParser = require('body-parser');

router.use(bodyParser.urlencoded({
    extended: true
}));
router.use(bodyParser.json());


router.get('/', function(req, res) {

    //if user is singed in
    if (req.isAuthenticated()) {
        getUserData(req.user.mongoID).then(function(response, error) {
            res.render('user-settings', {
                authenticatedUser: true,
                userData: response
            });
        })
    } else {
        res.render('user-settings', {
            authenticatedUser: false,
        });


    }
});

router.post('/', function(req, res){
  //accept post for user data and update db
  updateUserDate(req.user.mongoID, req.body).then(function(response,error){
    if(response == "SETTINGS_UPDATED" ){
      req.flash('success', 'Your settings have been updated.\nClick anywhere to close.')
      res.redirect('back');
    }
      else{
        req.flash('error', "Something went wrong. Your setting weren't updated.\nClick anywhere to close.")
        res.redirect('back');
      }

  })
})



function updateUserDate(user, data){
  return new Promise(function(resolve, reject) {
    //find the user and update
    userModel.findOneAndUpdate({ _id: user},
         {$set:   {firstName: data.firstName,
        lastName: data.lastName,
        City: data.city,
        State: data.state}},
        function(err, doc) {
            if (err) {
                throw err;
            }
            if (doc) {
                resolve("SETTINGS_UPDATED");
            } else {
                reject("NOT_FOUND");
            }
        });
  });
}


function getUserData(user) {
    return new Promise(function(resolve, reject) {
        userModel.findOne(
            { _id: user},
            function(err, doc) {
                if (err) {
                    throw err;
                }
                if (doc) {
                    resolve(doc);
                } else {
                    reject("NOT_FOUND");
                }
            });
    });
}



module.exports = router;
