/* eslint-disable @typescript-eslint/no-var-requires */
import * as bodyParser from "body-parser";
import * as redis from "redis";
import * as session from "express-session";
import pbkdf2 from "pbkdf2-password";
import fetch from "node-fetch";
import cookieParser from "cookie-parser";
import express from "express";
import mysqlSession from "express-mysql-session";
import signale from "signale";
import knexClient from "knex";
import { v4 as uuidv4 } from "uuid";
import { google } from "googleapis";
import { Request } from "express-serve-static-core";
import { URLATEConfig } from "./types/config.schema";
import {
  createSuccessResponse,
  createErrorResponse,
  createStatusResponse,
} from "./api-response";

const config: URLATEConfig = require(__dirname + "/../config/config.json");
const settingsConfig = require(__dirname + "/../config/settings.json");
const allowlist = require(__dirname + "/../config/allowlist.json");

const MySQLStore = mysqlSession(session);
const hasher = pbkdf2();

const redisClient = redis.createClient(config.database.redis);

const OAuth2 = google.auth.OAuth2;
const plus = google.plus("v1");

const app = express();
app.locals.pretty = true;

const knex = knexClient({
  client: "mysql",
  connection: {
    host: config.database.host,
    user: config.database.user,
    password: config.database.password,
    database: config.database.db,
  },
});

const sessionStore = new MySQLStore({
  host: config.database.host,
  port: config.database.port,
  user: config.database.user,
  password: config.database.password,
  database: config.database.db,
});

app.use(
  session.default({
    secret: config.session.secret,
    store: sessionStore,
    resave: config.session.resave,
    saveUninitialized: config.session.saveUninitialized,
  })
);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

const getOAuthClient = (ClientId, ClientSecret, RedirectionUrl) =>
  new OAuth2(ClientId, ClientSecret, RedirectionUrl);

redisClient.on("error", function (error) {
  signale.error(error);
});

app.get("/auth/status", async (req, res) => {
  const hasToken = req.session.accessToken && req.session.refreshToken;
  if (!hasToken) {
    res.status(200).json(createStatusResponse("Not logined"));
    return;
  }

  const results = await knex("users")
    .select("userid", "nickname", "adultCert", "authentication", "birth")
    .where("userid", req.session.userid);
  if (!results[0]) {
    res
      .status(200)
      .json({ status: "Not registered", tempName: req.session.tempName });
    return;
  }

  if (results[0].authentication == 0) {
    res.status(200).json(createStatusResponse("Not authenticated"));
    return;
  }

  if (results[0].adultCert == 0) {
    res.status(200).json(createStatusResponse("Not authenticated(adult)"));
    return;
  }

  const date = new Date();
  if (date.getTime() - new Date(results[0].birth).getTime() <= 504576000000) {
    if (0 <= date.getHours() && date.getHours() <= 6) {
      res.status(200).json(createStatusResponse("Shutdowned"));
      return;
    }
  }

  if (!req.session.authorized) {
    res.status(200).json(createStatusResponse("Not authorized"));
    return;
  }

  res.status(200).json(createStatusResponse("Logined"));
});

app.post("/auth/login", (req, res) => {
  const oauth2Client = getOAuthClient(
    req.body.ClientId,
    req.body.ClientSecret,
    req.body.RedirectionUrl
  );
  oauth2Client.getToken(req.body.code, (err, tokens) => {
    if (err) {
      res
        .status(400)
        .json(
          createErrorResponse(
            "failed",
            err.response.data.error,
            err.response.data.error_description
          )
        );
      return;
    }

    const { access_token, refresh_token } = tokens;
    oauth2Client.setCredentials({ access_token, refresh_token });
    plus.people.get({ userId: "me", auth: oauth2Client }, (err, response) => {
      // eslint-disable-next-line no-constant-condition
      if (allowlist.indexOf(response.data.emails[0].value) != -1 || true) {
        req.session.userid = response.data.id;
        req.session.email = response.data.emails[0].value;
        req.session.tempName = response.data.displayName;
        req.session.accessToken = access_token;
        req.session.refreshToken = refresh_token;
        req.session.save(() => {
          signale.debug(new Date());
          signale.debug(`User logined : ${response.data.emails[0].value}`);
          res.status(200).json(createSuccessResponse("success"));
        });
      } else {
        signale.debug(new Date());
        signale.debug(
          `User login blocked by whitelist : ${response.data.emails[0].value}`
        );
        res
          .status(400)
          .json(
            createErrorResponse(
              "failed",
              "Not Whitelisted",
              "Provided email is not whitelisted."
            )
          );
      }
      return;
    });
  });
});

