/*const signale = require('signale');
const http = require('http');
const express = require('express');
const socketPort = 3000;
const app = express();
const socketServer = http.createServer(app);
const io = require('socket.io').listen(socketServer);

socketServer.listen(socketPort, () => {
  signale.success(`Socket server running at port ${socketPort}`);
});

app.get('/', function(req, res) {
  res.send('welcome to socket server.');
});

io.sockets.on('connection', (socket) => {
  socket.on('login', function(data) {
    console.log('Client logged-in:\n name:' + data.name + '\n userid: ' + data.userid);
    socket.name = data.name;
    socket.userid = data.userid;
  });

  socket.on('chat', (data) => {
    let message = {
      from: {
        name: socket.name,
        userid: socket.userid
      },
      msg: data.msg
    };
    console.log(`Message from ${socket.name}: ${data.msg}`);
    io.emit('chat', message);
  });

  socket.on('forceDisconnect', function() {
    socket.disconnect();
  });

  socket.on('disconnect', function() {
    console.log('user disconnected: ' + socket.name);
  });
});*/ 
