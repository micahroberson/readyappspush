
var express = require('express')
, app = express()
, socket = require('socket.io')
, http = require('http')
, _ = require('underscore')._;

var allowCrossDomain = function(req, res, next) {
  // Added other domains you want the server to give access to
  // WARNING - Be careful with what origins you give access to
  var allowedHost = [
    'http://localhost',
    'http://http://readyappspush.herokuapp.com/',
    'http://http://shielded-mesa-5845.herokuapp.com/'
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
  else if(req.body.from !== undefined){
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
  else {
    console.log('Broadcasting to all users');
    io.sockets.emit(req.body.action, JSON.parse(req.body.item));
    res.send(200);
  }
});

io.sockets.on('connection', function (socket) {
  var id;
  socket.on('initialize', function(data){
    id = data.id;
    connections[data.id] = socket;
    console.log('Total Connections: ', Object.keys(connections).length);
  });

  socket.on('activity_created', function(activity){
    socket.broadcast.emit('new_activity', activity);
  });

  socket.on('task_created', function(task){
    socket.broadcast.emit('new_task', task);
  });

  socket.on('project_created', function(project){
    socket.broadcast.emit('new_project', project);
  });

  socket.on('shopdrawing_created', function(shopdrawing){
    socket.broadcast.emit('new_shopdrawing', shopdrawing);
  });

  socket.on('quote_created', function(shopdrawing){
    socket.broadcast.emit('new_quote', shopdrawing);
  });

  socket.on('disconnect', function(){
    if(socket){
      delete connections[id];
    }
  });

});