const accUserPattern = /^[a-z0-9]{1,10}$/;
const accPattern = /^[a-zA-Z0-9!]{10}$/;
app.post("/acc/login", async (req, res) => {
  if (!accUserPattern.test(req.body.username)) {
    res
      .status(400)
      .json(
        createErrorResponse("failed", "Wrong Format", "Wrong username format.")
      );
    return;
  }
  if (!accPattern.test(req.body.password)) {
    res
      .status(400)
      .json(
        createErrorResponse("failed", "Wrong Format", "Wrong password format.")
      );
    return;
  }
  const results = await knex("users")
    .select("secondary", "salt", "userid")
    .where("nickname", req.body.username);
  if (results.length == 0) {
    res
      .status(400)
      .json(createErrorResponse("failed", "Wrong User", "Wrong username."));
    return;
  }

  hasher(
    {
      password: req.body.password,
      salt: results[0].salt,
    },
    (err, pass, salt, hash) => {
      if (hash !== results[0].secondary) {
        res
          .status(400)
          .json(
            createErrorResponse(
              "failed",
              "Wrong Password",
              "User entered wrong password."
            )
          );
        return;
      }
      req.session.accessToken = "TESTTOKEN";
      req.session.refreshToken = "TESTREFRESHTOKEN";
      req.session.userid = results[0].userid;
      req.session.authorized = true;
      req.session.save(() => {
        res.status(200).json(createSuccessResponse("success"));
      });
    }
  );
});

app.post("/auth/join", async (req, res) => {
  const hasToken =
    req.session.tempName && req.session.accessToken && req.session.refreshToken;
  if (!hasToken) {
    res
      .status(400)
      .json(
        createErrorResponse(
          "failed",
          "Wrong Request",
          "You need to login first."
        )
      );
    return;
  }

  const namePattern = /^[a-zA-Z0-9_-]{5,12}$/;
  const passPattern = /^[0-9]{4,6}$/;
  const isValidated =
    namePattern.test(req.body.displayName) &&
    passPattern.test(req.body.secondaryPassword);
  if (!isValidated) {
    res
      .status(400)
      .json(
        createErrorResponse(
          "failed",
          "Wrong Format",
          "Wrong name OR password format."
        )
      );
    return;
  }

  const results = await knex("users")
    .select("nickname")
    .where("nickname", req.body.displayName);
  if (!results[0]) {
    hasher(
      {
        password: req.body.secondaryPassword,
      },
      async (err, pass, salt, hash) => {
        await knex("users").insert({
          nickname: req.body.displayName,
          userid: req.session.userid,
          salt: salt,
          secondary: hash,
          date: new Date(),
          email: req.session.email,
          advanced: false,
          advancedDate: new Date(),
          advancedUpdatedDate: new Date(),
          settings: JSON.stringify(settingsConfig),
          skins: '["Default"]',
          DLCs: "[]",
          advancedBillingCode: "",
          advancedExpireDate: new Date(),
          advancedType: "",
          tutorial: 3,
          authentication: 0,
          name: "",
          birth: new Date(0),
          CI: "",
          DI: "",
          adultCert: 0,
          paid: 0,
          paidDate: new Date(0),
        });
        delete req.session.tempName;
        req.session.save(() => {
          res.status(200).json(createSuccessResponse("success"));
        });
      }
    );
  } else {
    res
      .status(400)
      .json(
        createErrorResponse(
          "failed",
          "Exist Name",
          "The name sent already exists."
        )
      );
  }
});

const passwordPattern = /^[0-9]{4,6}$/;
app.post("/auth/authorize", async (req, res) => {
  if (!passwordPattern.test(req.body.secondaryPassword)) {
    res
      .status(400)
      .json(
        createErrorResponse("failed", "Wrong Format", "Wrong password format.")
      );
    return;
  }
  const results = await knex("users")
    .select("secondary", "salt")
    .where("userid", req.session.userid);

  hasher(
    {
      password: req.body.secondaryPassword,
      salt: results[0].salt,
    },
    (err, pass, salt, hash) => {
      if (hash !== results[0].secondary) {
        res
          .status(400)
          .json(
            createErrorResponse(
              "failed",
              "Wrong Password",
              "User entered wrong password."
            )
          );
        return;
      }

      req.session.authorized = true;
      req.session.save(() => {
        res.status(200).json(createSuccessResponse("success"));
      });
    }
  );
});

app.get("/user", async (req, res) => {
  if (!req.session.userid) {
    res
      .status(400)
      .json(
        createErrorResponse(
          "failed",
          "UserID Required",
          "UserID is required for this task."
        )
      );
    return;
  }

  const results = await knex("users")
    .select(
      "nickname",
      "settings",
      "skins",
      "advanced",
      "advancedType",
      "DLCs",
      "userid",
      "tutorial"
    )
    .where("userid", req.session.userid);
  if (!results.length) {
    res
      .status(400)
      .json(
        createErrorResponse(
          "failed",
          "Failed to Load",
          "Failed to load data. Use /auth/status to check your status."
        )
      );
    return;
  }

  res.status(200).json({ result: "success", user: results[0] });
});

app.post("/user", async (req, res) => {
  if (!req.body.userid) {
    res
      .status(400)
      .json(
        createErrorResponse(
          "failed",
          "UserID Required",
          "UserID is required for this task."
        )
      );
    return;
  }

  const results = await knex("users")
    .select("nickname", "settings", "advanced")
    .where("userid", req.body.userid);
  if (!results.length) {
    res
      .status(400)
      .json(
        createErrorResponse("failed", "Failed to Load", "Failed to load data.")
      );
    return;
  }

  res.status(200).json({ result: "success", user: results[0] });
});

app.get("/tracks", async (req, res) => {
  const results = await knex("tracks").select(
    "name",
    "fileName",
    "producer",
    "bpm",
    "difficulty",
    "originalName",
    "type"
  );
  if (!results.length) {
    res
      .status(400)
      .json(
        createErrorResponse(
          "failed",
          "Failed to Load",
          "Failed to load tracks. It may be a problem with the DB."
        )
      );
    return;
  }

  res.status(200).json({ result: "success", tracks: results });
});

