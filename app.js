//SETUP
var express = require('express');
var mongoose = require('mongoose');
var path = require('path');
var port = process.env.PORT || 3000;
var app = express();
var passport = require('passport');
var flash = require("connect-flash");
var session = require('express-session');


//mongoose.connect('mongodb://'+config.getMongoUser()+':'+config.getMongoPass()+'@ds111940.mlab.com:11940/bookster');
//below mongoose.connect saved for when moving to heroku
mongoose.connect(`mongodb://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@ds111940.mlab.com:11940/bookster`);
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection eror:'));
db.once('open', function(){
  console.log("connected");
})

//EXPRESS SETUP
app.set('views', path.join(__dirname, '/views'));
app.use(express.static(path.join(__dirname, 'views')));
app.set('view engine', 'ejs');


//passport setup
app.use(session({secret: process.env.PASSPORT_SECRET}));
app.use(passport.initialize());
app.use(passport.session());

app.use(flash());
app.use(function(req, res, next){
   res.locals.error = req.flash("error");
   res.locals.success = req.flash("success");
   next();
});
//ROUTES
app.use('/', require('./controllers/index'));
app.use('/user/settings', require('./controllers/settings'));
app.use('/user', require('./controllers/user'));
app.use('/trades', require('./controllers/trades'));
app.use('/auth', require('./controllers/signin'));
app.use('/logout', require('./controllers/logout'));
app.use(function (req, res, next) {
  res.status(404).render('404');
})



//launch
app.listen(port, function(){
  console.log(`Bookster listening on port ${port}!`);
})
