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

const calculateScore = async (judge, id) => {
  if (judge == "miss") {
    let miss = await Number(await redisGet(`miss${id}`));
    miss++;
    redisClient.set(`combo${id}`, 0);
    redisClient.set(`miss${id}`, miss);
    return;
  } else if (judge == "bullet") {
    let bullet = await Number(await redisGet(`bullet${id}`));
    bullet++;
    redisClient.set(`combo${id}`, 0);
    redisClient.set(`bullet${id}`, bullet);
    return;
  }
  let patternLength = await Number(await redisGet(`patternLength${id}`));
  let score = await Number(await redisGet(`score${id}`));
  let combo = await Number(await redisGet(`combo${id}`));
  let perfect = await Number(await redisGet(`perfect${id}`));
  let great = await Number(await redisGet(`great${id}`));
  let good = await Number(await redisGet(`good${id}`));
  let bad = await Number(await redisGet(`bad${id}`));
  combo++;
  if (judge == "perfect") {
    score += Math.round(100000000 / patternLength) + combo * 5;
    perfect++;
  } else if (judge == "great") {
    score += Math.round((100000000 / patternLength) * 0.5) + combo * 5;
    great++;
  } else if (judge == "good") {
    score += Math.round((100000000 / patternLength) * 0.2) + combo * 3;
    good++;
  } else {
    bad++;
    combo = 0;
    score += Math.round((100000000 / patternLength) * 0.05);
  }
  redisClient.set(`combo${id}`, combo);
  redisClient.set(`score${id}`, score);
  redisClient.set(`perfect${id}`, perfect);
  redisClient.set(`great${id}`, great);
  redisClient.set(`good${id}`, good);
  redisClient.set(`bad${id}`, bad);
  console.log(score);
  io.to(id).emit("score", score);
  io.to(id).emit("combo", combo);
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
          redisClient.set(`patternLength${socket.id}`, data.patterns.length);
        }
      );
      redisClient.set(`prevDate${socket.id}`, 0);
      redisClient.set(`prevX${socket.id}`, 0);
      redisClient.set(`prevY${socket.id}`, 0);
      redisClient.set(`score${socket.id}`, 0);
      redisClient.set(`combo${socket.id}`, 0);
      redisClient.set(`perfect${socket.id}`, 0);
      redisClient.set(`great${socket.id}`, 0);
      redisClient.set(`good${socket.id}`, 0);
      redisClient.set(`bad${socket.id}`, 0);
      redisClient.set(`miss${socket.id}`, 0);
      redisClient.set(`bullet${socket.id}`, 0);
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
    try {
      const prevX = Number(await redisGet(`prevX${socket.id}`));
      const prevY = Number(await redisGet(`prevY${socket.id}`));
      const prevDate = Number(await redisGet(`prevDate${socket.id}`));
      const ms = Number(await redisGet(`ms${socket.id}`));
      let bpm = Number(await redisGet(`bpm${socket.id}`));
      let speed = Number(await redisGet(`speed${socket.id}`));
      let pattern = await JSON.parse(
        `${await redisGet(`pattern${socket.id}`)}`
      );
      let destroyedBullets: number[] = await redisSGet(
        `destroyedBullets${socket.id}`
      );
      let destroyedNotes: number[] = await redisSGet(
        `destroyedNotes${socket.id}`
      );
      destroyedBullets = destroyedBullets.map(Number);
      destroyedNotes = destroyedNotes.map(Number);
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
              calculateScore("bullet", socket.id);
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
                calculateScore("bullet", socket.id);
              }
            }
          }
        }
        start = lowerBound(pattern.patterns, seek - (bpm * 4) / speed);
        end = upperBound(pattern.patterns, seek);
        const renderNotes = pattern.patterns.slice(start, end);
        for (let i = 0; i < renderNotes.length; i++) {
          const p =
            (((bpm * 14) / speed - (renderNotes[i].ms - seek)) /
              ((bpm * 14) / speed)) *
            100;
          if (p >= 120 && destroyedNotes.indexOf(start + i) == -1) {
            destroyedNotes.push(start + i);
            redisClient.sadd(`destroyedNotes${socket.id}`, start + i);
            signale.success(`${socket.id} : Miss`);
            calculateScore("miss", socket.id);
          }
        }
      }
      redisClient.set(`prevDate${socket.id}`, date);
      redisClient.set(`prevX${socket.id}`, mouseX);
      redisClient.set(`prevY${socket.id}`, mouseY);
    } catch (e) {
      signale.error(e);
    }
  });

  socket.on("game click", async (x, y, offset, date) => {
    try {
      const ms = Number(await redisGet(`ms${socket.id}`));
      let bpm = Number(await redisGet(`bpm${socket.id}`));
      let speed = Number(await redisGet(`speed${socket.id}`));
      const seek = date - ms - offset;
      let pattern = JSON.parse(`${await redisGet(`pattern${socket.id}`)}`);
      const start = lowerBound(pattern.patterns, seek - (bpm * 4) / speed);
      const end = upperBound(pattern.patterns, seek + (bpm * 14) / speed);
      const renderNotes = pattern.patterns.slice(start, end);
      let destroyedNotes: number[] = await redisSGet(
        `destroyedNotes${socket.id}`
      );
      destroyedNotes = destroyedNotes.map(Number);
      for (let i = 0; i < renderNotes.length; i++) {
        if (destroyedNotes.indexOf(start + i) == -1) {
          const powX = (x - renderNotes[i].x) * 9.6;
          const powY = (y - renderNotes[i].y) * 5.4;
          if (
            Math.sqrt(Math.pow(powX, 2) + Math.pow(powY, 2)) <= 75.4285714286
          ) {
            let perfectJudge = 60000 / bpm / 8;
            let greatJudge = 60000 / bpm / 5;
            let goodJudge = 60000 / bpm / 3;
            let badJudge = 60000 / bpm / 2;
            let noteMs = renderNotes[i].ms;
            if (seek < noteMs + perfectJudge && seek > noteMs - perfectJudge) {
              signale.success(`${socket.id} : Perfect`);
              calculateScore("perfect", socket.id);
            } else if (
              seek < noteMs + greatJudge &&
              seek > noteMs - greatJudge
            ) {
              signale.success(`${socket.id} : Great`);
              calculateScore("great", socket.id);
            } else if (seek > noteMs - goodJudge && seek < noteMs) {
              signale.success(`${socket.id} : Good`);
              calculateScore("good", socket.id);
            } else if (
              (seek > noteMs - badJudge && seek < noteMs) ||
              noteMs < seek
            ) {
              signale.success(`${socket.id} : Bad`);
              calculateScore("bad", socket.id);
            } else {
              signale.success(`${socket.id} : Miss`);
              calculateScore("miss", socket.id);
            }
            redisClient.sadd(`destroyedNotes${socket.id}`, start + i);
            break;
          }
        }
      }
    } catch (e) {
      signale.error(e);
    }
  });

  socket.on("game end", () => {
    signale.stop(`${socket.id} : Game Finished`);
  });

  socket.on("disconnect", () => {
    signale.debug(`${socket.id} : User Disconnected.`);
    redisClient.del(`perfect${socket.id}`);
    redisClient.del(`great${socket.id}`);
    redisClient.del(`good${socket.id}`);
    redisClient.del(`bad${socket.id}`);
    redisClient.del(`miss${socket.id}`);
    redisClient.del(`bullet${socket.id}`);
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
