import cookieParser = require('cookie-parser');
import signale = require('signale');
import http = require('http');
import express = require('express');
import session = require('express-session');
import fetch = require('node-fetch');
import sha1 = require('sha1');
import redis = require('redis');
const MySQLStore = require('express-mysql-session')(session);
const hasher = require("pbkdf2-password")();

const redisClient = redis.createClient();

const config = require(__dirname + '/../../config/config.json');
const settingsConfig = require(__dirname + '/../../config/settings.json');

const { google } = require('googleapis');
const OAuth2 = google.auth.OAuth2;
const plus = google.plus('v1');

let whitelist = 'bjgumsun@gmail.com, kyungblog@gmail.com, bjgumsun@dimigo.hs.kr, pop06296347@gmail.com, combbm@gmail.com, jeongjy0317@gmail.com';

import { createSuccessResponse, createErrorResponse, createStatusResponse } from './api-response';

const app = express();
app.locals.pretty = true;

const knex = require('knex')({
  client: 'mysql',
  connection: {
    host: config.database.host,
    user: config.database.user,
    password: config.database.password,
    database: config.database.db
  }
});

const sessionStore = new MySQLStore({
  host: config.database.host,
  port: config.database.port,
  user: config.database.user,
  password: config.database.password,
  database: config.database.db
});

app.use(session({
  key: config.session.key,
  secret: config.session.secret,
  store: sessionStore,
  resave: config.session.resave,
  saveUninitialized: config.session.saveUninitialized
}));

app.use(express.json());
app.use(cookieParser());

const getOAuthClient = (ClientId, ClientSecret, RedirectionUrl) => new OAuth2(ClientId, ClientSecret, RedirectionUrl);

redisClient.on("error", function(error) {
  signale.error(error);
});

app.get('/', (req, res) => {
  res.end('Welcome to URLATE API!');
});

app.post('/', (req, res) => {
  res.end('Welcome to URLATE API!');
});

app.get('/auth/status', async (req, res) => {
  const hasToken = req.session.accessToken && req.session.refreshToken;
  if (!hasToken) {
    res.status(200).json(createStatusResponse('Not logined'));
    return;
  }

  const results = await knex('users').select('userid', 'nickname').where('userid', req.session.userid)
  if (!results[0]) {
    res.status(200).json(createStatusResponse('Not registered'));
    return;
  }

  if(!req.session.authorized) {
    res.status(200).json(createStatusResponse('Not authorized'));
    return;
  }

  res.status(200).json(createStatusResponse('Logined'));
});

app.post('/auth/login', (req, res) => {
  var oauth2Client = getOAuthClient(req.body.ClientId, req.body.ClientSecret, req.body.RedirectionUrl);
  oauth2Client.getToken(req.body.code, (err, tokens) => {
    if (err) {
      res.status(400).json(createErrorResponse('failed', err.response.data.error, err.response.data.error_description));
      return;
    }

    const { access_token, refresh_token } = tokens
    oauth2Client.setCredentials({ access_token, refresh_token });
    plus.people.get({ userId: 'me', auth: oauth2Client }, (err, response) => {
      if(whitelist.indexOf(response.data.emails[0].value) != -1) {
        req.session.userid = response.data.id;
        req.session.email = response.data.emails[0].value;
        req.session.tempName = response.data.displayName;
        req.session.accessToken = access_token;
        req.session.refreshToken = refresh_token;
        req.session.save(() => {
          res.status(200).json(createSuccessResponse('success'));
        });
      } else {
        signale.debug(new Date());
        signale.debug(`User login blocked by whitelist : ${response.data.emails[0].value}`);
        res.status(400).json(createErrorResponse('failed', 'Not Whitelisted', 'Provided email is not whitelisted.'));
      }
    });
  });
});

app.post("/auth/join", async (req, res) => {
  const hasToken = req.session.tempName && req.session.accessToken && req.session.refreshToken
  if (!hasToken) {
    res.status(400).json(createErrorResponse('failed', 'Wrong Request', 'You need to login first.'));
    return;
  }

  const namePattern = /^[a-zA-Z0-9_-]{5,12}$/;
  const passPattern = /^[0-9]{4,6}$/;
  const isValidated = namePattern.test(req.body.displayName) && passPattern.test(req.body.secondaryPassword);
  if (!isValidated) {
    res.status(400).json(createErrorResponse('failed', 'Wrong Format', 'Wrong name OR password format.'));
    return;
  }

  const results = await knex('users').select('nickname').where('nickname', req.body.displayName);
  if (!results[0]) {
    hasher({
      password: req.body.secondaryPassword
    }, async (err, pass, salt, hash) => {
      await knex('users').insert({
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
        DLCs: '[]'
      });
      delete req.session.tempName;
      req.session.save(() => {
        res.status(200).json(createSuccessResponse('success'));
      });
    });
  } else {
    res.status(400).json(createErrorResponse('failed', 'Exist Name', 'The name sent already exists.'));
  }
});

