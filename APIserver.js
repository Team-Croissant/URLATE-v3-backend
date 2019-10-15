const bodyParser = require('body-parser');
const signale = require('signale');
const express = require('express');
const OrientDBClient = require("orientjs").OrientDBClient;
const bkfd2Password = require("pbkdf2-password");
const hasher = bkfd2Password();
const app = express();

const config = require('./config/config.json');

app.locals.pretty = true;
const port = 1024;

OrientDBClient.connect({
  host: "localhost",
  port: 2424
}).then(client => {
  return client.close();
}).then(()=> {
  signale.success("DB client loaded");
});

app.use(bodyParser.urlencoded({ extended: false }));

app.get('/', function(req, res){
  console.log('User wants some info.');
  res.send('Welcome to APIServer');
});

app.listen(port, function () {
  signale.success(`HTTP API Server running at port ${port}`);
});