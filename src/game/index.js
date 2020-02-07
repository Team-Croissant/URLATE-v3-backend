/*const signale = require('signale');
const fs = require('fs')
const https = require('https');
const app = require('express')();
const config = require('./config/config.json');
const privateKey = fs.readFileSync(config.keys.key, 'utf8');
const certificate = fs.readFileSync(config.keys.crt, 'utf8');

const socketPort = 3000;
const socketServer = https.createServer({
  key: privateKey,
  cert: certificate
}, app);

socketServer.listen(socketPort, function() {
  signale.success(`Socket server running at port ${socketPort}`);
});
const io = require('socket.io').listen(socketServer);

io.sockets.on('connection',function (socket) {
    socket.on('chat message', (msg) => {
      io.emit('chat message', msg);
    });
});
*/