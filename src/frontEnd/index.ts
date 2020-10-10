import bodyParser = require('body-parser');
import cookieParser = require('cookie-parser');
import signale = require('signale');
import http = require('http');
import express = require('express');
import i18n from './i18n';

import { compare, getTime } from './secureModules';

const config = require(__dirname + '/../../config/config.json');

const app = express();
app.locals.pretty = true;
const port = 1025;

app.set('view engine', 'ejs');
app.set('views', __dirname + '/../../views');
app.use(express.static(__dirname + '/../../views'));
app.use(express.static(__dirname + '/../../public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(i18n);

app.get('/', (req, res) => {
  res.render('index', { url : config.project.url, api : config.project.api, community : config.project.community, mirai : config.project.mirai });
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

app.get('/game', async (req, res) => {
  if(compare(req)) {
    const time = await getTime(req);
    res.render('game', { cdn : config.project.cdn, url : config.project.url, api : config.project.api, time : time });
  } else {
    res.redirect(config.project.url);
  }
});

app.get('/editor', async (req, res) => {
  if(compare(req)) {
    const time = await getTime(req);
    res.render('editor', { cdn : config.project.cdn, url : config.project.url, api : config.project.api, time : time });
  } else {
    res.redirect(config.project.url);
  }
});

app.get('/test', async (req, res) => {
  if(compare(req)) {
    const time = await getTime(req);
    res.render('test', { cdn : config.project.cdn, url : config.project.url, api : config.project.api, time : time });
  } else {
    res.redirect(config.project.url);
  }
});

app.get('/accessDenined', (req, res) => {
  res.render('accessDenined');
});

app.get('/info', (req, res) => {
  res.render('information');
});

http.createServer(app).listen(port, () => {
  signale.success(`HTTP Server running at port ${port}.`);
});