app.get("/track/:name", async (req, res) => {
  const results = await knex("tracks")
    .select(
      "name",
      "fileName",
      "producer",
      "bpm",
      "difficulty",
      "originalName",
      "type"
    )
    .where("name", req.params.name);
  if (!results.length) {
    res
      .status(400)
      .json(
        createErrorResponse(
          "failed",
          "Failed to Load",
          "Failed to load track. It may be a problem with the DB."
        )
      );
    return;
  }

  res.status(200).json({ result: "success", track: results });
});

app.get("/trackInfo/:name", async (req, res) => {
  const results = await knex("patternInfo")
    .select("bpm", "bullet_density", "note_density", "speed")
    .where("name", req.params.name);
  if (!results.length) {
    res
      .status(400)
      .json(
        createErrorResponse(
          "failed",
          "Failed to Load",
          "Failed to load track data. It may be a problem with the DB."
        )
      );
    return;
  }
  songCountUp(req.params.name);
  res.status(200).json({ result: "success", info: results });
});

app.put("/settings", async (req, res) => {
  if (!req.session.userid) {
    res
      .status(400)
      .json(
        createErrorResponse(
          "failed",
          "UserID Required",
          "UserID is required for this task."
        )
      );
    return;
  }
  try {
    const settings = req.body.settings;
    if (
      settings.sound.res == "192kbps" ||
      !settings.game.judgeSkin ||
      JSON.stringify(settings.game.applyJudge) !=
        `{"Perfect":false,"Great":false,"Good":false,"Bad":false,"Miss":false,"Bullet":false}`
    ) {
      const advanced = await knex("users")
        .select("advanced")
        .where("userid", req.session.userid);
      if (!advanced[0].advanced) {
        res
          .status(400)
          .json(
            createErrorResponse(
              "failed",
              "Error occured while updating",
              "wrong request"
            )
          );
        return;
      }
    }
    await knex("users")
      .update({ settings: JSON.stringify(req.body.settings) })
      .where("userid", req.session.userid);
  } catch (e) {
    res
      .status(400)
      .json(createErrorResponse("failed", "Error occured while updating", e));
    return;
  }
  res.status(200).json(createSuccessResponse("success"));
});

app.put("/tutorial", async (req, res) => {
  if (!req.session.userid) {
    res
      .status(400)
      .json(
        createErrorResponse(
          "failed",
          "UserID Required",
          "UserID is required for this task."
        )
      );
    return;
  }
  try {
    await knex("users")
      .update({ tutorial: 1 })
      .where("userid", req.session.userid);
  } catch (e) {
    res
      .status(400)
      .json(createErrorResponse("failed", "Error occured while updating", e));
    return;
  }
  res.status(200).json(createSuccessResponse("success"));
});

app.put("/storeTutorial", async (req, res) => {
  if (!req.session.userid) {
    res
      .status(400)
      .json(
        createErrorResponse(
          "failed",
          "UserID Required",
          "UserID is required for this task."
        )
      );
    return;
  }
  try {
    await knex("users")
      .update({ tutorial: 0 })
      .where("userid", req.session.userid);
  } catch (e) {
    res
      .status(400)
      .json(createErrorResponse("failed", "Error occured while updating", e));
    return;
  }
  res.status(200).json(createSuccessResponse("success"));
});

app.get("/skin/:skinName", async (req, res) => {
  const results = await knex("skins")
    .select("data")
    .where("name", req.params.skinName);
  if (!results.length) {
    res
      .status(400)
      .json(
        createErrorResponse(
          "failed",
          "Failed to Load",
          "Failed to load skin data."
        )
      );
    return;
  }
  res.status(200).json({ result: "success", data: results[0].data });
});

app.get("/teamProfile/:name", async (req, res) => {
  const results = await knex("teamProfiles")
    .select("data")
    .where("name", req.params.name);
  if (!results.length) {
    res
      .status(400)
      .json(
        createErrorResponse("failed", "Failed to Load", "Failed to load data.")
      );
    return;
  }
  res.status(200).json({ result: "success", data: results[0].data });
});

app.get("/trackCount/:name", async (req, res) => {
  songCountUp(req.params.name);
  res.end();
});

app.put("/record", async (req, res) => {
  if (req.body.secret !== config.project.secretKey) {
    res
      .status(400)
      .json(
        createErrorResponse(
          "failed",
          "Authorize failed",
          "Project secret key is not vaild."
        )
      );
    return;
  }
  try {
    let isBest = 0;
    const result = await knex("trackRecords")
      .select("record")
      .where("nickname", req.body.nickname)
      .where("name", req.body.name)
      .where("isBest", 1)
      .where("difficulty", req.body.difficulty);
    if (result.length && result[0].record < req.body.record) {
      isBest = 1;
      await knex("trackRecords")
        .update({
          isBest: 0,
        })
        .where("nickname", req.body.nickname)
        .where("name", req.body.name)
        .where("isBest", 1)
        .where("difficulty", req.body.difficulty);
    }
    if (!result.length) isBest = 1;
    await knex("trackRecords").insert({
      name: req.body.name,
      nickname: req.body.nickname,
      rank: req.body.rank,
      record: req.body.record,
      maxcombo: req.body.maxcombo,
      medal: req.body.medal,
      difficulty: req.body.difficulty,
      isBest: isBest,
    });
  } catch (e) {
    res
      .status(400)
      .json(createErrorResponse("failed", "Error occured while updating", e));
    return;
  }
  res.status(200).json(createSuccessResponse("success"));
});

