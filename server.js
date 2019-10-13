const bodyParser = require('body-parser');
const signale = require('signale');
const fs = require('fs'),
    http = require('http'),
    https = require('https'),
    express = require('express');
const session = require('express-session');
const OrientDBClient = require("orientjs").OrientDBClient;
const bcrypt = require('bcrypt-nodejs');
const OrientoStore = require('connect-oriento')(session);
const config = require('./config/config.json');
const bkfd2Password = require("pbkdf2-password");
const nodemailer = require('nodemailer');
const hasher = bkfd2Password();
const app = express();
app.locals.pretty = true;
const port = 80;
const httpsPort = 443;

const privateKey = fs.readFileSync(config.keys.key, 'utf8');
const certificate = fs.readFileSync(config.keys.crt, 'utf8');

const lawInfo = fs.readFileSync('views/other/개인정보처리방침.txt', 'utf8');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'myrhydevelopteam@gmail.com',
    pass: config.orient.password
  }
});

OrientDBClient.connect({
  host: "localhost",
  port: 2424
}).then(client => {
  return client.close();
}).then(()=> {
  signale.success("DB client closed");
});

app.use(session({
    secret: config.app_pw.secret,
    resave: config.app_pw.resave,
    saveUninitialized: config.app_pw.saveUninitialized,
    store: new OrientoStore({
      server: config.store.server
    })
}));

app.set('view engine', 'ejs');
app.set('views', './views');
app.use(express.static('views'));
app.use(bodyParser.urlencoded({ extended: false }));

app.get('/', function(req, res){
  res.render('index');
});

http.createServer(function (req, res) {
    res.writeHead(301, { "Location": "https://" + req.headers['host'] + req.url });
    res.end();
}).listen(port, function() {
  signale.success(`HTTP Server running at port ${port}.`);
});

https.createServer({
    key: privateKey,
    cert: certificate
}, app).listen(httpsPort, function() {
  signale.success(`HTTPS Server running at port ${httpsPort}.`);
});

//socket.io
var socketPort = 3000;
var socketServer = https.createServer({
  key: privateKey,
  cert: certificate
}, app);
socketServer.listen(socketPort, function() {
  signale.success(`Socket server running at port ${socketPort}`);
});
var io = require('socket.io').listen(socketServer);

io.sockets.on('connection',function (socket) {
    socket.on('chat message', (msg) => {
      io.emit('chat message', msg);
    });
});
