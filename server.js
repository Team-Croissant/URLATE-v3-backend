//라이브러리
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const signale = require('signale');
const fs = require('fs'),
    http = require('http'),
    https = require('https'),
    express = require('express');
const session = require('express-session');
const OrientDB = require("orientjs");
const OrientoStore = require('connect-oriento')(session);
const hasher = require("pbkdf2-password")();
const app = express();
const i18n = require('./i18n');

//config 파일
const config = require('./config/config.json');

//settings 기본값 파일
const settingsConfig = require('./config/settings.json');

//https 인증서
const privateKey = fs.readFileSync(config.keys.key, 'utf8');
const certificate = fs.readFileSync(config.keys.crt, 'utf8');

//google API 정의
const {google} = require('googleapis');
const plus = google.plus('v1');
const OAuth2 = google.auth.OAuth2;
const ClientId = config.google.clientId;
const ClientSecret = config.google.clientSecret;
const RedirectionUrl = "https://rhyga.me";

//OrientDB 상세설정
const server = OrientDB({
  host:config.orient.host,
  port:config.orient.port,
  username:config.orient.username,
  password:config.orient.password
});

const db = server.use(config.orient.db);

//express 상세설정
app.locals.pretty = true;
const port = 80;
const httpsPort = 443;

app.use(session({
   secret: config.app_pw.secret,
   resave: config.app_pw.resave,
   saveUninitialized: config.app_pw.saveUninitialized,
   store: new OrientoStore({
     server: config.store.server
   })
}));

app.set('view engine', 'ejs');
app.set('views', './views');
app.use(express.static('views'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(i18n); //다국어 지원 라이브러리

//google API 함수 정의
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

//express 웹서버
//index GET
app.get('/', function(req, res){
  if(req.session.accessToken && req.session.refreshToken) {
    res.redirect('/game');
  } else {
    res.render('index');
  }
});
//영문 전환 GET
app.get('/en', function(req, res) {
  res.cookie('lang', 'en');
  res.redirect('/');
});
//한글 전환 GET
app.get('/ko', function(req, res) {
  res.cookie('lang', 'ko');
  res.redirect('/');
});
//로그인 POST
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
        plus.people.get({ userId: 'me', auth: oauth2Client }, function(err, response) {
          res.end('{"msg": "success"}');
        });
      } else {
        res.end('{"msg": "fail"}');
      }
  });
});
//game GET
app.get("/game", function(req, res) {
  var oauth2Client = getOAuthClient();
  oauth2Client.setCredentials({
    access_token: req.session.accessToken,
    refresh_token: req.session.refreshToken
  });
  plus.people.get({ userId: 'me', auth: oauth2Client }, function(err, response) {
    if(err) {
      res.render('accessDenined');
    } else {
      req.session.userid = response.data.id;
      db.query("select from User where userid = :id", {params: { id: response.data.id }})
      .all()
      .then((results)=> {
        if(Object.keys(results).length !== 0) {
          if(req.session.authorized) {
            if(response.data.id == results[0].userid) {
              res.render('game', { name : results[0].nickname, id : response.data.id, settings : JSON.stringify(results[0].settings) });
            }
          } else {
              res.redirect('/authorize');
          }
        } else {
          req.session.tempEmail = response.data.emails[0].value;
          req.session.tempName = response.data.displayName;
          res.redirect('/join');
        }
      });
    }
  });
});
//회원가입 GET
app.get("/join", function(req, res) {
  if(req.session.tempName) {
    res.render('join', { name : req.session.tempName });
  } else {
    res.render('accessDenined');
  }
});
//회원가입 POST
app.post("/join", function(req, res) {
  const nameReg = /^[a-zA-Z0-9_-]{5,12}$/;
  const passReg = /^[0-9]{4,6}$/;
  if(req.session.tempName && req.session.accessToken && req.session.refreshToken && nameReg.test(req.body.displayName) && passReg.test(req.body.secondaryPassword)) {
    db.class.get('User').then(function(user){
      hasher({password:req.body.secondaryPassword}, (err, pass, salt, hash) => {
        user.create({
          userid : req.session.userid,
          salt : salt,
          secondary : hash,
          date : new Date(),
          nickname : req.body.displayName,
          email : req.session.tempEmail,
          settings : settingsConfig
        }).then(() => {
          delete req.session.tempName;
          delete req.session.tempEmail;
          res.redirect("/authorize");
        });
      });
    });
  } else {
    res.render('accessDenined');
  }
});
//2차 비밀번호 인증 GET
app.get("/authorize", function(req, res) {
  if(req.session.accessToken && req.session.refreshToken && req.session.userid) {
    if(req.session.authorized) {
      res.redirect('/game');
    }
    if(req.query.status == 'fail') {
      res.render('authorizeFail')
    } else {
      res.render('authorize');
    }
  } else {
    res.render('accessDenined');
  }
});
//2차 비밀번호 인증 POST
app.post("/authorize", function(req, res) {
  const passReg = /^[0-9]{4,6}$/;
  if(passReg.test(req.body.secondaryPassword)) {
    db.query("select from User where userid = :id", {params: { id: req.session.userid }})
      .all()
      .then((results)=> {
          hasher({password:req.body.secondaryPassword, salt:results[0].salt}, (err, pass, salt, hash) => {
            if(hash == results[0].secondary) {
              req.session.authorized = true;
              res.redirect('/game');
            } else {
              res.redirect('/authorize?status=fail');
            }
          });
      });
  } else {
    res.render('accessDenined');
  }
});
//로그이웃 GET
app.get("/logout", function(req, res) {
  delete req.session.authorized;
  delete req.session.accessToken;
  delete req.session.refreshToken;
  delete req.session.userid;
  delete req.session.tempName;
  delete req.session.tempEmail;
  res.redirect('/');
});

//404페이지 설정
app.use(function(req, res, next) {
  res.status(404).render('404');
});


//서버 구동
http.createServer(function (req, res) {
    res.writeHead(301, { "Location": "https://rhyga.me" });
    res.end();
}).listen(port, function() {
  signale.success(`HTTP Server running at port ${port}.`);
});

https.createServer({
    key: privateKey,
    cert: certificate
}, app).listen(httpsPort, function() {
  signale.success(`HTTPS Server running at port ${httpsPort}.`);
});