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

const redisGet = (key) => {
  return new Promise(function (resolve, reject) {
    redisClient.get(key, (err, data) => {
      resolve(data);
    });
  });
};

const redisSGet = (key) => {
  return new Promise(function (resolve, reject) {
    redisClient.smembers(key, (err, data) => {
      resolve(data);
    });
  });
};

redisClient.on("error", function (error) {
  signale.error(error);
});

io.on("connection", (socket) => {
  redisClient.set(`socket${socket.id}`, socket.handshake.query.id);

  socket.on("game init", async (name, difficulty) => {
    const isUserConnected = await redisGet(`score${socket.id}`);
    if (isUserConnected === null) {
      signale.success(`${socket.id} : Game Initialized`);
      fs.readFile(
        patternDir + getPatternDir(name, difficulty),
        "utf8",
        (err, data) => {
          redisClient.set(`pattern${socket.id}`, data);
        }
      );
      redisClient.set(`score${socket.id}`, 0);
      redisClient.set(`combo${socket.id}`, 0);
      redisClient.del(`destroyedBullets${socket.id}`);
      redisClient.del(`destroyedNotes${socket.id}`);
    } else {
      signale.warn(`${socket.id} : User Reconnected.`);
    }
  });

  socket.on("game start", (date) => {
    redisClient.set(`ms${socket.id}`, date);
    signale.start(`${socket.id} : Game Started`);
  });

  socket.on("game pause", (date) => {
    redisClient.set(`pauseDate${socket.id}`, date);
    signale.stop(`${socket.id} : Game Paused`);
  });

  socket.on("game resume", async (date) => {
    const pauseDate = await redisGet(`pauseDate${socket.id}`);
    const ms = await redisGet(`ms${socket.id}`);
    redisClient.set(`ms${socket.id}`, Number(ms) + date - Number(pauseDate));
    signale.start(`${socket.id} : Game Resume`);
  });

  socket.on("game update", (x, y, offset, date) => {
    let seek;
    redisClient.get(`ms${socket.id}`, async (err, ms) => {
      seek = date - ms - offset;
      console.log(seek, x, y);
    });
  });

  socket.on("game end", () => {
    signale.stop(`${socket.id} : Game Finished`);
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
