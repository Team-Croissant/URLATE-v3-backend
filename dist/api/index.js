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
var session = require("express-session");
var fetch = require("node-fetch");
var sha1 = require("sha1");
var MySQLStore = require('express-mysql-session')(session);
var hasher = require("pbkdf2-password")();
var config = require(__dirname + '/../../config/config.json');
var settingsConfig = require(__dirname + '/../../config/settings.json');
var google = require('googleapis').google;
var OAuth2 = google.auth.OAuth2;
var plus = google.plus('v1');
var whitelist = 'bjgumsun@gmail.com, kyungblog@gmail.com, bjgumsun@dimigo.hs.kr, pop06296347@gmail.com, dmitri0620@gmail.com, tamiya0407@gmail.com, combbm@gmail.com, jeongjy0317@gmail.com';
var api_response_1 = require("./api-response");
var app = express();
app.locals.pretty = true;
var knex = require('knex')({
    client: 'mysql',
    connection: {
        host: config.database.host,
        user: config.database.user,
        password: config.database.password,
        database: config.database.db
    }
});
var sessionStore = new MySQLStore({
    host: config.database.host,
    port: config.database.port,
    user: config.database.user,
    password: config.database.password,
    database: config.database.db
});
app.use(session({
    key: config.session.key,
    secret: config.session.secret,
    store: sessionStore,
    resave: config.session.resave,
    saveUninitialized: config.session.saveUninitialized
}));
app.use(express.json());
app.use(cookieParser());
var getOAuthClient = function (ClientId, ClientSecret, RedirectionUrl) { return new OAuth2(ClientId, ClientSecret, RedirectionUrl); };
app.get('/', function (req, res) {
    res.end('Welcome to MyRhy API!');
});
app.post('/', function (req, res) {
    res.end('Welcome to MyRhy API!');
});
app.get('/getStatus', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var hasToken, results;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                hasToken = req.session.accessToken && req.session.refreshToken;
                if (!hasToken) {
                    res.status(200).json(api_response_1.createStatusResponse('Not logined'));
                    return [2 /*return*/];
                }
                return [4 /*yield*/, knex('users').select('userid', 'nickname').where('userid', req.session.userid)];
            case 1:
                results = _a.sent();
                if (!results[0]) {
                    res.status(200).json(api_response_1.createStatusResponse('Not registered'));
                    return [2 /*return*/];
                }
                if (!req.session.authorized) {
                    res.status(200).json(api_response_1.createStatusResponse('Not authorized'));
                    return [2 /*return*/];
                }
                res.status(200).json(api_response_1.createStatusResponse('logined'));
                return [2 /*return*/];
        }
    });
}); });
app.post('/login', function (req, res) {
    var oauth2Client = getOAuthClient(req.body.ClientId, req.body.ClientSecret, req.body.RedirectionUrl);
    oauth2Client.getToken(req.body.code, function (err, tokens) {
        if (err) {
            res.status(400).json(api_response_1.createErrorResponse('failed', err.response.data.error, err.response.data.error_description));
            return;
        }
        var access_token = tokens.access_token, refresh_token = tokens.refresh_token;
        oauth2Client.setCredentials({ access_token: access_token, refresh_token: refresh_token });
        plus.people.get({ userId: 'me', auth: oauth2Client }, function (err, response) {
            if (whitelist.indexOf(response.data.emails[0].value) != -1) {
                req.session.userid = response.data.id;
                req.session.email = response.data.emails[0].value;
                req.session.tempName = response.data.displayName;
                req.session.accessToken = access_token;
                req.session.refreshToken = refresh_token;
                req.session.save(function () {
                    res.status(200).json(api_response_1.createSuccessResponse('success'));
                });
            }
            else {
                signale.debug("User login blocked by whitelist : " + response.data.emails[0].value);
                res.status(400).json(api_response_1.createErrorResponse('failed', 'Not Whitelisted', 'Provided email is not whitelisted.'));
            }
        });
    });
});
app.post("/join", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var hasToken, namePattern, passPattern, isValidated, results;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                hasToken = req.session.tempName && req.session.accessToken && req.session.refreshToken;
                if (!hasToken) {
                    res.status(400).json(api_response_1.createErrorResponse('failed', 'Wrong Request', 'You need to login first.'));
                    return [2 /*return*/];
                }
                namePattern = /^[a-zA-Z0-9_-]{5,12}$/;
                passPattern = /^[0-9]{4,6}$/;
                isValidated = namePattern.test(req.body.displayName) && passPattern.test(req.body.secondaryPassword);
                if (!isValidated) {
                    res.status(400).json(api_response_1.createErrorResponse('failed', 'Wrong Format', 'Wrong name OR password format.'));
                    return [2 /*return*/];
                }
                return [4 /*yield*/, knex('users').select('nickname').where('nickname', req.body.displayName)];
            case 1:
                results = _a.sent();
                if (!results[0]) {
                    hasher({
                        password: req.body.secondaryPassword
                    }, function (err, pass, salt, hash) { return __awaiter(void 0, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, knex('users').insert({
                                        nickname: req.body.displayName,
                                        userid: req.session.userid,
                                        salt: salt,
                                        secondary: hash,
                                        date: new Date(),
                                        email: req.session.email,
                                        advanced: false,
                                        advancedDate: new Date(),
                                        advancedUpdatedDate: new Date(),
                                        settings: JSON.stringify(settingsConfig),
                                        skins: ["Default"],
                                        DLCs: []
                                    })];
                                case 1:
                                    _a.sent();
                                    delete req.session.tempName;
                                    req.session.save(function () {
                                        res.status(200).json(api_response_1.createSuccessResponse('success'));
                                    });
                                    return [2 /*return*/];
                            }
                        });
                    }); });
                }
                else {
                    res.status(400).json(api_response_1.createErrorResponse('failed', 'Exist Name', 'The name sent already exists.'));
                }
                return [2 /*return*/];
        }
    });
}); });
var passwordPattern = /^[0-9]{4,6}$/;
app.post("/authorize", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var results;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!passwordPattern.test(req.body.secondaryPassword)) {
                    res.status(400).json(api_response_1.createErrorResponse('failed', 'Wrong Format', 'Wrong password format.'));
                    return [2 /*return*/];
                }
                return [4 /*yield*/, knex('users').select('secondary', 'salt').where('userid', req.session.userid)];
            case 1:
                results = _a.sent();
                hasher({
                    password: req.body.secondaryPassword,
                    salt: results[0].salt
                }, function (err, pass, salt, hash) {
                    if (hash !== results[0].secondary) {
                        res.status(400).json(api_response_1.createErrorResponse('failed', 'Wrong Password', 'User entered wrong password.'));
                        return;
                    }
                    req.session.authorized = true;
                    req.session.save(function () {
                        res.status(200).json(api_response_1.createSuccessResponse('success'));
                    });
                });
                return [2 /*return*/];
        }
    });
}); });
app.get("/getUser", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var results, _a, settings, nickname, advanced, skins, DLCs;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                if (!req.session.userid) {
                    res.status(400).json(api_response_1.createErrorResponse('failed', 'UserID Required', 'UserID is required for this task.'));
                    return [2 /*return*/];
                }
                return [4 /*yield*/, knex('users').select('nickname', 'settings', 'skins', 'advanced', 'DLCs').where('userid', req.session.userid)];
            case 1:
                results = _b.sent();
                if (!results.length) {
                    res.status(400).json(api_response_1.createErrorResponse('failed', 'Failed to Load', 'Failed to load settings. Use /getStatus to check your status.'));
                    return [2 /*return*/];
                }
                _a = results[0], settings = _a.settings, nickname = _a.nickname, advanced = _a.advanced, skins = _a.skins, DLCs = _a.DLCs;
                res.status(200).json({ result: "success", settings: settings, nickname: nickname, userid: req.session.userid, advanced: advanced, skins: skins, DLCs: DLCs });
                return [2 /*return*/];
        }
    });
}); });
app.get("/getTracks", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var results;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, knex('tracks').select('name', 'fileName', 'producer', 'bpm', 'difficulty', 'original_name', 'type')];
            case 1:
                results = _a.sent();
                if (!results.length) {
                    res.status(400).json(api_response_1.createErrorResponse('failed', 'Failed to Load', 'Failed to load tracks. It may be a problem with the DB.'));
                    return [2 /*return*/];
                }
                res.status(200).json({ result: "success", tracks: results });
                return [2 /*return*/];
        }
    });
}); });
app.get("/getTrackInfo/:name", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var results;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, knex('patternInfo').select('bpm', 'bullet_density', 'note_density', 'speed').where('name', req.params.name)];
            case 1:
                results = _a.sent();
                if (!results.length) {
                    res.status(400).json(api_response_1.createErrorResponse('failed', 'Failed to Load', 'Failed to load track data. It may be a problem with the DB.'));
                    return [2 /*return*/];
                }
                res.status(200).json({ result: "success", info: results });
                return [2 /*return*/];
        }
    });
}); });
app.post('/xsolla/getToken', function (req, res) {
    if (req.body.type == 'advanced') {
        fetch("https://api.xsolla.com/merchant/v2/merchants/" + config.xsolla.merchantId + "/token", {
            method: 'post',
            body: JSON.stringify({
                "user": {
                    "id": {
                        "value": req.session.userid
                    },
                    "email": {
                        "value": req.session.email
                    }
                },
                "settings": {
                    "project_id": config.xsolla.projectId,
                    "mode": "sandbox" //TODO: NEED TO DELETE ON RELEASE
                }
            }),
            headers: {
                'Content-Type': 'application/json',
                'Authorization': "Basic " + config.xsolla.basicKey
            },
        })
            .then(function (res) { return res.json(); })
            .then(function (json) {
            res.status(200).json({ result: "success", token: json.token });
        });
    }
});
app.post('/xsolla/webhook', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, result;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                if (!(req.headers.authorization == "Signature " + sha1(JSON.stringify(req.body) + config.xsolla.projectKey))) return [3 /*break*/, 13];
                _a = req.body.notification_type;
                switch (_a) {
                    case 'user_validation': return [3 /*break*/, 1];
                    case 'payment': return [3 /*break*/, 3];
                    case 'create_subscription': return [3 /*break*/, 4];
                    case 'update_subscription': return [3 /*break*/, 6];
                    case 'cancel_subscription': return [3 /*break*/, 8];
                    case 'refund': return [3 /*break*/, 10];
                }
                return [3 /*break*/, 12];
            case 1: return [4 /*yield*/, knex('users').select('userid').where('userid', req.body.user.id)];
            case 2:
                result = _b.sent();
                if (result[0] && req.body.settings.project_id == config.xsolla.projectId && req.body.settings.merchant_id == config.xsolla.merchantId) {
                    res.end();
                    return [2 /*return*/];
                }
                res.status(400).json({ "error": {
                        "code": "INVALID_USER",
                        "message": "Invalid user"
                    } });
                return [2 /*return*/];
            case 3:
                console.log('payment');
                return [3 /*break*/, 12];
            case 4: return [4 /*yield*/, knex('users').update({ 'advanced': true, 'advancedDate': new Date(), 'advancedUpdatedDate': new Date() }).where('userid', req.body.user.id)];
            case 5:
                _b.sent();
                return [3 /*break*/, 12];
            case 6: return [4 /*yield*/, knex('users').update({ 'advancedUpdatedDate': new Date() }).where('userid', req.body.user.id)];
            case 7:
                _b.sent();
                return [3 /*break*/, 12];
            case 8: return [4 /*yield*/, knex('users').update({ 'advanced': false, 'advancedUpdatedDate': new Date() }).where('userid', req.body.user.id)];
            case 9:
                _b.sent();
                return [3 /*break*/, 12];
            case 10: //TODO: NEED TO CHANGE FT.PAYMENT
            return [4 /*yield*/, knex('users').update({ 'advanced': false, 'advancedUpdatedDate': new Date() }).where('userid', req.body.user.id)];
            case 11:
                _b.sent();
                return [3 /*break*/, 12];
            case 12: return [3 /*break*/, 14];
            case 13:
                res.status(400).json({ "error": {
                        "code": "INVALID_SIGNATURE",
                        "message": "Invaild signature"
                    } });
                return [2 /*return*/];
            case 14:
                res.end();
                return [2 /*return*/];
        }
    });
}); });
app.put('/update/settings', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var settings, advanced, e_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!req.session.userid) {
                    res.status(400).json(api_response_1.createErrorResponse('failed', 'UserID Required', 'UserID is required for this task.'));
                    return [2 /*return*/];
                }
                _a.label = 1;
            case 1:
                _a.trys.push([1, 5, , 6]);
                settings = req.body.settings;
                if (!(settings.sound.res == "192kbps" ||
                    !settings.game.judgeSkin ||
                    JSON.stringify(settings.game.applyJudge) != "{\"Perfect\":false,\"Great\":false,\"Good\":false,\"Bad\":false,\"Miss\":false,\"Bullet\":false}")) return [3 /*break*/, 3];
                return [4 /*yield*/, knex('users').select('advanced').where('userid', req.session.userid)];
            case 2:
                advanced = _a.sent();
                if (!advanced[0].advanced) {
                    res.status(400).json(api_response_1.createErrorResponse('failed', 'Error occured while updating', 'wrong request'));
                    return [2 /*return*/];
                }
                _a.label = 3;
            case 3: return [4 /*yield*/, knex('users').update({ 'settings': JSON.stringify(req.body.settings) }).where('userid', req.session.userid)];
            case 4:
                _a.sent();
                return [3 /*break*/, 6];
            case 5:
                e_1 = _a.sent();
                res.status(400).json(api_response_1.createErrorResponse('failed', 'Error occured while updating', e_1));
                return [2 /*return*/];
            case 6:
                res.status(200).json(api_response_1.createSuccessResponse('success'));
                return [2 /*return*/];
        }
    });
}); });
app.get("/getSkin/:skinName", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var results;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, knex('skins').select('data').where('name', req.params.skinName)];
            case 1:
                results = _a.sent();
                if (!results.length) {
                    res.status(400).json(api_response_1.createErrorResponse('failed', 'Failed to Load', 'Failed to load skin data.'));
                    return [2 /*return*/];
                }
                res.status(200).json({ result: "success", data: results[0].data });
                return [2 /*return*/];
        }
    });
}); });
app.get("/getProfile/:name", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var results;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, knex('teamProfiles').select('data').where('name', req.params.name)];
            case 1:
                results = _a.sent();
                if (!results.length) {
                    res.status(400).json(api_response_1.createErrorResponse('failed', 'Failed to Load', 'Failed to load data.'));
                    return [2 /*return*/];
                }
                res.status(200).json({ result: "success", data: results[0].data });
                return [2 /*return*/];
        }
    });
}); });
app.get("/getRecord/:track/:name", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var results;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, knex('trackRecords').select('rank', 'record', 'maxcombo', 'medal').where('nickname', req.params.name).where('name', req.params.track).orderBy('difficulty', 'ASC')];
            case 1:
                results = _a.sent();
                if (!results.length) {
                    res.status(200).json(api_response_1.createSuccessResponse('empty'));
                    return [2 /*return*/];
                }
                res.status(200).json({ result: "success", results: results });
                return [2 /*return*/];
        }
    });
}); });
app.get("/getRecords/:track/:difficulty/:order/:sort/:nickname", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var results, rank;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, knex('trackRecords').select('rank', 'record', 'maxcombo', 'nickname').where('name', req.params.track).where('difficulty', req.params.difficulty).orderBy(req.params.order, req.params.sort)];
            case 1:
                results = _a.sent();
                rank = results.map(function (d) { return d['nickname']; }).indexOf(req.params.nickname) + 1;
                res.status(200).json({ result: "success", results: results.slice(0, 100), rank: rank });
                return [2 /*return*/];
        }
    });
}); });
app.get("/getStore/DLC/:locale", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var results;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, knex('storeDLC').select('name', 'previewFile', 'price', 'composer')];
            case 1:
                results = _a.sent();
                if (!results.length) {
                    res.status(400).json(api_response_1.createErrorResponse('failed', 'Failed to Load', 'Failed to load DLC data.'));
                    return [2 /*return*/];
                }
                res.status(200).json({ result: "success", data: results });
                return [2 /*return*/];
        }
    });
}); });
app.get('/logout', function (req, res) {
    delete req.session.authorized;
    delete req.session.accessToken;
    delete req.session.refreshToken;
    delete req.session.userid;
    delete req.session.tempName;
    delete req.session.email;
    delete req.session.vaildChecked;
    req.session.save(function () {
        if (req.query.redirect == 'true') {
            res.redirect("https://rhyga.me");
        }
        else {
            res.status(200).json(api_response_1.createSuccessResponse('success'));
        }
    });
});
var PORT = 1024;
http.createServer(app).listen(PORT, function () {
    signale.success("API Server running at port " + PORT + ".");
});
