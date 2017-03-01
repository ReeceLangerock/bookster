//setup
var Auth0Strategy = require('passport-auth0');
var express = require('express');
var passport = require('passport');
var router = express.Router();
var config = require('../config');
router.use(passport.initialize());
router.use(passport.session());


//google strategy
passport.use(new Auth0Strategy({
        domain: 'librus.auth0.com',
        clientID: config.getAuth0ClientId(),
        clientSecret: config.getAuth0ClientSecret(),
        callbackURL: 'http://localhost:3000/callback'
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
    callback(null, user);
});

router.get('/login',
    function(req, res) {
        console.log('login');
        res.render('login', {
            env: process.env
        });
    });

router.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
});

router.get('/callback',
    passport.authenticate('auth0', {
        failureRedirect: '/url-if-something-fails'
    }),
    function(req, res) {
        res.redirect(req.session.returnTo || '/user');
    });


module.exports = router;