app.put("/CPLrecord", async (req, res) => {
  if (req.body.secret !== config.project.secretKey) {
    res
      .status(400)
      .json(
        createErrorResponse(
          "failed",
          "Authorize failed",
          "Project secret key is not vaild."
        )
      );
    return;
  }
  try {
    let isBest = 0;
    let gap = 0;
    const result = await knex("CPLtrackRecords")
      .select("record")
      .where("nickname", req.body.nickname)
      .where("name", req.body.name)
      .where("isBest", 1)
      .where("difficulty", req.body.difficulty)
      .where("id", req.body.id);
    if (result.length && result[0].record < req.body.record) {
      isBest = 1;
      gap = req.body.record - result[0].record;
      await knex("CPLtrackRecords")
        .update({
          isBest: 0,
        })
        .where("nickname", req.body.nickname)
        .where("name", req.body.name)
        .where("isBest", 1)
        .where("difficulty", req.body.difficulty)
        .where("id", req.body.id);
    }
    if (!result.length) {
      isBest = 1;
      gap = req.body.record;
    }
    await knex("CPLtrackRecords").insert({
      id: req.body.id,
      name: req.body.name,
      nickname: req.body.nickname,
      rank: req.body.rank,
      record: req.body.record,
      maxcombo: req.body.maxcombo,
      difficulty: req.body.difficulty,
      isBest: isBest,
    });
    const total = await knex("CPLTotalTrackRecords")
      .select("record")
      .where("nickname", req.body.nickname)
      .where("name", req.body.name)
      .where("difficulty", req.body.difficulty);
    const score = total[0].record + gap;
    if (total.length) {
      await knex("CPLTotalTrackRecords")
        .update({
          record: score,
        })
        .where("nickname", req.body.nickname)
        .where("name", req.body.name)
        .where("difficulty", req.body.difficulty);
    } else {
      await knex("CPLTotalTrackRecords").insert({
        name: req.body.name,
        nickname: req.body.nickname,
        record: req.body.record,
        difficulty: req.body.difficulty,
      });
    }
  } catch (e) {
    res
      .status(400)
      .json(createErrorResponse("failed", "Error occured while updating", e));
    return;
  }
  res.status(200).json(createSuccessResponse("success"));
});

app.get("/record/:track/:name", async (req, res) => {
  const results = await knex("trackRecords")
    .select("rank", "record", "maxcombo", "medal", "difficulty")
    .where("nickname", req.params.name)
    .where("name", req.params.track)
    .where("isBest", 1)
    .orderBy("difficulty", "DESC");
  if (!results.length) {
    res.status(200).json(createSuccessResponse("empty"));
    return;
  }
  res.status(200).json({ result: "success", results });
});

app.get(
  "/records/:track/:difficulty/:order/:sort/:nickname",
  async (req, res) => {
    const results = await knex("trackRecords")
      .select("rank", "record", "maxcombo", "nickname")
      .where("name", req.params.track)
      .where("difficulty", req.params.difficulty)
      .where("isBest", 1)
      .orderBy(req.params.order, req.params.sort);
    const rank =
      results
        .map((d) => {
          return d["nickname"];
        })
        .indexOf(req.params.nickname) + 1;
    res
      .status(200)
      .json({ result: "success", results: results.slice(0, 100), rank: rank });
  }
);

app.get(
  "/CPLrecords/:track/:difficulty/:order/:sort/:nickname",
  async (req, res) => {
    const results = await knex("CPLTotalTrackRecords")
      .select("record", "nickname")
      .where("name", req.params.track)
      .where("difficulty", req.params.difficulty)
      .orderBy(req.params.order, req.params.sort);
    const rank =
      results
        .map((d) => {
          return d["nickname"];
        })
        .indexOf(req.params.nickname) + 1;
    res
      .status(200)
      .json({ result: "success", results: results.slice(0, 100), rank: rank });
  }
);

app.get("/CPLpatternList/:name/:difficulty", async (req, res) => {
  const results = await knex("CPLpatternInfo")
    .select(
      "id",
      "patternName",
      "name",
      "author",
      "description",
      "analyzed",
      "community",
      "star",
      "difficulty"
    )
    .where("name", req.params.name)
    .where("difficulty", req.params.difficulty);
  res.status(200).json({ result: "success", data: results });
});

app.get("/CPLtrackInfo/:name", async (req, res) => {
  songCountUp(req.params.name);
  const results = await knex("CPLpatternInfo")
    .select("name", "difficulty")
    .where("name", req.params.name);
  res.status(200).json({ result: "success", info: results });
});

app.get("/store/DLCs", async (req, res) => {
  const results = await knex("storeDLC").select(
    "name",
    "previewFile",
    "price",
    "composer",
    "songs",
    "sale"
  );
  if (!results.length) {
    res
      .status(400)
      .json(
        createErrorResponse(
          "failed",
          "Failed to Load",
          "Failed to load DLC data."
        )
      );
    return;
  }
  res.status(200).json({ result: "success", data: results });
});

