const signale = require('signale');
const http = require('http');
const app = require('express')();

const socketPort = 1027;
const socketServer = http.createServer(app);

socketServer.listen(socketPort, function() {
  signale.success(`Game server running at port ${socketPort}`);
});

const io = require('socket.io').listen(socketServer);

io.sockets.on('connection',function (socket) {
  socket.on('chat message', (msg) => {
    console.log(`chat message: ${msg}`);
    io.emit('chat message', msg);
  });
});