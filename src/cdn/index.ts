import bodyParser = require('body-parser');
import cookieParser = require('cookie-parser');
import signale = require('signale');
import http = require('http');
import express = require('express');

const config = require(__dirname + '/../../config/config.json');

const app = express();
app.locals.pretty = true;
const port = 1026;

app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/../../resources/public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

http.createServer(app).listen(port, () => {
  signale.success(`CDN Server running at port ${port}.`);
});