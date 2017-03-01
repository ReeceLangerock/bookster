//SETUP
var express = require('express');
var mongoose = require('mongoose');
var path = require('path');
var port = process.env.PORT || 3000;
var app = express();
var config = require('./config');
var passport = require('passport');

mongoose.connect('mongodb://'+config.getMongoUser()+':'+config.getMongoPass()+'@ds111940.mlab.com:11940/bookster');
//below mongoose.connect saved for when moving to heroku
//mongoose.connect(`mongodb://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@ds111940.mlab.com:11940/bookster`);
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection eror:'));
db.once('open', function(){
  console.log("connected");
})

//EXPRESS SETUP
app.set('views', path.join(__dirname, '/views'));
app.use(express.static(path.join(__dirname, 'views')));
app.set('view engine', 'ejs');


//ROUTES
app.use('/', require('./controllers/index'));
app.use('/user', require('./controllers/user'));
app.use('/auth', require('./controllers/signin'));
app.use(function (req, res, next) {
  res.status(404).render('404');
})

//passport setup
//app.use(session(process.env.passportSecret));
app.use(passport.initialize());
app.use(passport.session());
app.use(function(req, res, next) {
  res.locals.currentUser = req.user;
  next();
});

//launch
app.listen(port, function(){
  console.log(`Bookster listening on port ${port}!`);
})
