const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const signale = require('signale');
const http = require('http');
const express = require('express');
const i18n = require(__dirname + '/i18n');

const config = require(__dirname + '/../../config/config.json');

const app = express();
app.locals.pretty = true;
const port = 8080;

app.set('view engine', 'ejs');
app.set('views', __dirname + '/../../views');
app.use(express.static(__dirname + '/../../views'));
app.use(express.static(__dirname + '/../../public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(i18n);

app.get('/', (req, res) => {
  res.render('index', { url : config.project.url, api : config.project.api, communityUrl : config.project.communityUrl, miraiUrl : config.project.miraiUrl });
});

app.get('/en', function(req, res) {
  res.cookie('lang', 'en');
  res.redirect('/');
});

app.get('/ko', function(req, res) {
  res.cookie('lang', 'ko');
  res.redirect('/');
});

app.get('/logout', (req, res) => {
  res.redirect('config.project.api/logout');
});

app.get('/join', (req, res) => {
  request.get({
    url:`${config.project.api}/isLogined`
  }, (err, httpResponse, body) => {
    if(JSON.parse(body).result == 'logined') {
      request.get({
        url:`${config.project.api}/isVaild`
      }, (err, httpResponse, body) => {
        if(JSON.parse(body).result == 'vaild') {
          res.redirect('/authorize');
        } else if(JSON.parse(body).result == 'invaild') {
          res.render('join', { name : JSON.parse(body).name, url : config.project.url });
        } else {
          res.render('error', { errorTitle : JSON.parse(body).error, errorText : JSON.parse(body)['error_description'], url : config.project.url });
        }
      });
    } else {
      res.redirect('/');
    }
  });
});

app.post('/join', (req, res) => {
  request.post({
    url:`${config.project.api}/join`,
    form: {
      displayName: req.body.displayName,
      secondaryPassword: req.body.secondaryPassword
    }
  }, (err, httpResponse, body) => {
    if(JSON.parse(body).result == "success") {
      res.redirect('/authorize');
    } else {
      res.render('error', { errorTitle : JSON.parse(body).error, errorText : JSON.parse(body)['error_description'], url : config.project.url });
    }
  });
});

app.get('/authorize', (req, res) => {
  request.get({
    url:`${config.project.api}/isLogined`
  }, (err, httpResponse, body) => {
    if(JSON.parse(body).result == 'logined') {
      request.get({
        url:`${config.project.api}/isVaild`
      }, (err, httpResponse, body) => {
        if(JSON.parse(body).result == 'vaild') {
          if(req.query.status == 'fail') {
            res.render('authorizeFail', { url : config.project.url, api : config.project.api })
          } else {
            res.render('authorize', { url : config.project.url, api : config.project.api });
          }
        } else if(JSON.parse(body).result == 'invaild') {
          res.redirect('/join');
        } else {
          res.render('error', { errorTitle : JSON.parse(body).error, errorText : JSON.parse(body)['error_description'], url : config.project.url });
        }
      });
    } else {
      res.redirect('/');
    }
  });
});

http.createServer(app).listen(port, () => {
  signale.success(`HTTP Server running at port ${port}.`);
});