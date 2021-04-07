import redis = require("redis");
import signale = require("signale");
import fetch = require("node-fetch");
import fs = require("fs");

const redisClient = redis.createClient();
const io = require("socket.io")(1027);

const patternDir = __dirname + "/../../resources/public/patterns/";

const getPatternDir = (name, difficulty) => {
  return `${name}/${difficulty}.json`;
};

redisClient.on("error", function (error) {
  signale.error(error);
});

io.on("connection", (socket) => {
  redisClient.set(`socket${socket.id}`, socket.handshake.query.id);

  socket.on("game start", (name, difficulty) => {
    fs.readFile(
      patternDir + getPatternDir(name, difficulty),
      "utf8",
      (err, data) => {
        redisClient.set(`pattern${socket.id}`, JSON.stringify(data));
      }
    );
    redisClient.set(`score${socket.id}`, 0);
    redisClient.set(`combo${socket.id}`, 0);
    redisClient.del(`destroyedBullets${socket.id}`);
    redisClient.del(`destroyedNotes${socket.id}`);
  });

  socket.on("disconnect", () => {
    redisClient.del(`socket${socket.id}`);
  });
});
