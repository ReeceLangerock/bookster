const mongoose = require('mongoose');
var ObjectID = require('mongodb').ObjectID;

var userSchema = mongoose.Schema({
    '_id': String,
    'firstName': String,
    'lastName': String,
    'fbID': String,
    'googleID': String,
    'auth0ID': String,
    'City': String,
    'State': String,
    'books': [String],
    'requestsSent': [{
      'requestID': String,
      'bookToSend': String,
      'bookToReceive': String,
      'bookOwnerID': String,
      '_id' : false
    }],
    'requestsPending': [{
      'requestID': String,
      'bookToSend': String,
      'bookToReceive': String,
      'bookOwnerID': String,
      '_id' : false
    }]

});

userSchema.methods.newUser = function(id, data){
  var newUser = new userModel({
    '_id': id,
    'firstName': data.firstName,
    'lastName': data.lastName,
    'fbID': data.fbID,
    'googleID': data.googleID,
    'auth0ID': data.auth0ID,
    'City': '',
    'State': '',
    'books': [],
    'requestsSent': [],
    'requestsPending': []
  });

  newUser.save(function(err){
    if(err){
      throw err;
    }
    else{
      return 'success';
    }
  })
}



var userModel = mongoose.model('user', userSchema, 'users');
module.exports = userModel;
