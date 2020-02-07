const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const signale = require('signale');
const http = require('http');
const express = require('express');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const hasher = require("pbkdf2-password")();
const mariadb = require('mariadb');

const config = require(__dirname + '/../../config/config.json');

const settingsConfig = require(__dirname + '/../../config/settings.json');

const {google} = require('googleapis');
const OAuth2 = google.auth.OAuth2;
const plus = google.plus('v1');

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

function getOAuthClient(ClientId, ClientSecret, RedirectionUrl) {
  return new OAuth2(ClientId, ClientSecret, RedirectionUrl);
}

app.get('/', (req, res) => {
  res.end('Welcome to MyRhy API!');
});

app.post('/', (req, res) => {
  res.end('Welcome to MyRhy API!');
});

app.get('/vaildCheck', (req, res) => {
  console.log(req.session);
  if(req.session.accessToken && req.session.refreshToken) {
    pool.getConnection()
      .then(conn => {
        conn.query(`USE myrhyservicedb`)
          .then(() => {
            return conn.query(`SELECT userid, nickname, settings FROM users WHERE userid = ${req.session.userid}`);
          })
          .then((results) => {
            if(results[0] != undefined) {
              if(req.session.accessToken && req.session.refreshToken && req.session.authorized) {
                res.end('{"result": "logined"}');
              } else {
                res.end('{"result": "Not authorized"}');
              }
            } else {
              res.end(`{"result": "Not registered"}`);
            }
            conn.release();
          });
        });
  } else {
    res.end('{"result": "Not logined"}');
  }
});

app.post('/login', (req, res) => {
  var oauth2Client = getOAuthClient(req.body.ClientId, req.body.ClientSecret, req.body.RedirectionUrl);
  oauth2Client.getToken(req.body.code, function(err, tokens) {
    if (!err) {
      oauth2Client.setCredentials({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token
      });
      plus.people.get({ userId: 'me', auth: oauth2Client }, function(err, response) {
        req.session.userid = response.data.id;
        req.session.tempEmail = response.data.emails[0].value;
        req.session.tempName = response.data.displayName;
        req.session.accessToken = tokens.access_token;
        req.session.refreshToken = tokens.refresh_token;
        req.session.save(() => {
          console.log(req.session);
          res.end('{"result": "logined"}');
        });
      });
    } else {
      res.end(`{"result": "failed", "error": "${err.response.data.error}", "error_description": "${err.response.data['error_description']}"}`);
    }
  });
});

app.post("/join", function(req, res) {
  const nameReg = /^[a-zA-Z0-9_-]{5,12}$/;
  const passReg = /^[0-9]{4,6}$/;
  if(req.session.tempName && req.session.accessToken && req.session.refreshToken) {
    if(nameReg.test(req.body.displayName) && passReg.test(req.body.secondaryPassword)) {
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
                req.session.save(() => {
                  res.end('{"result": "registered"}');
                  conn.release();
                });
              });
            });
      });
    } else {
      res.end('{"result": "failed", "error": "Wrong Format", "error_description": "Wrong name OR password format."}');
    }
  } else {
    res.end('{"result": "failed", "error": "Wrong Request", "error_description": "You need to login first."}');
  }
});

app.post("/authorize", function(req, res) {
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
                  res.end('{"result": "authorized"}');
                } else {
                  res.end('{"result": "failed", "error" : "Wrong Password"}');
                }
              });
            });
          });
  } else {
    res.end('{"result": "failed", "error": "Wrong Format", "error_description": "Wrong password format."}');
  }
});

app.get("/getSettings", function(req, res) {
  if(req.session.userid) {
    pool.getConnection()
    .then(conn => {
      conn.query(`USE myrhyservicedb`)
        .then(() => {
          return conn.query(`SELECT userid, nickname, settings FROM users WHERE userid = ${req.session.userid}`);
        })
        .then((results) => {
          if(results[0] !== undefined) {
            res.end(`{"result": "loaded", "settings": ${results[0].settings}`);
          } else {
            res.end('{"result": "failed", "error": "Load Failed", "error_description": "Failed to load settings. Maybe wrong userid?');
          }
          conn.release();
        });
    });
  } else {
    res.end('{"result": "failed", "error": "UserID Required", "error_description": "UserID is required for this task.');
  }
});

app.get('/logout', (req, res) => {
  delete req.session.authorized;
  delete req.session.accessToken;
  delete req.session.refreshToken;
  delete req.session.userid;
  delete req.session.tempName;
  delete req.session.tempEmail;
  delete req.session.vaildChecked;
  req.session.save(() => {
    res.end('{"result": "success"}');
  });
});

http.createServer(app).listen(port, () => {
  signale.success(`API Server running at port ${port}.`);
});