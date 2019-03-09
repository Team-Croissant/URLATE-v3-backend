const bodyParser = require('body-parser');
const signale = require('signale');
const fs = require('fs'),
    http = require('http'),
    https = require('https'),
    express = require('express');
const session = require('express-session');
const OrientDB = require('orientjs');
const bcrypt = require('bcrypt-nodejs');
const OrientoStore = require('connect-oriento')(session);
const config  = require('./config/config.json');
const bkfd2Password = require("pbkdf2-password");
const nodemailer = require('nodemailer');
const hasher = bkfd2Password();
const app = express();
app.locals.pretty = true;
const port = 80;
const httpsPort = 443;

const privateKey = fs.readFileSync('config/ssl/RWdSme569UCsFkURI5sOUg-key.pem', 'utf8');
const certificate = fs.readFileSync('config/ssl/RWdSme569UCsFkURI5sOUg-crt.pem', 'utf8');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'myrhydevelopteam@gmail.com',
    pass: config.orient.password
  }
});

const server = OrientDB({
   host:config.orient.host,
   port:config.orient.port,
   username:config.orient.username,
   password:config.orient.password
});

const db = server.use(config.orient.db);

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

app.get('/auth/logout', function(req, res){
  delete req.session.nickName;
  delete req.session.passWord;
  delete req.session.loginedSuccessfully;
  req.session.save(function(){
    res.redirect('/');
  });
});

app.get('/prototype', function(req, res){
  res.render('prototype');
});

app.get('/', function(req, res){
  signale.debug(req.session.nickName);
  signale.debug(req.session.UID);
  signale.debug(req.session.loginedSuccessfully);
  if(req.session.nickName && req.session.UID && req.session.loginedSuccessfully) {
    res.redirect('/game');
  } else {
    res.render('index');
  }
});

app.get('/ping', function(req, res){
  res.send("pong!");
});

app.post('/auth/login', function(req, res){
  req.session.cookie.maxAge = 3 * 24 * 60 * 60 * 1000;
  var users;
  db.class.get('user').then(function(user){
    var ULength;
    user.list().then(function(User){
      users = User;
      ULength = User.length;
      var passWord = req.body.verySecuredText;
      for(var i = 1; i < ULength; i++) {
        var userr = users[i];
        if(JSON.stringify(req.body.email).toLowerCase() == JSON.stringify(userr.email).toLowerCase()) {
          return hasher({password: passWord, salt: userr.salt}, function(err, pass, salt, hash) {
            if(hash === userr.passWord) {
              req.session.nickName = userr.nickName;
              req.session.UID = '#' + userr.clusterId + ':' + userr.dataId;
              req.session.loginedSuccessfully = true;
              req.session.save(function(){
                signale.debug("login successful");
                res.redirect('/');
              });
            } else {
              signale.debug("uncorrect password");
            }
          });
        }
      }
      signale.debug("login denined");
      res.render('loginDenined');
    });
  });
});

app.get('/copyright', function(req, res){
  res.render('copyright');
});

app.get('/game', function(req, res){
  if(req.session.loginedSuccessfully) {
    console.log(req.session.UID);
    db.record.get(req.session.UID)
   .then(
      function(userRecord){
        res.render('game', {nickName: req.session.nickName, UID: req.session.UID, record: JSON.stringify(userRecord.records)});
      }
   );
  } else {
    res.redirect('/');
  }
});

app.get('/sameName', function(req, res){
  res.render('sameName');
});

app.get('/sameEmail', function(req, res){
  res.render('sameEmail');
});

function makeCode() {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < 6; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
}

app.post('/auth/join', function(req, res){
  req.session.cookie.maxAge = 10 * 60 * 1000;
  allowedFormat = /^[a-zA-Z0-9\~\!\@\#\$\%\^\&\*\(\)\_\-\+\=\,\<\.\>\/\?\;\:\'\"\[\{\]\}\|\\]{5,15}$/;
  var usercode = makeCode();
  req.session.mailCode = usercode;
  if(allowedFormat.test(req.body.personalData) && allowedFormat.test(req.body.verySecuredText)) {
    db.class.get('User').then(function(user){
      user.list().then(function(User){
        signale.debug(User);
        var ULength = User.length;
        signale.debug(`ULength = ${ULength}`)
        req.session.emailUID = ULength;
        for(var i = 1; i < ULength; i++) {
          var userr = User[i];
          if(JSON.stringify(req.body.personalData).toLowerCase() == JSON.stringify(userr.nickName).toLowerCase()) {
            res.redirect('/sameName');
            return;
          } else if(JSON.stringify(req.body.email).toLowerCase() == JSON.stringify(userr.email).toLowerCase()){
            res.redirect('/sameEmail');
            return;
          }
        }

        hasher({password:req.body.verySecuredText}, function(err, pass, salt, hash){
          req.session.tempPersonalData = req.body.personalData;
          req.session.tempVerySecuredText = hash;
          req.session.tempEmail = req.body.email;
          req.session.tempSalt = salt;
          var mailOptions = {
            from: 'myrhydevelopteam@gmail.com',
            to: req.body.email,
            subject: 'MyRhy verification code',
            text: 'MyRhy의 이메일 확인 창에 아래의 메시지를 정확히 입력해주세요.\n아래의 메시지는 당신말고 아무도 알지 못합니다!\n' + usercode
          };

          transporter.sendMail(mailOptions, function(error, info){
            if (error) {
              console.log(error);
            }
          });

          req.session.save(function(){
            res.redirect('/auth/chkmail');
          });
        });
      });
    });
  } else {
    res.redirect('/auth/unAllowedCharacter');
  }
});

app.get('/auth/chkmail', function(req, res){
  res.render('email');
});

app.post('/auth/chkmail', function(req, res){
  if(req.session.mailCode == req.body.checkCode){
    db.class.get('User').then(function(user){
      user.list().then(function(User){
        var userCluster = User[User.length - 1];
        userCluster = userCluster.clusterId;
        userCluster = Number(userCluster) + 1;
        if(userCluster >= 25) {
          userCluster = 21;
        }
        var userDataId = Math.floor((User.length - 1) / 4);
        user.create({
          clusterId: userCluster,
          dataId: userDataId,
          email: req.session.tempEmail,
          passWord: req.session.tempVerySecuredText,
          nickName: req.session.tempPersonalData,
          salt: req.session.tempSalt
        }).then(function(){
          db.class.get('UserRecords').then(function(UserRecords){
            UserRecords.create({
              email: req.session.tempEmail,
              clusterId: userCluster + 8,
              dataId: userDataId,
            });
          });
        }).then(function(){
          res.redirect('login');
        });
      });
    });
  } else {
    res.render('emailDenined');
  }
});

app.get('/auth/unAllowedCharacter', function(req, res){
  res.send("허용되지 않은 문자를 입력했거나 공백을 전송했습니다.");
});

app.get('/auth/login', function(req, res){
  if(req.session.nickName && req.session.passWord) {
    res.redirect('/game');
  } else {
    res.render('login');
  }
});

app.get('/play/:songName/:mode/:difficulty', function(req, res){
  if(req.session.nickName && req.session.UID) {
    res.render('play', {songName: req.params.songName, mode: req.params.mode, difficulty: req.params.difficulty});
  } else {
    res.redirect('/');
  }
});

app.get('/auth/join', function(req, res){
  res.render('join');
});

http.createServer(function (req, res) {
    res.writeHead(301, { "Location": "https://" + req.headers['host'] + req.url });
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
