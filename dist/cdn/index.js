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
Object.defineProperty(exports, "__esModule", { value: true });
var cookieParser = require("cookie-parser");
var signale = require("signale");
var http = require("http");
var express = require("express");
var fetch = require("node-fetch");
var CryptoJS = require("crypto-js");
var fs = require("fs");
var config = require(__dirname + '/../../config/config.json');
var app = express();
app.locals.pretty = true;
var port = 1026;
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/../../resources/public'));
app.use(express.json());
app.use(cookieParser());
app.post('/getTrack/:quality/:songName', function (req, res) {
    if (req.body.bb && req.body.sth) {
        fetch(config.project.api + "/token/verify", {
            method: 'POST',
            body: JSON.stringify({
                bb: req.body.bb,
                sth: req.body.sth,
                tok: req.body.tok
            }),
            headers: {
                'Content-Type': 'application/json'
            }
        })
            .then(function (res) { return res.json(); })
            .then(function (data) { return __awaiter(void 0, void 0, void 0, function () {
            var song, arrayBuffer, key, wordArray, encrypted;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(data.result == "verified")) return [3 /*break*/, 6];
                        return [4 /*yield*/, fs.readFileSync(__dirname + ("/../../resources/private/tracks/" + req.params.quality + "/" + req.params.songName))];
                    case 1:
                        song = _a.sent();
                        return [4 /*yield*/, Uint8Array.from(song).buffer];
                    case 2:
                        arrayBuffer = _a.sent();
                        return [4 /*yield*/, req.body.sth.toString()];
                    case 3:
                        key = _a.sent();
                        return [4 /*yield*/, CryptoJS.lib.WordArray.create(arrayBuffer)];
                    case 4:
                        wordArray = _a.sent();
                        return [4 /*yield*/, CryptoJS.AES.encrypt(wordArray, key).toString()];
                    case 5:
                        encrypted = _a.sent();
                        res.json({
                            result: "success",
                            data: encrypted
                        });
                        return [3 /*break*/, 7];
                    case 6:
                        res.sendStatus(400);
                        _a.label = 7;
                    case 7: return [2 /*return*/];
                }
            });
        }); }).catch(function (err) {
            res.sendStatus(400);
        });
    }
    else {
        res.sendStatus(400);
    }
});
http.createServer(app).listen(port, function () {
    signale.success("CDN Server running at port " + port + ".");
});
