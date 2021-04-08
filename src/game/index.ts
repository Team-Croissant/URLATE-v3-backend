import redis = require("redis");
import fetch = require("node-fetch");
import fs = require("fs");

const { Signale } = require("signale");

const options = {
  disabled: false,
  interactive: false,
  stream: process.stdout,
  types: {
    start: {
      badge: "▶",
      color: "green",
      label: "Start",
      logLevel: "info",
    },
    stop: {
      badge: "■",
      color: "red",
      label: "Stop",
      logLevel: "info",
    },
  },
};

const signale = new Signale(options);

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

  socket.on("game init", (name, difficulty) => {
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

  socket.on("game start", (date) => {
    redisClient.set(`ms${socket.id}`, date);
    signale.start("Game Started");
  });

  socket.on("game pause", (date) => {
    redisClient.set(`pauseDate${socket.id}`, date);
    signale.stop("Game Paused");
  });

  socket.on("game resume", (date) => {
    redisClient.get(`pauseDate${socket.id}`, async (err, pauseDate) => {
      redisClient.get(`ms${socket.id}`, async (err, ms) => {
        redisClient.set(
          `ms${socket.id}`,
          Number(ms) + date - Number(pauseDate)
        );
      });
    });
    signale.start("Game Resume");
  });

  socket.on("game update", (x, y, offset, date) => {
    let seek;
    redisClient.get(`ms${socket.id}`, async (err, ms) => {
      seek = date - ms - offset;
      console.log(seek, x, y);
    });
  });

  socket.on("game end", () => {
    signale.stop("Game Finished");
  });

  socket.on("disconnect", () => {
    signale.debug(`${socket.id} : User Disconnected.`);
    redisClient.del(`score${socket.id}`);
    redisClient.del(`combo${socket.id}`);
    redisClient.del(`pattern${socket.id}`);
    redisClient.del(`destroyedNotes${socket.id}`);
    redisClient.del(`destroyedBullets${socket.id}`);
    redisClient.del(`ms${socket.id}`);
    redisClient.del(`pauseDate${socket.id}`);
    redisClient.del(`socket${socket.id}`);
  });
});