app.get("/store/DLC/:name", async (req, res) => {
  const results = await knex("storeDLC")
    .select("name", "previewFile", "price", "composer", "songs", "sale")
    .where("name", req.params.name);
  if (!results.length) {
    res
      .status(400)
      .json(
        createErrorResponse(
          "failed",
          "Failed to Load",
          "Failed to load DLC data."
        )
      );
    return;
  }
  res.status(200).json({ result: "success", data: results[0] });
});

app.get("/store/skins", async (req, res) => {
  const results = await knex("storeSkin").select(
    "name",
    "previewFile",
    "price",
    "sale"
  );
  if (!results.length) {
    res
      .status(400)
      .json(
        createErrorResponse(
          "failed",
          "Failed to Load",
          "Failed to load Skin data."
        )
      );
    return;
  }
  res.status(200).json({ result: "success", data: results });
});

app.get("/store/skin/:name", async (req, res) => {
  const results = await knex("storeSkin")
    .select("name", "previewFile", "price", "sale")
    .where("name", req.params.name);
  if (!results.length) {
    res
      .status(400)
      .json(
        createErrorResponse(
          "failed",
          "Failed to Load",
          "Failed to load Skin data."
        )
      );
    return;
  }
  res.status(200).json({ result: "success", data: results[0] });
});

app.post("/store/bag", (req, res) => {
  if (req.body.type == "DLC" || req.body.type == "Skin") {
    if (req.session.bag) {
      if (
        req.session.bag
          .map((i) => JSON.stringify(i))
          .indexOf(JSON.stringify(req.body)) != -1
      ) {
        res
          .status(400)
          .json(
            createErrorResponse(
              "failed",
              "Wrong request",
              `Item ${req.body.type} already exist.`
            )
          );
        return;
      } else {
        req.session.bag.push(req.body);
      }
    } else {
      req.session.bag = [req.body];
    }
  } else {
    res
      .status(400)
      .json(
        createErrorResponse(
          "failed",
          "Wrong request",
          `Item type ${req.body.type} doesn't exist.`
        )
      );
    return;
  }
  req.session.save(() => {
    res.status(200).json({ result: "success", bag: req.session.bag });
  });
});

app.get("/store/bag", (req, res) => {
  if (req.session.bag) {
    res.status(200).json({ result: "success", bag: req.session.bag });
  } else {
    res.status(200).json({ result: "success", bag: [] });
  }
});

app.delete("/store/bag", (req, res) => {
  if (req.session.bag && req.session.bag != []) {
    const index = req.session.bag
      .map((i) => JSON.stringify(i))
      .indexOf(JSON.stringify(req.body));
    if (index != -1) {
      req.session.bag.splice(index, 1);
      req.session.save(() => {
        res.status(200).json({ result: "success", bag: req.session.bag });
      });
    } else {
      res
        .status(400)
        .json(
          createErrorResponse(
            "failed",
            "Wrong request",
            `Item ${req.body.type} doesn't exist.`
          )
        );
    }
  } else {
    res
      .status(400)
      .json(createErrorResponse("failed", "Bag empty", "Bag is empty."));
  }
});

app.post("/store/purchase", async (req, res) => {
  if (!req.session.userid) {
    res
      .status(400)
      .json(
        createErrorResponse(
          "failed",
          "UserID Required",
          "UserID is required for this task."
        )
      );
    return;
  }
  const orderId = uuidv4();
  const cart = req.body.cart;
  redisClient.set(`Cart${orderId}`, JSON.stringify(cart));
  let price = 0;
  const userData = await knex("users")
    .select("advanced")
    .where("userid", req.session.userid);
  const isAdvanced = userData[0].advanced;
  for (let i = 0; i < cart.length; i++) {
    const result = await knex(`store${cart[i].type}`)
      .select("price", "sale")
      .where("name", cart[i].item);
    const add = JSON.parse(result[0].price)[0];
    price += Math.round(
      ((add - add * 0.2 * isAdvanced) / 100) * result[0].sale
    );
  }
  redisClient.set(`Amount${orderId}`, price.toString());
  res.status(200).json({
    result: "success",
    amount: price,
    orderId: orderId,
    email: req.session.email,
  });
});

