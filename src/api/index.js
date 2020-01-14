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
const mariadb = require('mariadb');

const config = require(__dirname + '/../../config/config.json');

const {google} = require('googleapis');
const plus = google.plus('v1');
const OAuth2 = google.auth.OAuth2;
const ClientId = config.google.clientId;
const ClientSecret = config.google.clientSecret;
const RedirectionUrl = config.project.url;

const app = express();
app.locals.pretty = true;
const port = 1024;

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

app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

function getOAuthClient() {
  return new OAuth2(ClientId, ClientSecret, RedirectionUrl);
}

app.get('/', function(req, res){
  res.send('Welcome to our API!');
});

app.post("/login", function(req, res) {
  var oauth2Client = getOAuthClient();
  var code = req.body.code;
  oauth2Client.getToken(code, function(err, tokens) {
      if (!err) {
        oauth2Client.setCredentials({
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token
        });
        req.session.accessToken = tokens.access_token;
        req.session.refreshToken = tokens.refresh_token;
        res.end('{"msg": "success"}');
      } else {
        res.end('{"msg": "fail"}');
      }
  });
});

app.post("/authorize", function(req, res) {
  if(req.session.accessToken && req.session.refreshToken && req.session.userid) {
    if(req.session.authorized) {
      res.end('{"msg": "authorized"}');
    } else {
      res.end('{"msg": "vaild"}');
    }
  } else {
    res.end('{"msg": "invaild"}');
  }
});

app.post("/authorizeCheck", function(req, res) {
  const passReg = /^[0-9]{4,6}$/;
  if(passReg.test(req.body.secondaryPassword)) {
    pool.getConnection()
        .then(conn => {
          conn.query(`USE myrhyservicedb`)
            .then(() => {
              return conn.query(`SELECT secondary, salt, userid FROM users WHERE userid = ${ req.session.userid }`);
            })
            .then((results)=> {
              hasher({password:req.body.secondaryPassword, salt:results[0].salt}, (err, pass, salt, hash) => {
                if(hash == results[0].secondary) {
                  req.session.authorized = true;
                  res.redirect(`${config.project.url}/game`);
                } else {
                  res.redirect(`${config.project.url}/authorize?status=fail`);
                }
              });
            });
          });
  } else {
    res.redirect(`${config.project.url}/accessDenined`);
  }
});

app.get("/logout", function(req, res) {
  delete req.session.authorized;
  delete req.session.accessToken;
  delete req.session.refreshToken;
  delete req.session.userid;
  delete req.session.tempName;
  delete req.session.tempEmail;
  res.redirect(config.project.url);
});

http.createServer(app).listen(port, function() {
  signale.success(`API Server running at port ${port}.`);
});