const passwordPattern = /^[0-9]{4,6}$/;
app.post("/auth/authorize", async (req, res) => {
  if (!passwordPattern.test(req.body.secondaryPassword)) {
    res.status(400).json(createErrorResponse('failed', 'Wrong Format', 'Wrong password format.'));
    return;
  }
  const results = await knex('users').select('secondary', 'salt').where('userid', req.session.userid);
    
  hasher({
    password: req.body.secondaryPassword,
    salt: results[0].salt
  }, (err, pass, salt, hash) => {
    if(hash !== results[0].secondary) {
      res.status(400).json(createErrorResponse('failed', 'Wrong Password', 'User entered wrong password.'));
      return;
    }

    req.session.authorized = true;
    req.session.save(() => {
      res.status(200).json(createSuccessResponse('success'));
    });
  });
});

app.get("/user", async (req, res) => {
  if(!req.session.userid) {
    res.status(400).json(createErrorResponse('failed', 'UserID Required', 'UserID is required for this task.'));
    return;
  }

  const results = await knex('users').select('nickname', 'settings', 'skins', 'advanced', 'DLCs').where('userid', req.session.userid)
  if (!results.length) {
    res.status(400).json(createErrorResponse('failed', 'Failed to Load', 'Failed to load data. Use /auth/status to check your status.'));
    return;
  }
  
  res.status(200).json({result: "success", user: results[0]});
});

app.get("/tracks", async (req, res) => {
  const results = await knex('tracks').select('name', 'fileName', 'producer', 'bpm', 'difficulty', 'originalName', 'type')
  if (!results.length) {
    res.status(400).json(createErrorResponse('failed', 'Failed to Load', 'Failed to load tracks. It may be a problem with the DB.'));
    return;
  }
  
  res.status(200).json({result: "success", tracks: results});
});

app.get("/track/:name", async (req, res) => {
  const results = await knex('tracks').select('name', 'fileName', 'producer', 'bpm', 'difficulty', 'originalName', 'type').where('name', req.params.name);
  if (!results.length) {
    res.status(400).json(createErrorResponse('failed', 'Failed to Load', 'Failed to load track. It may be a problem with the DB.'));
    return;
  }
  
  res.status(200).json({result: "success", track: results});
});

app.get("/trackInfo/:name", async (req, res) => {
  const results = await knex('patternInfo').select('bpm', 'bullet_density', 'note_density', 'speed').where('name', req.params.name);
  if (!results.length) {
    res.status(400).json(createErrorResponse('failed', 'Failed to Load', 'Failed to load track data. It may be a problem with the DB.'));
    return;
  }
  
  res.status(200).json({result: "success", info: results});
});

