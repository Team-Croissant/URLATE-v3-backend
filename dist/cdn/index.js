"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var bodyParser = require("body-parser");
var cookieParser = require("cookie-parser");
var signale = require("signale");
var http = require("http");
var express = require("express");
var CryptoJS = require("crypto-js");
var fs = require("fs");
var config = require(__dirname + '/../../config/config.json');
var app = express();
app.locals.pretty = true;
var port = 1026;
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/../../resources/public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.get('/tracks/:quality/:songName', function (req, res) {
    var song = fs.readFileSync(__dirname + ("/../../resources/private/tracks/" + req.params.quality + "/" + req.params.songName));
    res.end(song);
});
app.get('/getTrack/:quality/:songName', function (req, res) {
    var song = fs.readFileSync(__dirname + ("/../../resources/private/tracks/" + req.params.quality + "/" + req.params.songName));
    var arrayBuffer = Uint8Array.from(song).buffer;
    var key = "1234567887654321";
    var wordArray = CryptoJS.lib.WordArray.create(arrayBuffer);
    var encrypted = CryptoJS.AES.encrypt(wordArray, key).toString();
    res.json({
        result: "success",
        data: encrypted
    });
});
http.createServer(app).listen(port, function () {
    signale.success("CDN Server running at port " + port + ".");
});
