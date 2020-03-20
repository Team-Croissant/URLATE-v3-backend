"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var bodyParser = require("body-parser");
var cookieParser = require("cookie-parser");
var signale = require("signale");
var http = require("http");
var express = require("express");
var i18n_1 = __importDefault(require("./i18n"));
var config = require(__dirname + '/../../config/config.json');
var app = express();
app.locals.pretty = true;
var port = 1025;
app.set('view engine', 'ejs');
app.set('views', __dirname + '/../../views');
app.use(express.static(__dirname + '/../../views'));
app.use(express.static(__dirname + '/../../public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(i18n_1.default);
app.get('/', function (req, res) {
    res.render('index', { url: config.project.url, api: config.project.api, communityUrl: config.project.communityUrl, miraiUrl: config.project.miraiUrl });
});
app.get('/en', function (req, res) {
    res.cookie('lang', 'en');
    res.redirect('/');
});
app.get('/ko', function (req, res) {
    res.cookie('lang', 'ko');
    res.redirect('/');
});
app.get('/join', function (req, res) {
    res.render('join', { api: config.project.api, url: config.project.url });
});
app.get('/authorize', function (req, res) {
    if (req.query.status == 'fail') {
        res.render('authorizeFail', { url: config.project.url, api: config.project.api });
    }
    else {
        res.render('authorize', { url: config.project.url, api: config.project.api });
    }
});
app.get('/game', function (req, res) {
    res.render('game', { cdnUrl: config.project.cdn, url: config.project.url, api: config.project.api });
});
app.get('/proto', function (req, res) {
    res.render('proto', { cdnUrl: config.project.cdn, url: config.project.url, api: config.project.api });
});
app.get('/editor', function (req, res) {
    res.render('editor', { cdnUrl: config.project.cdn, url: config.project.url, api: config.project.api });
});
app.get('/accessDenined', function (req, res) {
    res.render('accessDenined');
});
http.createServer(app).listen(port, function () {
    signale.success("HTTP Server running at port " + port + ".");
});