app.post('/xsolla/token', (req, res) => {
  if(req.body.type == 'advanced') {
    fetch(`https://api.xsolla.com/merchant/v2/merchants/${config.xsolla.merchantId}/token`, {
        method: 'post',
        body: JSON.stringify({
          "user": {
            "id": {
              "value": req.session.userid
            },
            "email": {
              "value": req.session.email
            }
          },
          "settings": {
            "project_id": config.xsolla.projectId,
            "mode": "sandbox" //TODO: NEED TO DELETE ON RELEASE
          }
        }),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${config.xsolla.basicKey}`
        },
    })
    .then(res => res.json())
    .then(json => {
      res.status(200).json({result: "success", token: json.token});
    }).catch((error) => {
      res.status(400).json(createErrorResponse('failed', 'Failed to Load', 'Failed to load token. It may be a problem with xsolla.'));
    });
    return;
  }
  res.status(400).json(createErrorResponse('failed', 'Wrong access', 'You accessed the wrong address.'));
});

app.post('/xsolla/webhook', async (req, res) => {
  if(req.headers.authorization == `Signature ${sha1(JSON.stringify(req.body) + config.xsolla.projectKey)}`) {
    console.log(req.body.notification_type);
    switch(req.body.notification_type) {
      case 'user_validation':
        const result = await knex('users').select('userid').where('userid', req.body.user.id);
        if(result[0] && req.body.settings.project_id == config.xsolla.projectId && req.body.settings.merchant_id == config.xsolla.merchantId) {
          res.end();
          return;
        }
        res.status(400).json({"error": {
          "code": "INVALID_USER",
          "message": "Invalid user"
        }});
        return;
      case 'payment':
        if(!req.body.purchase.subscription) {
          redisClient.get(`Cart${req.body.user.id}`, async (err, reply) => {
            let cart = JSON.parse(reply);
            let saved = await knex('users').select('skins', 'DLCs').where('userid', req.body.user.id);
            let DLCs = new Set(JSON.parse(saved[0]['DLCs']));
            let skins = new Set(JSON.parse(saved[0]['skins']));
            for(let i = 0; i < cart.length; i++) {
              if(cart[i].type == 'DLC') {
                DLCs.add(cart[i].item);
              } else if(cart[i].type == 'Skin') {
                skins.add(cart[i].item);
              }
            }
            delete req.session.bag;
            await knex('users').update({'skins': JSON.stringify(Array.from(skins)), 'DLCs': JSON.stringify(Array.from(DLCs))}).where('userid', req.body.user.id);
          });
        }
        break;
      case 'create_subscription':
        await knex('users').update({'advanced': true, 'advancedDate': new Date(), 'advancedUpdatedDate': new Date()}).where('userid', req.body.user.id);
        break;
      case 'update_subscription':
        await knex('users').update({'advancedUpdatedDate': new Date()}).where('userid', req.body.user.id);
        break;
      case 'cancel_subscription':
        await knex('users').update({'advanced': false, 'advancedUpdatedDate': new Date()}).where('userid', req.body.user.id);
        break;
      case 'refund':
      if(!req.body.purchase.subscription) {
        console.log('refund success');
      }
      break;
    }
  } else {
    res.status(400).json({"error": {
      "code": "INVALID_SIGNATURE",
      "message": "Invaild signature"
    }});
    return;
  }
  res.end();
});

app.put('/settings', async (req, res) => {
  if(!req.session.userid) {
    res.status(400).json(createErrorResponse('failed', 'UserID Required', 'UserID is required for this task.'));
    return;
  }
  try {
    let settings = req.body.settings;
    if(settings.sound.res == "192kbps" ||
    !settings.game.judgeSkin ||
    JSON.stringify(settings.game.applyJudge) != `{"Perfect":false,"Great":false,"Good":false,"Bad":false,"Miss":false,"Bullet":false}`) {
      const advanced = await knex('users').select('advanced').where('userid', req.session.userid);
      if(!advanced[0].advanced) {
        res.status(400).json(createErrorResponse('failed', 'Error occured while updating', 'wrong request'));
        return;
      }
    }
    await knex('users').update({'settings': JSON.stringify(req.body.settings)}).where('userid', req.session.userid);
  } catch(e) {
    res.status(400).json(createErrorResponse('failed', 'Error occured while updating', e));
    return;
  }
  res.status(200).json(createSuccessResponse('success'));
});

app.get("/skin/:skinName", async (req, res) => {
  const results = await knex('skins').select('data').where('name', req.params.skinName);
  if (!results.length) {
    res.status(400).json(createErrorResponse('failed', 'Failed to Load', 'Failed to load skin data.'));
    return;
  }
  res.status(200).json({result: "success", data: results[0].data});
});

app.get("/teamProfile/:name", async (req, res) => {
  const results = await knex('teamProfiles').select('data').where('name', req.params.name);
  if (!results.length) {
    res.status(400).json(createErrorResponse('failed', 'Failed to Load', 'Failed to load data.'));
    return;
  }
  res.status(200).json({result: "success", data: results[0].data});
});

app.get("/record/:track/:name", async (req, res) => {
  const results = await knex('trackRecords').select('rank', 'record', 'maxcombo', 'medal').where('nickname', req.params.name).where('name', req.params.track).orderBy('difficulty', 'ASC');
  if (!results.length) {
    res.status(200).json(createSuccessResponse('empty'));
    return;
  }
  res.status(200).json({result: "success", results});
});

app.get("/records/:track/:difficulty/:order/:sort/:nickname", async (req, res) => {
  const results = await knex('trackRecords').select('rank', 'record', 'maxcombo', 'nickname').where('name', req.params.track).where('difficulty', req.params.difficulty).orderBy(req.params.order, req.params.sort);
  const rank = results.map(d => {return d['nickname']}).indexOf(req.params.nickname) + 1;
  res.status(200).json({result: "success", results: results.slice(0, 100), rank: rank});
});

app.get("/store/DLCs", async (req, res) => {
  const results = await knex('storeDLC').select('name', 'previewFile', 'price', 'composer', 'songs');
  if (!results.length) {
    res.status(400).json(createErrorResponse('failed', 'Failed to Load', 'Failed to load DLC data.'));
    return;
  }
  res.status(200).json({result: "success", data: results});
});

app.get("/store/DLC/:name", async (req, res) => {
  const results = await knex('storeDLC').select('name', 'previewFile', 'price', 'composer', 'songs').where('name', req.params.name);
  if (!results.length) {
    res.status(400).json(createErrorResponse('failed', 'Failed to Load', 'Failed to load DLC data.'));
    return;
  }
  res.status(200).json({result: "success", data: results[0]});
});

app.get("/store/skins", async (req, res) => {
  const results = await knex('storeSkin').select('name', 'previewFile', 'price');
  if (!results.length) {
    res.status(400).json(createErrorResponse('failed', 'Failed to Load', 'Failed to load Skin data.'));
    return;
  }
  res.status(200).json({result: "success", data: results});
});

app.get("/store/skin/:name", async (req, res) => {
  const results = await knex('storeSkin').select('name', 'previewFile', 'price').where('name', req.params.name);
  if (!results.length) {
    res.status(400).json(createErrorResponse('failed', 'Failed to Load', 'Failed to load Skin data.'));
    return;
  }
  res.status(200).json({result: "success", data: results[0]});
});

app.post("/store/bag", (req, res) => {
  if(req.body.type == 'DLC' || req.body.type == 'Skin') {
    if(req.session.bag) {
      if(req.session.bag.map(i => JSON.stringify(i)).indexOf(JSON.stringify(req.body)) != -1) {
        res.status(400).json(createErrorResponse('failed', 'Wrong request', `Item ${req.body.type} already exist.`));
        return;
      } else {
        req.session.bag.push(req.body);
      }
    } else {
      req.session.bag = [req.body];
    }
  } else {
    res.status(400).json(createErrorResponse('failed', 'Wrong request', `Item type ${req.body.type} doesn't exist.`));
    return;
  }
  req.session.save(() => {
    res.status(200).json({result: "success", bag: req.session.bag});
  });
});

app.get("/store/bag", (req, res) => {
  if(req.session.bag) {
    res.status(200).json({result: "success", bag: req.session.bag});
  } else {
    res.status(200).json({result: "success", bag: []});
  }
});

app.delete("/store/bag", (req, res) => {
  if(req.session.bag && req.session.bag != []) {
    let index = req.session.bag.map(i => JSON.stringify(i)).indexOf(JSON.stringify(req.body));
    if(index != -1) {
      req.session.bag.splice(index, 1);
      req.session.save(() => {
        res.status(200).json({result: "success", bag: req.session.bag});
      });
    } else {
      res.status(400).json(createErrorResponse('failed', 'Wrong request', `Item ${req.body.type} doesn't exist.`));
    }
  } else {
    res.status(400).json(createErrorResponse('failed', 'Bag empty', 'Bag is empty.'));
  }
});

app.post("/store/purchase/:lang", async (req, res) => {
  let currency = ["KRW", "JPY", "USD"];
  let cart = req.body.cart;
  redisClient.set(`Cart${req.session.userid}`, JSON.stringify(cart));
  let price = 0;
  let langCode = Number(req.params.lang);
  let isAdvanced = await knex('user').select('advanced').where('userid', req.session.userid);
  isAdvanced = isAdvanced[0].advanced;
  for(let i = 0; i < cart.length; i++) {
    const result = await knex(`store${cart[i].type}`).select('price').where('name', cart[i].item);
    let add = JSON.parse(result[0].price)[langCode];
    price += add - add * 0.2 * isAdvanced;
  }
  if(req.params.lang < 2) {
    fetch(`https://api.xsolla.com/merchant/v2/merchants/${config.xsolla.merchantId}/token`, {
        method: 'post',
        body: JSON.stringify({
          "user": {
            "id": {
              "value": req.session.userid
            },
            "email": {
              "value": req.session.email
            }
          },
          "purchase": {
            "checkout": {
              "amount": price,
              "currency": currency[langCode]
            }
          },
          "settings": {
            "project_id": config.xsolla.projectId,
            "mode": "sandbox" //TODO: NEED TO DELETE ON RELEASE
          }
        }),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${config.xsolla.basicKey}`
        },
    })
    .then(res => res.json())
    .then(json => {
      res.status(200).json({result: "success", token: json.token});
    }).catch((error) => {
      res.status(400).json(createErrorResponse('failed', 'Failed to Load', 'Failed to load token. It may be a problem with xsolla.'));
    });
  } else {
    res.status(400).json(createErrorResponse('failed', 'Wrong request', `Lang code ${req.params.lang} doesn't exist.`));
  }
});

app.get('/auth/logout', (req, res) => {
  delete req.session.authorized;
  delete req.session.accessToken;
  delete req.session.refreshToken;
  delete req.session.userid;
  delete req.session.tempName;
  delete req.session.email;
  delete req.session.vaildChecked;
  delete req.session.bag;
  req.session.save(() => {
    if(req.query.redirect == 'true') {
      res.redirect("https://rhyga.me");
    } else {
      res.status(200).json(createSuccessResponse('success'));
    }
  });
});

const PORT = 1024;
http.createServer(app).listen(PORT, () => {
  signale.success(`API Server running at port ${PORT}.`);
});
