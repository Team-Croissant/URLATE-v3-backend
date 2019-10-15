const signale = require('signale');
const privateKey = fs.readFileSync(config.keys.key, 'utf8');
const certificate = fs.readFileSync(config.keys.crt, 'utf8');

var socketPort = 3000;
var socketServer = https.createServer({
  key: privateKey,
  cert: certificate
}, app);
socketServer.listen(socketPort, function() {
  signale.success(`Socket server running at port ${socketPort}`);
});
var io = require('socket.io').listen(socketServer);

io.sockets.on('connection',function (socket) {
    socket.on('chat message', (msg) => {
      io.emit('chat message', msg);
    });
});
