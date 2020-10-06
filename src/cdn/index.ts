import bodyParser = require('body-parser');
import cookieParser = require('cookie-parser');
import signale = require('signale');
import http = require('http');
import express = require('express');
import CryptoJS = require('crypto-js');
import fs = require('fs');

const config = require(__dirname + '/../../config/config.json');

const app = express();
app.locals.pretty = true;
const port = 1026;

app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/../../resources/public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

app.get('/tracks/:quality/:songName', (req, res) => {
  let song = fs.readFileSync(__dirname + `/../../resources/private/tracks/${req.params.quality}/${req.params.songName}`);
  res.end(song);
});

app.get('/getTrack/:quality/:songName', (req, res) => {
  let song = fs.readFileSync(__dirname + `/../../resources/private/tracks/${req.params.quality}/${req.params.songName}`);
  let arrayBuffer = Uint8Array.from(song).buffer;
  let key = "1234567887654321";
  let wordArray = CryptoJS.lib.WordArray.create(arrayBuffer);
  let encrypted = CryptoJS.AES.encrypt(wordArray, key).toString();
  res.json({
    result: "success",
    data: encrypted
  });
});

http.createServer(app).listen(port, () => {
  signale.success(`CDN Server running at port ${port}.`);
});