const config = require('./config/config.json');

const bodyParser = require('body-parser');
const signale = require('signale');
const express = require('express');
const fs = require('fs'),
    http = require('http'),
    https = require('https');
const OrientDBClient = require("orientjs").OrientDBClient;
const bkfd2Password = require("pbkdf2-password");
const hasher = bkfd2Password();
const app = express();

const privateKey = fs.readFileSync(config.keys.key, 'utf8');
const certificate = fs.readFileSync(config.keys.crt, 'utf8');

app.locals.pretty = true;
const port = 1024;
const httpsPort = 2410;

OrientDBClient.connect({
  host: "localhost",
  port: 2424
}).then(client => {
  return client.close();
}).then(()=> {
  signale.success("DB client loaded");
});

app.use(bodyParser.urlencoded({ extended: false }));

app.get('/', function(req, res) {
  res.send('Welcome to API!');
});

http.createServer(app).listen(port, function() {
signale.success(`HTTP Server running at port ${port}.`);
});

https.createServer({
  key: privateKey,
  cert: certificate
}, app).listen(httpsPort, function() {
signale.success(`HTTPS Server running at port ${httpsPort}.`);
});