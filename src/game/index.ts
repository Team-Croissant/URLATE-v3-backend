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
  return new Promise((resolve, reject) => {
    redisClient.get(key, (err, data) => {
      resolve(data);
    });
  });
};

const redisSGet = (key): Promise<number[]> => {
  return new Promise((resolve, reject) => {
    redisClient.smembers(key, (err, data) => {
      resolve(data);
    });
  });
};

const getTan = (deg) => {
  let rad = (deg * Math.PI) / 180;
  return Math.tan(rad);
};

const calcAngleDegrees = (x, y) => {
  return (Math.atan2(y, x) * 180) / Math.PI;
};

const lowerBound = (array, value) => {
  if (value < 0) value = 0;
  let low = 0;
  let high = array.length;
  while (low < high) {
    const mid = Math.floor(low + (high - low) / 2);
    if (value <= array[mid].ms) {
      high = mid;
    } else {
      low = mid + 1;
    }
  }
  return low;
};

const upperBound = (array, value) => {
  let low = 0;
  let high = array.length;
  while (low < high) {
    const mid = Math.floor(low + (high - low) / 2);
    if (value >= array[mid].ms) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }
  return low;
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
        (err, file) => {
          let data = JSON.parse(file);
          redisClient.set(`pattern${socket.id}`, file);
          redisClient.set(`bpm${socket.id}`, data.information.bpm);
          redisClient.set(`speed${socket.id}`, data.information.speed);
        }
      );
      redisClient.set(`prevDate${socket.id}`, 0);
      redisClient.set(`prevX${socket.id}`, 0);
      redisClient.set(`prevY${socket.id}`, 0);
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

  socket.on("game update", async (mouseX, mouseY, offset, date) => {
    const prevX = Number(await redisGet(`prevX${socket.id}`));
    const prevY = Number(await redisGet(`prevY${socket.id}`));
    const prevDate = Number(await redisGet(`prevDate${socket.id}`));
    const ms = Number(await redisGet(`ms${socket.id}`));
    let bpm = Number(await redisGet(`bpm${socket.id}`));
    let speed = Number(await redisGet(`speed${socket.id}`));
    let pattern = await JSON.parse(`${await redisGet(`pattern${socket.id}`)}`);
    let destroyedBullets: number[] = await redisSGet(
      `destroyedBullets${socket.id}`
    );
    destroyedBullets = destroyedBullets.map(Number);
    let circleBulletAngles = await redisGet(`circleBulletAngles${socket.id}`);
    circleBulletAngles = `${circleBulletAngles}`.split(",").map(Number);
    for (let s = 1; s <= 10; s++) {
      const x = prevX + ((mouseX - prevX) / 10) * s;
      const y = prevY + ((mouseY - prevY) / 10) * s;
      const seek = prevDate + ((date - prevDate) / 10) * s - ms - offset;
      let start = lowerBound(pattern.triggers, 0);
      let end = upperBound(pattern.triggers, seek);
      const renderTriggers = pattern.triggers.slice(start, end);
      for (let i = 0; i < renderTriggers.length; i++) {
        if (renderTriggers[i].value == 0) {
          if (destroyedBullets.indexOf(renderTriggers[i].num) == -1) {
            await destroyedBullets.push(renderTriggers[i].num);
            redisClient.sadd(
              `destroyedBullets${socket.id}`,
              renderTriggers[i].num
            );
            signale.warn(`${socket.id} : Bullet`);
          }
        } else if (renderTriggers[i].value == 1) {
          end = upperBound(pattern.bullets, renderTriggers[i].ms);
          const renderBullets = pattern.bullets.slice(0, end);
          for (let j = 0; renderBullets.length > j; j++) {
            if (destroyedBullets.indexOf(j) == -1) {
              destroyedBullets.push(j);
              redisClient.set(`combo${socket.id}`, 0);
              redisClient.sadd(`destroyedBullets${socket.id}`, j);
            }
          }
        } else if (renderTriggers[i].value == 2) {
          bpm = renderTriggers[i].bpm;
          redisClient.set(`bpm${socket.id}`, renderTriggers[i].bpm);
        } else if (renderTriggers[i].value == 4) {
          speed = renderTriggers[i].speed;
          redisClient.set(`speed${socket.id}`, renderTriggers[i].speed);
        }
      }
      start = lowerBound(pattern.bullets, seek - bpm * 100);
      end = upperBound(pattern.bullets, seek);
      const renderBullets = pattern.bullets.slice(start, end);
      for (let i = 0; i < renderBullets.length; i++) {
        const e = renderBullets[i];
        if (destroyedBullets.indexOf(start + i) == -1) {
          const p = ((seek - e.ms) / ((bpm * 40) / speed / e.speed)) * 100;
          let left = e.direction == "L";
          let ex = (left ? -1 : 1) * (100 - p);
          let ey = 0;
          if (e.value == 0) {
            ey = e.location + p * getTan(e.angle) * (left ? 1 : -1);
          } else {
            if (!circleBulletAngles[start + i]) {
              circleBulletAngles[start + i] = calcAngleDegrees(
                (left ? -100 : 100) - x,
                e.location - y
              );
              redisClient.set(
                `circleBulletAngles${socket.id}`,
                circleBulletAngles.toString()
              );
            }
            if (left) {
              if (
                110 > circleBulletAngles[start + i] &&
                circleBulletAngles[start + i] > 0
              )
                circleBulletAngles[start + i] = 110;
              else if (
                0 > circleBulletAngles[start + i] &&
                circleBulletAngles[start + i] > -110
              )
                circleBulletAngles[start + i] = -110;
            } else {
              if (
                70 < circleBulletAngles[start + i] &&
                circleBulletAngles[start + i] > 0
              )
                circleBulletAngles[start + i] = 70;
              else if (
                0 > circleBulletAngles[start + i] &&
                circleBulletAngles[start + i] < -70
              )
                circleBulletAngles[start + i] = -70;
            }
            ey =
              e.location +
              p * getTan(circleBulletAngles[start + i]) * (left ? 1 : -1);
          }
          const powX = (x - ex) * 9.6;
          const powY = (y - ey) * 9.6;
          if (Math.sqrt(Math.pow(powX, 2) + Math.pow(powY, 2)) <= 24) {
            if (destroyedBullets.indexOf(start + i) == -1) {
              await destroyedBullets.push(start + i);
              redisClient.set(`combo${socket.id}`, 0);
              redisClient.sadd(`destroyedBullets${socket.id}`, start + i);
              signale.warn(`${socket.id} : Bullet`);
            }
          }
        }
      }
    }
    redisClient.set(`prevDate${socket.id}`, date);
    redisClient.set(`prevX${socket.id}`, mouseX);
    redisClient.set(`prevY${socket.id}`, mouseY);
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
