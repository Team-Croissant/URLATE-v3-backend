const signale = require('signale');
const express = require('express');
const http = require('http');
const app = express();

app.locals.pretty = true;

const port = 1024;

app.get('/', function(req, res){
  res.send('Welcome to our API!');
});

http.createServer(app).listen(port, function() {
  signale.success(`API Server running at port ${port}.`);
});