app.get("/store/success", async (req, res) => {
  delete req.session.bag;
  if (!req.session.userid) {
    res
      .status(400)
      .json(
        createErrorResponse(
          "failed",
          "UserID Required",
          "UserID is required for this task."
        )
      );
    return;
  }
  const paymentKey = req.query.paymentKey;
  const orderId = req.query.orderId;
  const amount = req.query.amount;
  redisClient.get(`Amount${orderId}`, async (err, data) => {
    if (err) {
      res.redirect(`${config.project.url}/storeDenied?error=${err}`);
      return;
    }
    if (data == amount) {
      const amountCheck = await paidAmountCheck(req.session.userid, amount);
      if (amountCheck) {
        fetch(`https://api.tosspayments.com/v1/payments/${paymentKey}`, {
          method: "post",
          body: JSON.stringify({
            orderId: orderId,
            amount: amount,
          }),
          headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${config.toss.basicKey}`,
          },
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.status == "DONE") {
              redisClient.get(`Cart${orderId}`, async (err, reply) => {
                if (err) {
                  res.redirect(
                    `${config.project.url}/storeDenied?error=${err}`
                  );
                  return;
                }
                const cart = JSON.parse(reply);
                const saved = await knex("users")
                  .select("skins", "DLCs")
                  .where("userid", req.session.userid);
                const DLCs = new Set(JSON.parse(saved[0]["DLCs"]));
                const skins = new Set(JSON.parse(saved[0]["skins"]));
                for (let i = 0; i < cart.length; i++) {
                  if (cart[i].type == "DLC") {
                    DLCs.add(cart[i].item);
                  } else if (cart[i].type == "Skin") {
                    skins.add(cart[i].item);
                  }
                }
                await knex("users")
                  .update({
                    skins: JSON.stringify(Array.from(skins)),
                    DLCs: JSON.stringify(Array.from(DLCs)),
                  })
                  .where("userid", req.session.userid);
                res.redirect(`${config.project.url}/storePurchased`);
              });
            } else {
              res.redirect(`${config.project.url}/storeDenied?error=undefined`);
            }
          })
          .catch((error) => {
            res.redirect(`${config.project.url}/storeDenied?error=${error}`);
          });
      } else {
        res.redirect(
          `${config.project.url}/storeDenied?error=Exceeding the payment limit for minors`
        );
      }
    } else {
      res.redirect(`${config.project.url}/storeDenied?error=Wrong request`);
    }
  });
});

app.get("/billing/success", async (req, res) => {
  const customerKey = req.query.customerKey;
  const authKey = req.query.authKey;
  if (!req.session.userid) {
    res
      .status(400)
      .json(
        createErrorResponse(
          "failed",
          "UserID Required",
          "UserID is required for this task."
        )
      );
    return;
  }
  if (req.session.userid != customerKey) {
    res.redirect(`${config.project.url}/storeDenied?error=Invaild customerKey`);
    return;
  }
  fetch(`https://api.tosspayments.com/v1/billing/authorizations/${authKey}`, {
    method: "post",
    body: JSON.stringify({
      customerKey: customerKey,
    }),
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${config.tossBilling.basicKey}`,
    },
  })
    .then((res) => res.json())
    .then(async (data) => {
      const amountCheck = await paidAmountCheck(req.session.userid, 4900);
      if (amountCheck) {
        await knex("users")
          .update({ advancedBillingCode: data.billingKey })
          .where("userid", req.session.userid);
        const name = await knex("users")
          .select("nickname")
          .where("userid", req.session.userid);
        fetch(`https://api.tosspayments.com/v1/billing/${data.billingKey}`, {
          method: "post",
          body: JSON.stringify({
            amount: 4900,
            customerName: name[0].nickname,
            customerEmail: req.session.email,
            customerKey: customerKey,
            orderId: uuidv4(),
            orderName: "URLATE ADVANCED 구독",
            taxFreeAmount: 0,
          }),
          headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${config.tossBilling.basicKey}`,
          },
        })
          .then((res) => res.json())
          .then(async (data) => {
            if (data.status == "DONE") {
              const date = new Date();
              date.setMonth(date.getMonth() + 1);
              await knex("users")
                .update({
                  advanced: true,
                  advancedDate: new Date(),
                  advancedUpdatedDate: new Date(),
                  advancedExpireDate: date,
                  advancedType: "s",
                })
                .where("userid", req.session.userid);
              res.redirect(`${config.project.url}/storePurchased`);
            } else {
              res.redirect(`${config.project.url}/storeDenied?error=undefined`);
            }
          });
      } else {
        res.redirect(
          `${config.project.url}/storeDenied?error=Exceeding the payment limit for minors`
        );
      }
    });
});

app.put("/billing/cancel", async (req, res) => {
  if (!req.session.userid) {
    res
      .status(400)
      .json(
        createErrorResponse(
          "failed",
          "UserID Required",
          "UserID is required for this task."
        )
      );
    return;
  }

  const type = await knex("users")
    .select("advancedType")
    .where("userid", req.session.userid);
  if (type[0].advancedType == "s") {
    await knex("users")
      .update({
        advancedType: "c",
      })
      .where("userid", req.session.userid);
    res.status(200).json(createSuccessResponse("success"));
  } else {
    res
      .status(400)
      .json(
        createErrorResponse(
          "failed",
          "Not registered",
          "You are not registered to advanced."
        )
      );
  }
});

app.get("/store/fail", async (req: Request<{ message?: unknown }>, res) => {
  res.redirect(`${config.project.url}/storeDenied?error=${req.query.message}`);
});

app.post("/danal/complete", async (req, res) => {
  res.redirect(`${config.project.url}/authentication/success`);
});

app.post("/danal/final", (req, res) => {
  if (req.session.TID) {
    fetch(
      `https://uas.teledit.com/uas?TXTYPE=CONFIRM&TID=${req.session.TID}&IDENOPTION=1`
    )
      .then((res) => res.text())
      .then(async (e) => {
        const data = e.split("&");
        let adultCert = 0;
        const birthArr = data[5].split("=")[1].split("");
        birthArr.splice(4, 0, "-");
        birthArr.splice(7, 0, "-");
        const birth = birthArr.join("");
        if (new Date().getTime() - new Date(birth).getTime() >= 567648000000) {
          adultCert = 1;
        }
        const userData = await knex("users")
          .select("adultCert", "authentication")
          .where("userid", req.session.userid);
        if (userData[0].authentication == 1 && userData[0].adultCert == 0) {
          if (adultCert) {
            await knex("users")
              .update({
                adultCert: adultCert,
              })
              .where("userid", req.session.userid);
            res.status(200).json(createSuccessResponse("success"));
          } else {
            res
              .status(400)
              .json(
                createErrorResponse(
                  "failed",
                  "Adult credentials needed",
                  "Needs to authenticate with adult's ID."
                )
              );
          }
        } else {
          const results = await knex("users")
            .select("CI")
            .where("CI", data[3].split("=")[1]);
          if (!results[0]) {
            if (data[0].split("=")[1] == "0000") {
              await knex("users")
                .update({
                  authentication: 1,
                  name: data[4].split("=")[1],
                  birth: data[5].split("=")[1],
                  CI: data[3].split("=")[1],
                  DI: data[7].split("=")[1],
                  adultCert: adultCert,
                })
                .where("userid", req.session.userid);
              res.status(200).json(createSuccessResponse("success"));
            } else {
              res
                .status(400)
                .json(
                  createErrorResponse(
                    "failed",
                    "Authentication Failed",
                    data[1].split("=")[1]
                  )
                );
            }
          } else {
            res
              .status(400)
              .json(
                createErrorResponse(
                  "failed",
                  "Exist person",
                  "User credentials already exist on different account."
                )
              );
          }
        }
        delete req.session.TID;
      });
  } else {
    res
      .status(400)
      .json(createErrorResponse("failed", "Data format error", "TID required"));
  }
});

app.get("/danal/ready", async (req, res) => {
  fetch(
    `https://uas.teledit.com/uas?TXTYPE=ITEMSEND&CPID=${config.danal.CPID}&CPPWD=${config.danal.CPPWD}&SERVICE=UAS&AUTHTYPE=36&TARGETURL=${config.danal.targetUrl}&CPTITLE=URLATE`
  )
    .then((res) => res.text())
    .then((e) => {
      const data = e.split("&");
      if (data[0].split("=")[1] == "0000") {
        req.session.TID = data[2].split("=")[1];
        req.session.save(() => {
          res
            .status(200)
            .json({ status: "Success", TID: data[2].split("=")[1] });
        });
      } else {
        res
          .status(400)
          .json(
            createErrorResponse(
              "failed",
              "fetch failed",
              "fetch to ready server failed."
            )
          );
      }
    });
});

app.put("/coupon", async (req, res) => {
  if (!req.session.userid) {
    res
      .status(400)
      .json(
        createErrorResponse(
          "failed",
          "UserID Required",
          "UserID is required for this task."
        )
      );
    return;
  }
  try {
    const code = req.body.code;
    const couponArr = await knex("codes")
      .select("reward", "used", "usedUser")
      .where("code", code);
    if (couponArr.length != 1) {
      res
        .status(400)
        .json(
          createErrorResponse("failed", "Invalid code", "Invalid code sent.")
        );
      return;
    }
    const coupon = couponArr[0];
    if (coupon.used) {
      res
        .status(400)
        .json(
          createErrorResponse(
            "failed",
            "Used code",
            "The code sent has already been used."
          )
        );
      return;
    }
    const usedUser = JSON.parse(coupon.usedUser);
    if (usedUser.indexOf(req.session.userid) != -1) {
      res
        .status(400)
        .json(
          createErrorResponse(
            "failed",
            "Used code",
            "The code sent has already been used."
          )
        );
      return;
    }
    const reward = JSON.parse(coupon.reward);
    if (reward.type == "advanced") {
      let addM = 0;
      let addD = 0;
      if (reward.content.indexOf("M") != -1) {
        addM = Number(reward.content.split("M")[0]);
      } else {
        addD = Number(reward.content.split("D")[0]);
      }
      const statusArr = await knex("users")
        .select("advanced", "advancedExpireDate", "advancedType")
        .where("userid", req.session.userid);
      const status = statusArr[0];
      if (!status.advanced) {
        const date = new Date();
        date.setMonth(date.getMonth() + addM);
        date.setDate(date.getDate() + addD);
        await knex("users")
          .update({
            advanced: true,
            advancedDate: new Date(),
            advancedUpdatedDate: new Date(),
            advancedExpireDate: date,
            advancedType: "c",
          })
          .where("userid", req.session.userid);
      } else if (status.advancedType == "c") {
        const date = new Date(status.advancedExpireDate);
        date.setMonth(date.getMonth() + addM);
        date.setDate(date.getDate() + addD);
        await knex("users")
          .update({ advancedUpdatedDate: new Date(), advancedExpireDate: date })
          .where("userid", req.session.userid);
      } else {
        res
          .status(400)
          .json(
            createErrorResponse(
              "failed",
              "Already subscribed",
              "User is already subscribed to ADVANCED."
            )
          );
        return;
      }
    } else if (reward.type == "skin") {
      const statusArr = await knex("users")
        .select("skins")
        .where("userid", req.session.userid);
      const skins = JSON.parse(statusArr[0].skins);
      if (skins.indexOf(reward.content) != -1) {
        res
          .status(400)
          .json(
            createErrorResponse(
              "failed",
              "Already have",
              "User already has the skin."
            )
          );
        return;
      } else {
        skins.push(reward.content);
        await knex("users")
          .update({ skins: JSON.stringify(skins) })
          .where("userid", req.session.userid);
      }
    }
    if (!reward.nolimit) {
      await knex("codes").update({ used: 1 }).where("code", code);
    } else {
      usedUser.push(req.session.userid);
      await knex("codes")
        .update({ usedUser: JSON.stringify(usedUser) })
        .where("code", code);
    }
  } catch (e) {
    res
      .status(400)
      .json(createErrorResponse("failed", "Error occured while loading", e));
    return;
  }
  res.status(200).json(createSuccessResponse("success"));
});

app.get("/auth/logout", (req, res) => {
  delete req.session.authorized;
  delete req.session.accessToken;
  delete req.session.refreshToken;
  delete req.session.userid;
  delete req.session.tempName;
  delete req.session.email;
  delete req.session.vaildChecked;
  delete req.session.bag;
  req.session.save(() => {
    if (req.query.redirect == "true") {
      let adder = "";
      if (req.query.shutdowned == "true") adder = "/?shutdowned=true";
      res.redirect(config.project.url + adder);
    } else {
      res.status(200).json(createSuccessResponse("success"));
    }
  });
});

const advancedCancel = async () => {
  signale.start(`Advanced subscription canceling..`);
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() - 3);
  const results = await knex("users")
    .select("settings", "userid")
    .where("advanced", true)
    .where("advancedExpireDate", "<", maxDate);
  let successCount = 0;
  for (const rst of results) {
    const setting = JSON.parse(rst.settings);
    if (setting.sound.res == "192kbps") {
      setting.sound.res = "128kbps";
    }
    setting.game.judgeSkin = true;
    setting.game.applyJudge = {
      Perfect: false,
      Great: false,
      Good: false,
      Bad: false,
      Miss: false,
      Bullet: false,
    };
    await knex("users")
      .update({
        settings: JSON.stringify(setting),
        advanced: false,
        advancedUpdatedDate: new Date(),
        advancedType: "",
        advancedBillingCode: "",
      })
      .where("userid", rst.userid);
    successCount++;
  }
  setTimeout(() => {
    signale.complete(`Advanced subscription canceled : ${successCount}`);
  }, 5000);
};

const advancedUpdate = async () => {
  console.log("");
  signale.start(`Advanced subscription updating..`);
  const maxDate = new Date();
  const minDate = new Date();
  minDate.setDate(minDate.getDate() - 3);
  const results = await knex("users")
    .select(
      "userid",
      "nickname",
      "email",
      "advancedBillingCode",
      "advancedType"
    )
    .where("advanced", true)
    .where("advancedExpireDate", "<=", maxDate)
    .where("advancedExpireDate", ">=", minDate);
  let successCount = 0;
  let failCount = 0;
  for (let i = 0; i < results.length; i++) {
    const rst = results[i];
    if (rst.advancedType == "s") {
      const amountCheck = await paidAmountCheck(rst.userid, 4900);
      if (amountCheck) {
        fetch(
          `https://api.tosspayments.com/v1/billing/${rst.advancedBillingCode}`,
          {
            method: "post",
            body: JSON.stringify({
              amount: 4900,
              customerName: rst.nickname,
              customerEmail: rst.email,
              customerKey: rst.userid,
              orderId: uuidv4(),
              orderName: "URLATE ADVANCED 구독",
              taxFreeAmount: 0,
            }),
            headers: {
              "Content-Type": "application/json",
              Authorization: `Basic ${config.tossBilling.basicKey}`,
            },
          }
        )
          .then((res) => res.json())
          .then(async (data) => {
            if (data.status == "DONE") {
              const date = new Date();
              date.setMonth(date.getMonth() + 1);
              await knex("users")
                .update({
                  advancedUpdatedDate: new Date(),
                  advancedExpireDate: date,
                })
                .where("userid", rst.userid);
              successCount++;
            } else {
              failCount++;
            }
          });
      } else {
        failCount++;
      }
    }
  }
  setTimeout(advancedUpdate, 3600000);
  setTimeout(() => {
    signale.complete(`Advanced subscription updated : ${successCount}`);
    signale.warn(`Advanced subscription update failed : ${failCount}`);
    advancedCancel();
  }, 5000);
};
setTimeout(advancedUpdate, 1000);

const songCountUp = async (track) => {
  const result = await knex("trackCount").select("count").where("name", track);
  if (!result.length) {
    await knex("trackCount").insert({
      name: track,
      count: 1,
    });
  } else {
    await knex("trackCount")
      .update({
        count: Number(result[0].count) + 1,
      })
      .where("name", track);
  }
};

const paidAmountCheck = async (uid, amount) => {
  const d = new Date();
  const result = await knex("users")
    .select("paid", "birth", "paidDate")
    .where("userid", uid);
  const paidDate = new Date(result[0].paidDate);
  let paid = Number(result[0].paid);
  amount = Number(amount);
  if (
    paidDate.getMonth() != d.getMonth() &&
    paidDate.getFullYear() != d.getFullYear()
  ) {
    paid = 0;
  }
  if (d.getTime() - new Date(result[0].birth).getTime() <= 599184000000) {
    if (paid + amount > 70000) {
      return false;
    }
  }
  await knex("users")
    .update({
      paid: paid + amount,
      paidDate: d,
    })
    .where("userid", uid);
  return true;
};

app.listen(config.project.port, () => {
  signale.success(`API Server running at port ${config.project.port}.`);
});
