
var express = require('express')
, app = express()
, socket = require('socket.io')
, http = require('http')
, _ = require('underscore')._;

var allowCrossDomain = function(req, res, next) {
  // Added other domains you want the server to give access to
  // WARNING - Be careful with what origins you give access to
  var allowedHost = [
    'http://localhost'
  ];

  if(allowedHost.indexOf(req.headers.origin) !== -1) {
    res.header('Access-Control-Allow-Credentials', true);
    res.header('Access-Control-Allow-Origin', req.headers.origin)
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
    next();
  } else {
    res.send(404);
  }
};

app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(allowCrossDomain);

var port = process.env.PORT || 5000;
var server = http.createServer(app).listen(port, function() {
  console.log("Express server listening on port %d in %s mode", port, app.settings.env);
});
var io = socket.listen(server);

io.configure(function(){
  io.set("transports", ["xhr-polling"]); 
  io.set("polling duration", 10); 
  io.set("close timeout", 10);
  io.set("log level", 1);
  io.set("origins = *");
})

var connections = {};

app.post('/activity', function(req, res){
  if(req.body.to !== undefined) {
    var target = connections[req.body.to];
    if(target) {
      target.emit(req.body.action, JSON.parse(req.body.item));
      res.send(200);
    }
    else
      res.send(404);
  }
  else {
    // Broadcast
    var target = connections[req.body.from];
    if(target) {
      target.broadcast.emit(req.body.action, JSON.parse(req.body.item));
      res.send(200);
    }
    else {
      res.send(404);
    }
  }
});

io.sockets.on('connection', function (socket) {
  
  socket.on('initialize', function(data){
    connections[data.id] = socket;
    console.log('New connection: ', data.id);
  });

  socket.on('activity_created', function(activity){
    socket.broadcast.emit('new_activity', activity);
  });

  socket.on('task_created', function(task){
    socket.broadcast.emit('new_task', task);
  });

});