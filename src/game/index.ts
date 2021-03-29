import redis = require('redis');
import signale = require('signale');
import fetch = require('node-fetch');

const redisClient = redis.createClient();
const io = require("socket.io")(1027);

redisClient.on("error", function(error) {
  signale.error(error);
});

io.on("connection", (socket) => {
  redisClient.set(`socket${socket.id}`, socket.handshake.query.id);
  fetch('https://api.rhyga.me/user', {
    method: 'POST',
    body: JSON.stringify({
      userid: socket.handshake.query.id
    }),
    headers: {
      'Content-Type': 'application/json'
    }
  })
  .then(res => res.json())
  .then((data) => {
    redisClient.set(`socketName${socket.id}`, data.user.nickname);
    //socket.emit('user connected', data.user.id);
  });

  socket.on('chat message', (msg) => {
    redisClient.get(`socketName${socket.id}`, async (err, data) => {
      socket.emit('chat message', `${data}: ${msg}`);
    });
  });

  socket.on('disconnect', () => {
    //socket.emit('user disconnected', socket.id);
  });
});