//TODO: /game, /join frontEnd와 api분리

const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const signale = require('signale');
const fs = require('fs');
const http = require('http');
const https = require('https');
const express = require('express');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const hasher = require("pbkdf2-password")();
const i18n = require(__dirname + '/i18n');
const mariadb = require('mariadb');
const request = require('request');

const config = require(__dirname + '/../../config/config.json');

const settingsConfig = require(__dirname + '/../../config/settings.json');

const {google} = require('googleapis');
const plus = google.plus('v1');
const OAuth2 = google.auth.OAuth2;
const ClientId = config.google.clientId;
const ClientSecret = config.google.clientSecret;
const RedirectionUrl = config.project.url;

const app = express();
app.locals.pretty = true;
const port = 8080;

const pool = mariadb.createPool({host: config.maria.host, user: config.maria.user, password: config.maria.password, connectionLimit: 5});

const sessionStore = new MySQLStore({
  host: config.maria.host,
  port: config.maria.port,
  user: config.maria.user,
  password: config.maria.password,
  database: config.maria.db
});

app.use(session({
  key: config.session.key,
  secret: config.session.secret,
  store: sessionStore,
  resave: config.session.resave,
  saveUninitialized: config.session.saveUninitialized
}));

app.set('view engine', 'ejs');
app.set('views', __dirname + '/../../views');
app.use(express.static(__dirname + '/../../views'));
app.use(express.static(__dirname + '/../../public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(i18n);

process.env.Node_TLS_REJECT_UNAUTHORIZED = "0";

function getOAuthClient() {
  return new OAuth2(ClientId, ClientSecret, RedirectionUrl);
}

/* function getAuthUrl() {
  var oauth2Client = getOAuthClient();
  
  var scopes = [
      'https://www.googleapis.com/auth/plus.me'
  ];

  var url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes
  });

  return url;
} */

app.get('/', function(req, res){
  if(req.session.accessToken && req.session.refreshToken) {
    res.redirect('/game');
  } else {
    res.render('index', { url : config.project.url, api : config.project.api, communityUrl : config.project.communityUrl, miraiUrl : config.project.miraiUrl });
  }
});

app.get('/en', function(req, res) {
  res.cookie('lang', 'en');
  res.redirect('/');
});

app.get('/ko', function(req, res) {
  res.cookie('lang', 'ko');
  res.redirect('/');
});

app.get("/game", function(req, res) {
  var oauth2Client = getOAuthClient();
  oauth2Client.setCredentials({
    access_token: req.session.accessToken,
    refresh_token: req.session.refreshToken
  });
  plus.people.get({ userId: 'me', auth: oauth2Client }, function(err, response) {
    if(err) {
      res.render('accessDenined', { url : config.project.url });
    } else {
      req.session.userid = response.data.id;
      pool.getConnection()
        .then(conn => {
          conn.query(`USE myrhyservicedb`)
            .then(() => {
              return conn.query(`SELECT userid, nickname, settings FROM users WHERE userid = ${response.data.id}`);
            })
            .then((results) => {
              if(results[0] !== undefined) {
                if(req.session.authorized) {
                  if(response.data.id == results[0].userid) {
                    res.render('game', { name : results[0].nickname, id : response.data.id, settings : results[0].settings, cdnUrl : config.project.cdn, url : config.project.url });
                  }
                } else {
                    res.redirect('/authorize');
                }
              } else {
                req.session.tempEmail = response.data.emails[0].value;
                req.session.tempName = response.data.displayName;
                res.redirect('/join');
              }
              conn.release();
            });
      });
    }
  });
});

app.get("/join", function(req, res) {
  if(req.session.tempName) {
    res.render('join', { name : req.session.tempName, url : config.project.url });
  } else {
    res.render('accessDenined', { url : config.project.url });
  }
});

app.post("/join", function(req, res) {
  const nameReg = /^[a-zA-Z0-9_-]{5,12}$/;
  const passReg = /^[0-9]{4,6}$/;
  if(req.session.tempName && req.session.accessToken && req.session.refreshToken && nameReg.test(req.body.displayName) && passReg.test(req.body.secondaryPassword)) {
    hasher({password:req.body.secondaryPassword}, (err, pass, salt, hash) => {
      pool.getConnection()
        .then(conn => {
          conn.query(`USE myrhyservicedb`)
            .then(() => {
              return conn.query(`INSERT INTO users VALUES ("${req.body.displayName}", "${req.session.userid}", "${salt}", "${hash}", "${new Date()}", "${req.session.tempEmail}", '${JSON.stringify(settingsConfig)}')`);
            })
            .then((response) => {
              delete req.session.tempName;
              delete req.session.tempEmail;
              res.redirect("/authorize");
              conn.release();
            });
          });
    });
  } else {
    res.render('accessDenined', { url : config.project.url });
  }
});

app.get("/authorize", function(req, res) {
  request.post({
    url:'https://api.rhyga.me/authorize'
  },
  function(err, httpResponse, body) {
    if(JSON.parse(body).msg == 'authorized') {
      res.redirect('/game');
    } else if(JSON.parse(body).msg == 'vaild') {
      if(req.query.status == 'fail') {
        res.render('authorizeFail', { url : config.project.url, api : config.project.api })
      } else {
        res.render('authorize', { url : config.project.url, api : config.project.api });
      }
    } else if(JSON.parse(body).msg == 'invaild') {
      res.render('accessDenined', { url : config.project.url });
    }
  });
});

app.get("/accessDenined", function(req, res) {
  res.render('accessDenined', { url : config.project.url });
});

app.get("/logout", function(req, res) {
  res.redirect(`${config.project.api}/logout`);
});

app.use(function(req, res, next) {
  res.status(300).render('300', { url : config.project.url });
  res.status(400).render('400', { url : config.project.url });
  res.status(403).render('403', { url : config.project.url });
  res.status(404).render('404', { url : config.project.url });
  res.status(409).render('409', { url : config.project.url });
  res.status(500).render('500', { url : config.project.url });
});

http.createServer(app).listen(port, function() {
  signale.success(`HTTP Server running at port ${port}.`);
});