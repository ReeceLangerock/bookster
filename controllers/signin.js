//setup
var Auth0Strategy = require('passport-auth0');
var express = require('express');
var passport = require('passport');
var router = express.Router();
var config = require('../config');
var userModel = require('../models/userModel');
var session = require('express-session');
var passport = require('passport');
var ObjectID = require('mongodb').ObjectID;
router.use(session(config.getPassportSecret()));
router.use(passport.initialize());
router.use(passport.session());


//google strategy
passport.use(new Auth0Strategy({
        domain: 'librus.auth0.com',
        clientID: config.getAuth0ClientId(),
        clientSecret: config.getAuth0ClientSecret(),
        callbackURL: 'http://localhost:3000/auth/callback'
    },
    function(accessToken, refreshToken, extraParams, profile, done) {
        // accessToken is the token to call Auth0 API (not needed in the most cases)
        // extraParams.id_token has the JSON Web Token
        // profile has all the information from the user
        return done(null, profile);
    }
));

passport.serializeUser(function(user, callback) {
    callback(null, user);

});

passport.deserializeUser(function(user, callback) {
    var providerQuery = '';
    var dataToSave = {
        fbID: '',
        googleID: '',
        auth0ID: '',
        firstName: '',
        lastName: ''
    };

    switch (user.provider) {
        case 'facebook':
            providerQuery = 'fbID';
            dataToSave.firstName = user.name.givenName;
            dataToSave.lastName = user.name.familyName;
            dataToSave.fbID = user.identities[0].user_id;
            break;
        case 'google-oauth2':
            providerQuery = 'googleID';
            dataToSave.firstName = user.name.givenName;
            dataToSave.lastName = user.name.familyName;
            dataToSave.googleID = user.identities[0].user_id;
            break;
        case 'auth0':
            providerQuery = 'auth0ID';
            dataToSave.auth0ID = user.identities[0].user_id;
            break;
    }
    var name = providerQuery;
    var value = user.identities[0].user_id;
    var query = {};
    query[name] = value;
    userModel.findOne(
        query,
        function(err, doc) {
            if (doc) {
                user.mongoID = doc['_id'];
                callback(null, user);
            } else {
                var tempID = new ObjectID();
                user.mongoID = tempID;
                userModel.schema.methods.newUser(tempID, dataToSave);
                callback(null, user);
            }
        });
});


router.get('/login',
    passport.authenticate('auth0', {}),
    function(req, res) {
        res.redirect("/");
    });

router.get('/callback',
    passport.authenticate('auth0', {
        failureRedirect: '/login'
    }),
    function(req, res) {
        if (!req.user) {
            throw new Error('user null');
        }
        res.redirect("/");
    }
);


module.exports = router;
