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

app.get('/join', (req, res) => {
  res.render('join', { api : config.project.api, url : config.project.url});
});

app.get('/authorize', (req, res) => {
  if(req.query.status == 'fail') {
    res.render('authorizeFail', { url : config.project.url, api : config.project.api })
  } else {
    res.render('authorize', { url : config.project.url, api : config.project.api });
  }
});

app.get('/game', (req, res) => {
  res.render('game', { cdnUrl : config.project.cdn, url : config.project.url, api : config.project.api });
});

app.get('/accessDenined', (req, res) => {
  res.render('accessDenined');
});

http.createServer(app).listen(port, () => {
  signale.success(`HTTP Server running at port ${port}.`);
});