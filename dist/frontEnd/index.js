"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
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
    res.render('index', { url: config.project.url, api: config.project.api, community: config.project.community, mirai: config.project.mirai });
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
app.get('/game', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        res.render('game', { cdn: config.project.cdn, url: config.project.url, api: config.project.api });
        return [2 /*return*/];
    });
}); });
app.get('/editor', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        res.render('editor', { cdn: config.project.cdn, url: config.project.url, api: config.project.api });
        return [2 /*return*/];
    });
}); });
app.get('/test', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        res.render('test', { cdn: config.project.cdn, url: config.project.url, api: config.project.api });
        return [2 /*return*/];
    });
}); });
app.get('/accessDenined', function (req, res) {
    res.render('accessDenined');
});
app.get('/info', function (req, res) {
    res.render('information');
});
http.createServer(app).listen(port, function () {
    signale.success("HTTP Server running at port " + port + ".");
});
