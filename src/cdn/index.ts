import cookieParser = require('cookie-parser');
import signale = require('signale');
import http = require('http');
import express = require('express');
import fetch = require('node-fetch');
import CryptoJS = require('crypto-js');
import fs = require('fs');

const config = require(__dirname + '/../../config/config.json');

const app = express();
app.locals.pretty = true;
const port = 1026;

app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/../../resources/public'));
app.use(express.json());
app.use(cookieParser());

app.post('/getTrack/:quality/:songName', (req, res) => {
  if(req.body.bb && req.body.sth) {
    fetch(`${config.project.api}/token/verify`, {
      method: 'POST',
      body: JSON.stringify({
        bb: req.body.bb,
        sth: req.body.sth,
        tok: req.body.tok,
        ip: req.headers['x-real-ip'],
        d: req.body.d
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    })
    .then(res => res.json())
    .then(async (data) => {
      if(data.result == "verified") {
        let song = await fs.readFileSync(__dirname + `/../../resources/private/tracks/${req.params.quality}/${req.params.songName}`);
        let arrayBuffer = await Uint8Array.from(song).buffer;
        let key = await req.body.sth.toString();
        let wordArray = await CryptoJS.lib.WordArray.create(arrayBuffer);
        let encrypted = await CryptoJS.AES.encrypt(wordArray, key).toString();
        res.json({
          result: "success",
          data: encrypted
        });
      } else {
        res.sendStatus(400);
      }
    }).catch((err) => {
      res.sendStatus(400);
    });
  } else {
    res.sendStatus(400);
  }
});

http.createServer(app).listen(port, () => {
  signale.success(`CDN Server running at port ${port}.`);
});