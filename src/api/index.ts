import bodyParser = require('body-parser');
import cookieParser = require('cookie-parser');
import signale = require('signale');
import http = require('http');
import express = require('express');
import session = require('express-session');
import fetch = require('node-fetch');
import sha1 = require('sha1');
const MySQLStore = require('express-mysql-session')(session);
const hasher = require("pbkdf2-password")();

const config = require(__dirname + '/../../config/config.json');
const settingsConfig = require(__dirname + '/../../config/settings.json');

const { google } = require('googleapis');
const OAuth2 = google.auth.OAuth2;
const plus = google.plus('v1');

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

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

const getOAuthClient = (ClientId, ClientSecret, RedirectionUrl) => new OAuth2(ClientId, ClientSecret, RedirectionUrl);

app.get('/', (req, res) => {
  res.end('Welcome to MyRhy API!');
});

app.post('/', (req, res) => {
  res.end('Welcome to MyRhy API!');
});

app.get('/getStatus', async (req, res) => {
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

  res.status(200).json(createStatusResponse('logined'));
});

app.post('/login', (req, res) => {
  var oauth2Client = getOAuthClient(req.body.ClientId, req.body.ClientSecret, req.body.RedirectionUrl);
  oauth2Client.getToken(req.body.code, (err, tokens) => {
    if (err) {
      res.status(400).json(createErrorResponse('failed', err.response.data.error, err.response.data.error_description));
      return;
    }

    const { access_token, refresh_token } = tokens
    oauth2Client.setCredentials({ access_token, refresh_token });
    plus.people.get({ userId: 'me', auth: oauth2Client }, (err, response) => {
      req.session.userid = response.data.id;
      req.session.email = response.data.emails[0].value;
      req.session.tempName = response.data.displayName;
      req.session.accessToken = access_token;
      req.session.refreshToken = refresh_token;
      req.session.save(() => {
        res.status(200).json(createSuccessResponse('success'));
      });
    });
  });
});

app.post("/join", async (req, res) => {
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
        skins: JSON.stringify({
          "skins": ["Default"]
        })
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
app.post("/authorize", async (req, res) => {
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

app.get("/getUser", async (req, res) => {
  if(!req.session.userid) {
    res.status(400).json(createErrorResponse('failed', 'UserID Required', 'UserID is required for this task.'));
    return;
  }

  const results = await knex('users').select('nickname', 'settings', 'skins', 'advanced').where('userid', req.session.userid)
  if (!results.length) {
    res.status(400).json(createErrorResponse('failed', 'Failed to Load', 'Failed to load settings. Use /getStatus to check your status.'));
    return;
  }
  
  const { settings, nickname, advanced, skins } = results[0];
  res.status(200).json({result: "success", settings, nickname, userid: req.session.userid, advanced, skins});
});

app.get("/getTracks", async (req, res) => {
  const results = await knex('tracks').select('name', 'fileName', 'producer', 'bpm')
  if (!results.length) {
    res.status(400).json(createErrorResponse('failed', 'Failed to Load', 'Failed to load tracks. It may be a problem with the DB.'));
    return;
  }
  
  res.status(200).json({result: "success", tracks: results});
});

app.post('/xsolla/getToken', (req, res) => {
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
            "mode": "sandbox" //NEED TO DELETE ON RELEASE
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
    });
  }
});

app.post('/xsolla/webhook', async (req, res) => {
  if(req.headers.authorization == `Signature ${sha1(JSON.stringify(req.body) + config.xsolla.projectKey)}`) {
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
        console.log('payment');
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
        console.log('refund');
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

app.get('/logout', (req, res) => {
  delete req.session.authorized;
  delete req.session.accessToken;
  delete req.session.refreshToken;
  delete req.session.userid;
  delete req.session.tempName;
  delete req.session.email;
  delete req.session.vaildChecked;
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
