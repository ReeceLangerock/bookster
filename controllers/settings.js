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

    if (req.isAuthenticated()) {
        getUserData(req.user).then(function(response, error) {
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
  console.log(req.body);
  updateUserDate(req.user, req.body).then(function(req,res){
    res.send('saved');
    res.end();
  })
})

function getQueryFromReqUser(user){
  var providerQuery = '';
  switch (user.provider) {
      case 'facebook':
          providerQuery = 'fbID';
          break;
      case 'google-oauth2':
          providerQuery = 'googleID';
          break;
      case 'auth0':
          providerQuery = 'auth0ID';
          break;
  }
  var name = providerQuery;
  var value = user.identities[0].user_id;
  var query = {};
  query[name] = value;

  return query;
}

function updateUserDate(user, data){

  return new Promise(function(resolve, reject) {
    query = getQueryFromReqUser(user);
    userModel.findOneAndUpdate(
        query, {$set:   {firstName: data.firstName,
        lastName: data.lastName,
        City: data.city,
        State: data.state}},
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


function getUserData(user) {
    return new Promise(function(resolve, reject) {
        query = getQueryFromReqUser(user);
        userModel.findOne(
            query,
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
