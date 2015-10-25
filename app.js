var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes/index');
var users = require('./routes/users');

var app = express();
var server = require('./bin/www')
var io = require('socket.io')(server)
var mongo = require('mongodb').MongoClient;
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/users', users);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});
var data = 'mongodb://127.0.0.1/chatters'
//log connections and disconnects
io.on('connection', function(socket) {
  console.log('a user connected');
  socket.on('disconnect', function() {
    console.log('user disconnected');
  });
  socket.on('chat', function(msg) {
    socket.broadcast.emit('chat', msg);
    mongo.connect(process.env.MONGOLAB_URI, function(err, db) {
      var collection = db.collection('chat messages');
      collection.insert({ content: msg }, function(err, o) {
        if (err) {console.warn(err.message); }
        else {console.log('chatt message inserted into db: ' + msg);}
      });
    });
    mongo.connect(process.env.MONGOLAB_URI, function(err, db) {
      var collection = db.collection('chat messages')
      var stream = collection.find().sort({ _id : -1 }).limit(10).stream();
      stream.on('data', function(chat) {socket.emit('chat', chat.content)})
    })
  });
});

//stream last 1o messages
// mongo.connect(process.env.data, function(err, db) {
//   var collection = db.collection('chat messages')
//   var stream = collection.find().sort({ _id : -1 }).limit(10).stream();
//   stream.on('data', function(chat) {socket.emit('chat', chat.content)})
// })

module.exports = app;
