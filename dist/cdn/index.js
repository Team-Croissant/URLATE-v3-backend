"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var bodyParser = require("body-parser");
var cookieParser = require("cookie-parser");
var signale = require("signale");
var http = require("http");
var express = require("express");
var config = require(__dirname + '/../../config/config.json');
var app = express();
app.locals.pretty = true;
var port = 1026;
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/../../resources/public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
http.createServer(app).listen(port, function () {
    signale.success("CDN Server running at port " + port + ".");
});
