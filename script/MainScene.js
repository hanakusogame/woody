"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var Button_1 = require("./Button");
var Config_1 = require("./Config");
var MainScene = /** @class */ (function (_super) {
    __extends(MainScene, _super);
    function MainScene(param) {
        var _this = this;
        param.assetIds = [
            "img_numbers_n", "img_numbers_n_red", "title", "start", "finish", "mate", "combo", "waku", "selectArea", "score", "time",
            "config", "volume", "test", "glyph72", "ui_common",
            "panel", "panel2", "panel3", "score",
            "se_start", "se_timeup", "move", "miss", "biri", "bgm", "clear", "line"
        ];
        _this = _super.call(this, param) || this;
        var tl = require("@akashic-extension/akashic-timeline");
        var timeline = new tl.Timeline(_this);
        _this.loaded.add(function () {
            g.game.vars.gameState = { score: 0 };
            // 何も送られてこない時は、標準の乱数生成器を使う
            var random = g.game.random;
            var isStart = false;
            var panelList = [];
            var panelListNum = 0;
            var isDebug = false; //デバッグ用必ずfalseに
            _this.message.add(function (msg) {
                if (msg.data && msg.data.type === "start" && msg.data.parameters) {
                    var sessionParameters = msg.data.parameters;
                    if (sessionParameters.randomSeed != null) {
                        // プレイヤー間で共通の乱数生成器を生成
                        // `g.XorshiftRandomGenerator` は Akashic Engine の提供する乱数生成器実装で、 `g.game.random` と同じ型。
                        random = new g.XorshiftRandomGenerator(sessionParameters.randomSeed);
                    }
                }
            });
            // 配信者のIDを取得
            _this.lastJoinedPlayerId = "";
            g.game.join.add(function (ev) {
                _this.lastJoinedPlayerId = ev.player.id;
            });
            // 背景
            var bg = new g.FilledRect({ scene: _this, width: 640, height: 360, cssColor: "#303030", opacity: 0 });
            _this.append(bg);
            bg.touchable = true;
            if ((typeof window !== "undefined" && window.RPGAtsumaru) || isDebug) {
                bg.opacity = 1.0;
                bg.modified();
            }
            var base = new g.Sprite({ scene: _this, src: _this.assets["waku"] });
            _this.append(base);
            base.hide();
            var uiBase = new g.E({ scene: _this });
            _this.append(uiBase);
            uiBase.hide();
            //タイトル
            var sprTitle = new g.Sprite({ scene: _this, src: _this.assets["title"], x: 70 });
            _this.append(sprTitle);
            timeline.create(sprTitle, {
                modified: sprTitle.modified, destroyd: sprTitle.destroyed
            }).wait(5000).moveBy(-800, 0, 200).call(function () {
                bg.show();
                base.show();
                uiBase.show();
                isStart = true;
                reset();
            });
            var glyph = JSON.parse(_this.assets["test"].data);
            var numFont = new g.BitmapFont({
                src: _this.assets["img_numbers_n"],
                map: glyph.map,
                defaultGlyphWidth: glyph.width,
                defaultGlyphHeight: glyph.height,
                missingGlyph: glyph.missingGlyph
            });
            var numFontRed = new g.BitmapFont({
                src: _this.assets["img_numbers_n_red"],
                map: glyph.map,
                defaultGlyphWidth: glyph.width,
                defaultGlyphHeight: glyph.height,
                missingGlyph: glyph.missingGlyph
            });
            glyph = JSON.parse(_this.assets["glyph72"].data);
            var numFont72 = new g.BitmapFont({
                src: _this.assets["ui_common"],
                map: glyph.map,
                defaultGlyphWidth: 72,
                defaultGlyphHeight: 80
            });
            //スコア
            uiBase.append(new g.Sprite({ scene: _this, src: _this.assets["score"], x: 370, y: 6 }));
            var score = 0;
            var labelScore = new g.Label({
                scene: _this,
                x: 410,
                y: 5,
                width: 32 * 6,
                fontSize: 32,
                font: numFont,
                text: "0P",
                textAlign: g.TextAlign.Right, widthAutoAdjust: false
            });
            uiBase.append(labelScore);
            //スコアの増分
            var labelScorePlus = new g.Label({
                scene: _this,
                x: 420,
                y: 40,
                width: 32 * 6,
                fontSize: 32,
                font: numFontRed,
                text: "+0",
                textAlign: g.TextAlign.Right, widthAutoAdjust: false
            });
            uiBase.append(labelScorePlus);
            labelScorePlus.hide();
            //消したら列の数
            uiBase.append(new g.Sprite({ scene: _this, src: _this.assets["line"], x: 480, y: 76 }));
            var lineCnt = 0;
            var labelLine = new g.Label({
                scene: _this,
                x: 440,
                y: 75,
                width: 32 * 6,
                fontSize: 32,
                font: numFont,
                text: "0",
                textAlign: g.TextAlign.Right, widthAutoAdjust: false
            });
            uiBase.append(labelLine);
            //タイム
            uiBase.append(new g.Sprite({ scene: _this, src: _this.assets["time"], x: 540, y: 320 }));
            var labelTime = new g.Label({ scene: _this, font: numFont, fontSize: 32, text: "70", x: 580, y: 323 });
            uiBase.append(labelTime);
            var size = 336;
            var panelNum = 7;
            var panelSize = size / panelNum;
            var margin = 12;
            //開始
            var sprStart = new g.Sprite({ scene: _this, src: _this.assets["start"], x: 50, y: 100 });
            uiBase.append(sprStart);
            sprStart.hide();
            //終了
            var finishBase = new g.E({ scene: _this, x: 0, y: 0 });
            _this.append(finishBase);
            finishBase.hide();
            var finishBg = new g.FilledRect({ scene: _this, width: 640, height: 360, cssColor: "#000000", opacity: 0.3 });
            finishBase.append(finishBg);
            var sprFinish = new g.Sprite({ scene: _this, src: _this.assets["finish"], x: 120, y: 100 });
            finishBase.append(sprFinish);
            //最前面
            var fg = new g.FilledRect({ scene: _this, width: 640, height: 480, cssColor: "#ff0000", opacity: 0.0 });
            _this.append(fg);
            //リセットボタン
            var btnReset = new Button_1.Button(_this, ["リセット"], 500, 270, 130);
            if ((typeof window !== "undefined" && window.RPGAtsumaru) || isDebug) {
                finishBase.append(btnReset);
                btnReset.pushEvent = function () {
                    reset();
                };
            }
            //ランキングボタン
            var btnRanking = new Button_1.Button(_this, ["ランキング"], 500, 200, 130);
            if ((typeof window !== "undefined" && window.RPGAtsumaru) || isDebug) {
                finishBase.append(btnRanking);
                btnRanking.pushEvent = function () {
                    window.RPGAtsumaru.experimental.scoreboards.display(1);
                };
            }
            //設定ボタン
            var btnConfig = new g.Sprite({ scene: _this, x: 600, y: 0, src: _this.assets["config"], touchable: true });
            if ((typeof window !== "undefined" && window.RPGAtsumaru) || isDebug) {
                _this.append(btnConfig);
            }
            //設定画面
            var config = new Config_1.Config(_this, 380, 40);
            if ((typeof window !== "undefined" && window.RPGAtsumaru) || isDebug) {
                _this.append(config);
            }
            config.hide();
            btnConfig.pointDown.add(function () {
                if (config.state & 1) {
                    config.show();
                }
                else {
                    config.hide();
                }
            });
            config.bgmEvent = function (n) {
                bgm.changeVolume(0.5 * n);
            };
            config.colorEvent = function (str) {
                bg.cssColor = str;
                bg.modified();
            };
            var playSound = function (name) {
                _this.assets[name].play().changeVolume(config.volumes[1]);
            };
            var bgm = _this.assets["bgm"].play();
            bgm.changeVolume(0.2);
            //置けない
            var sprMate = new g.Sprite({ scene: _this, src: _this.assets["mate"], x: 120, y: 100 });
            uiBase.append(sprMate);
            sprMate.hide();
            //同時消し
            var sprRen = new g.Sprite({
                scene: _this, src: _this.assets["combo"], x: 120, y: 90,
                width: 300, height: 74
            });
            uiBase.append(sprRen);
            sprRen.hide();
            var labelRen = new g.Label({
                scene: _this, font: numFont72, fontSize: 72, text: "2", x: 0, y: 90, width: 120, textAlign: g.TextAlign.Right, widthAutoAdjust: false
            });
            uiBase.append(labelRen);
            labelRen.hide();
            //連鎖
            var comboCnt = 0;
            var sprCombo = new g.Sprite({
                scene: _this, src: _this.assets["combo"], x: 120, y: 170,
                srcX: 0, srcY: 74, width: 300, height: 74
            });
            uiBase.append(sprCombo);
            sprCombo.hide();
            var labelCombo = new g.Label({
                scene: _this, font: numFont72, fontSize: 72, text: "2", x: 0, y: 170, width: 120, textAlign: g.TextAlign.Right, widthAutoAdjust: false
            });
            uiBase.append(labelCombo);
            labelCombo.hide();
            //グリッド
            for (var i = 1; i < panelNum; i++) {
                base.append(new g.FilledRect({ scene: _this, x: i * panelSize + margin - 1, y: margin, width: 2, height: size, cssColor: "green" }));
                base.append(new g.FilledRect({ scene: _this, y: i * panelSize + margin - 1, x: margin, height: 2, width: size, cssColor: "green" }));
            }
            //パネル
            var panels = [];
            for (var y = 0; y < panelNum; y++) {
                panels[y] = [];
                for (var x = 0; x < panelNum; x++) {
                    var rect = new Panel({
                        scene: _this,
                        x: panelSize * x + margin,
                        y: panelSize * y + margin,
                        src: _this.assets["panel"]
                    });
                    base.append(rect);
                    panels[y].push(rect);
                    rect.hide();
                }
            }
            //ブロック選択用
            var rectSelects = [];
            var posX = [370, 470, 370];
            var posY = [80, 160, 240];
            for (var i = 0; i < 3; i++) {
                var rect = new g.FrameSprite({
                    scene: _this,
                    x: posX[i],
                    y: posY[i],
                    width: 100,
                    height: 100,
                    src: _this.assets["selectArea"],
                    frames: [0, 1, 2, 3]
                });
                base.append(rect);
                rectSelects.push(rect);
                for (var j = 0; j < 9; j++) {
                    var r = new g.Sprite({
                        scene: _this,
                        x: 0,
                        y: 0,
                        width: 30,
                        height: 30,
                        src: _this.assets["panel2"]
                    });
                    r.hide();
                    rect.append(r);
                }
            }
            var panelPos = [
                [[-1, 0], [0, 0], [0, -1]],
                [[1, 0], [0, 0], [0, -1]],
                [[1, 0], [0, 0], [0, 1]],
                [[-1, 0], [0, 0], [0, 1]],
                [[-1, 1], [0, 1], [1, 1], [1, 0], [1, -1]],
                [[-1, -1], [-1, 0], [-1, 1], [0, 1], [1, 1]],
                [[1, -1], [0, -1], [-1, -1], [-1, 0], [-1, 1]],
                [[-1, -1], [0, -1], [1, -1], [1, 0], [1, 1]],
                [[0, 0], [1, 0]],
                [[0, 0], [0, 1]],
                [[-1, 0], [0, 0], [1, 0]],
                [[0, -1], [0, 0], [0, 1]],
                [[-1, 0], [0, 0], [1, 0], [2, 0]],
                [[0, -1], [0, 0], [0, 1], [0, 2]],
                [[-2, 0], [-1, 0], [0, 0], [1, 0], [2, 0]],
                [[0, -2], [0, -1], [0, 0], [0, 1], [0, 2]],
                [[0, 0]],
                [[-1, 0], [0, 0], [-1, -1], [0, -1]],
                [[-1, 0], [0, 0], [1, 0], [-1, -1], [0, -1], [1, -1], [-1, 1], [0, 1], [1, 1]] //四角3
            ];
            var num = -1;
            var numSelect = [0, 1, 2];
            //プレイヤー
            var playersRect = [];
            for (var i = 0; i < 9; i++) {
                var player = new g.FilledRect({ scene: _this, width: panelSize, height: panelSize, cssColor: "yellow", opacity: 0.8 });
                playersRect.push(player);
                base.append(player);
                player.hide();
            }
            var players = [];
            for (var i = 0; i < 9; i++) {
                var player = new g.Sprite({ scene: _this, width: panelSize, height: panelSize, src: _this.assets["panel3"] });
                players.push(player);
                base.append(player);
                player.hide();
            }
            //揃ったラインエフェクト用
            var LinesX = [];
            var LinesY = [];
            for (var i = 0; i < panelNum; i++) {
                var spr = new g.FilledRect({
                    scene: _this, x: margin + panelSize * i, y: margin, width: panelSize, height: size,
                    cssColor: "yellow"
                });
                LinesX.push(spr);
                _this.append(spr);
                spr.hide();
                spr = new g.FilledRect({
                    scene: _this, y: margin + panelSize * i, x: margin, height: panelSize, width: size,
                    cssColor: "yellow", opacity: 0.8
                });
                LinesY.push(spr);
                _this.append(spr);
                spr.hide();
            }
            var px = 0;
            var py = 0;
            var isCleaning = false;
            //押したとき
            bg.pointDown.add(function (ev) {
                if (!isStart || isCleaning)
                    return;
                var x = ev.point.x;
                var y = ev.point.y;
                var _loop_1 = function (i) {
                    var r = rectSelects[i];
                    if (r.x < x && r.y < y && x < r.x + r.width && y < r.y + r.width) {
                        num = i;
                        rectSelects.forEach(function (e) {
                            e.frameNumber = (e === r) ? 2 : 0;
                            e.modified();
                        });
                        return "break";
                    }
                };
                for (var i = 0; i < 3; i++) {
                    var state_1 = _loop_1(i);
                    if (state_1 === "break")
                        break;
                }
                if (num === -1)
                    return;
                var panel = panelPos[numSelect[num]];
                for (var i = 0; i < panel.length; i++) {
                    players[i].show();
                }
                for (var i = 0; i < panel.length; i++) {
                    px = Math.floor((ev.point.x) / panelSize);
                    py = Math.floor((ev.point.y) / panelSize);
                    var xx = (px + panel[i][0]) * panelSize + margin;
                    var yy = (py + panel[i][1]) * panelSize + margin;
                    players[i].moveTo(xx, yy);
                    players[i].modified();
                }
            });
            //動かしたとき
            bg.pointMove.add(function (ev) {
                if (!isStart || isCleaning)
                    return;
                if (num === -1)
                    return;
                px = Math.floor((ev.point.x + ev.startDelta.x - margin) / panelSize);
                py = Math.floor((ev.point.y + ev.startDelta.y - margin) / panelSize);
                //置けるかどうか確認
                var flgSet = true;
                var panel = panelPos[numSelect[num]];
                for (var i = 0; i < panel.length; i++) {
                    var x = px + panel[i][0];
                    var y = py + panel[i][1];
                    if (x < 0 || x >= panelNum || y < 0 || y >= panelNum || panels[y][x].num === 1) {
                        flgSet = false;
                        break;
                    }
                }
                //プレイヤーの移動と透明度設定
                for (var i = 0; i < panel.length; i++) {
                    //const x = (px + panel[i][0]) * panelSize + margin;
                    //const y = (py + panel[i][1]) * panelSize + margin;
                    var x = ((ev.point.x + ev.startDelta.x) + (panel[i][0] * panelSize)) - (panelSize / 2);
                    var y = ((ev.point.y + ev.startDelta.y) + (panel[i][1] * panelSize)) - (panelSize / 2);
                    players[i].moveTo(x, y);
                    players[i].opacity = (flgSet) ? 1.0 : 0.5;
                    players[i].modified();
                    if (flgSet) {
                        x = (px + panel[i][0]) * panelSize + margin;
                        y = (py + panel[i][1]) * panelSize + margin;
                        playersRect[i].show();
                        playersRect[i].moveTo(x, y);
                        playersRect[i].modified();
                    }
                    else {
                        playersRect[i].hide();
                    }
                }
            });
            //離したとき
            bg.pointUp.add(function (ev) {
                if (!isStart || isCleaning)
                    return;
                if (num === -1)
                    return;
                var panel = panelPos[numSelect[num]];
                px = Math.floor((ev.point.x + ev.startDelta.x - margin) / panelSize);
                py = Math.floor((ev.point.y + ev.startDelta.y - margin) / panelSize);
                //置けるかどうかの確認
                var dx = [0, 1, 0, -1, 0]; //補正用
                var dy = [0, 0, 1, 0, -1];
                var flgSet = true;
                for (var j = 0; j < dx.length; j++) {
                    flgSet = true;
                    for (var i = 0; i < panel.length; i++) {
                        var x = px + panel[i][0] + dx[j];
                        var y = py + panel[i][1] + dy[j];
                        if (x < 0 || x >= panelNum || y < 0 || y >= panelNum || panels[y][x].num === 1) {
                            flgSet = false;
                            break;
                        }
                    }
                    if (flgSet) {
                        px += dx[j]; //補正を反映
                        py += dy[j];
                        break;
                    }
                }
                //置けない場合の処理
                if (!flgSet) {
                    for (var i = 0; i < panel.length; i++) {
                        players[i].hide();
                    }
                    //num = -1;
                    playSound("miss");
                    return;
                }
                //ブロック設置
                for (var i = 0; i < panel.length; i++) {
                    var x = px + panel[i][0];
                    var y = py + panel[i][1];
                    panels[y][x].show();
                    panels[y][x].num = 1;
                    panels[y][x].modified();
                    players[i].hide();
                    playersRect[i].hide();
                }
                //縦横各列のブロックを確認
                var flgsX = [];
                for (var x = 0; x < panelNum; x++) {
                    var flg_1 = true;
                    for (var y = 0; y < panelNum; y++) {
                        if (panels[y][x].num !== 1) {
                            flg_1 = false;
                            break;
                        }
                    }
                    if (flg_1)
                        flgsX.push(x);
                }
                var flgsY = [];
                for (var y = 0; y < panelNum; y++) {
                    var flg_2 = true;
                    for (var x = 0; x < panelNum; x++) {
                        if (panels[y][x].num !== 1) {
                            flg_2 = false;
                            break;
                        }
                    }
                    if (flg_2)
                        flgsY.push(y);
                }
                //揃っているブロックを消す処理
                flgsX.forEach(function (x) {
                    for (var y = 0; y < panelNum; y++) {
                        panels[y][x].num = 0;
                    }
                    LinesX[x].show();
                    timeline.create().every(function (t, d) {
                        LinesX[x].scaleY = d;
                        LinesX[x].modified();
                    }, 100).wait(100).call(function () {
                        for (var y = 0; y < panelNum; y++) {
                            panels[y][x].hide();
                        }
                        LinesX[x].hide();
                    });
                });
                flgsY.forEach(function (y) {
                    for (var x = 0; x < panelNum; x++) {
                        panels[y][x].num = 0;
                    }
                    LinesY[y].show();
                    timeline.create().every(function (t, d) {
                        LinesY[y].scaleX = d;
                        LinesY[y].modified();
                    }, 100).wait(100).call(function () {
                        for (var x = 0; x < panelNum; x++) {
                            panels[y][x].hide();
                        }
                        LinesY[y].hide();
                    });
                });
                //同時消し情報表示
                var cnt = flgsX.length + flgsY.length;
                if (cnt > 1) {
                    sprRen.show();
                    labelRen.show();
                    labelRen.text = "" + cnt;
                    labelRen.invalidate();
                    timeline.create().wait(800).call(function () {
                        sprRen.hide();
                        labelRen.hide();
                    });
                }
                //コンボ情報表示
                if (cnt > 0) {
                    comboCnt++;
                    if (comboCnt > 1) {
                        sprCombo.show();
                        labelCombo.show();
                        labelCombo.text = "" + comboCnt;
                        labelCombo.invalidate();
                        timeline.create().wait(800).call(function () {
                            sprCombo.hide();
                            labelCombo.hide();
                        });
                    }
                    isCleaning = true;
                    timeline.create().wait(400).call(function () {
                        isCleaning = false;
                    });
                }
                else {
                    comboCnt = 0;
                }
                //スコア加算
                if (cnt > 0) {
                    var scorePlus_1 = cnt * 100 + ((cnt - 1) * (cnt - 1)) * 80 + ((comboCnt - 1) * 100);
                    score += scorePlus_1;
                    g.game.vars.gameState.score = score;
                    timeline.create().every(function (e, p) {
                        labelScore.text = "" + (score - Math.floor(scorePlus_1 * (1 - p)) + "P");
                        labelScore.invalidate();
                    }, 500);
                    labelScorePlus.text = "+" + scorePlus_1;
                    labelScorePlus.invalidate();
                    labelScorePlus.show();
                    lineCnt += cnt;
                    labelLine.text = "" + lineCnt;
                    labelLine.invalidate();
                }
                else {
                    labelScorePlus.hide();
                }
                //選択パネル差し替え
                //console.log(panelListNum + ":" + panelList[panelListNum % 100]);
                numSelect[num] = panelList[panelListNum % 100];
                setPanel(num);
                panelListNum++;
                //num = -1;
                //すべて置けない場合の確認
                var flg = true;
                for (var i = 0; i < rectSelects.length; i++) {
                    var p = panelPos[numSelect[i]];
                    for (var y = 0; y < panelNum; y++) {
                        for (var x = 0; x < panelNum; x++) {
                            flg = true;
                            for (var j = 0; j < p.length; j++) {
                                var xx = x + p[j][0];
                                var yy = y + p[j][1];
                                if (xx < 0 || xx >= panelNum || yy < 0 || yy >= panelNum || panels[yy][xx].num === 1) {
                                    flg = false;
                                    break;
                                }
                            }
                            if (flg)
                                break;
                        }
                        if (flg)
                            break;
                    }
                    if (flg)
                        break;
                }
                if (!flg) {
                    sprMate.show();
                    timeline.create().wait(1500).call(function () {
                        sprMate.hide();
                        clear();
                    });
                    playSound("biri");
                }
                else if (cnt > 0) {
                    playSound("clear");
                }
                else {
                    playSound("move");
                }
            });
            //メインループ
            var bkTime = 0;
            var timeLimit = 70;
            var startTime = 0;
            _this.update.add(function () {
                if (!isStart)
                    return;
                var t = timeLimit - Math.floor((Date.now() - startTime) / 1000);
                if (t <= -1) {
                    finishBase.show();
                    labelScorePlus.hide();
                    isStart = false;
                    timeline.create().wait(1500).call(function () {
                        if (typeof window !== "undefined" && window.RPGAtsumaru) {
                            window.RPGAtsumaru.experimental.scoreboards.setRecord(1, g.game.vars.gameState.score).then(function () {
                                btnRanking.show();
                                btnReset.show();
                            });
                        }
                        if (isDebug) {
                            btnRanking.show();
                            btnReset.show();
                        }
                    });
                    playSound("se_timeup");
                    return;
                }
                labelTime.text = "" + t;
                labelTime.invalidate();
                if (bkTime !== t && t <= 5) {
                    fg.opacity = 0.1;
                    fg.modified();
                    timeline.create().wait(500).call(function () {
                        fg.opacity = 0.0;
                        fg.modified();
                    });
                }
                bkTime = t;
            });
            var setPanel = function (i) {
                //選択パネルセット
                var panel = panelPos[numSelect[i]];
                rectSelects[i].children.forEach(function (e) { return e.hide(); });
                for (var j = 0; j < panel.length; j++) {
                    var x = panel[j][0];
                    var y = panel[j][1];
                    rectSelects[i].children[j].show();
                    rectSelects[i].children[j].x = x * 30 + 40;
                    rectSelects[i].children[j].y = y * 30 + 40;
                    rectSelects[i].children[j].modified();
                }
            };
            //盤面のクリア
            var clear = function () {
                //パネルをすべて消す
                for (var y = 0; y < panelNum; y++) {
                    for (var x = 0; x < panelNum; x++) {
                        panels[y][x].hide();
                        panels[y][x].num = 0;
                    }
                }
                comboCnt = 0;
            };
            //リセット
            var reset = function () {
                panelListNum = 0;
                panelList.length = 0;
                bkTime = 0;
                //パネルの種類の出す順番リストを作成
                while (panelList.length <= 100) {
                    var arr = [];
                    for (var i = 0; i < panelPos.length; i++) {
                        arr.push(i);
                    }
                    var m = arr.length - 1;
                    while (m) {
                        var i = random.get(0, m - 1);
                        _a = [arr[i], arr[m]], arr[m] = _a[0], arr[i] = _a[1];
                        m--;
                    }
                    Array.prototype.push.apply(panelList, arr);
                }
                clear();
                //選択用ブロックの表示
                for (var i = 0; i < 3; i++) {
                    numSelect[i] = panelList[panelListNum % 100];
                    setPanel(i);
                    panelListNum++;
                }
                sprStart.show();
                timeline.create().wait(750).call(function () {
                    sprStart.hide();
                });
                players.forEach(function (e) { return e.hide(); });
                playersRect.forEach(function (e) { return e.hide(); });
                score = 0;
                labelScore.text = "0P";
                labelScore.invalidate();
                lineCnt = 0;
                labelLine.text = "0";
                labelLine.invalidate();
                finishBase.hide();
                fg.opacity = 0;
                fg.cssColor = "red";
                fg.modified();
                btnReset.hide();
                btnRanking.hide();
                comboCnt = 0;
                isStart = true;
                isCleaning = false;
                playSound("se_start");
                startTime = Date.now();
                var _a;
            };
        });
        return _this;
    }
    return MainScene;
}(g.Scene));
exports.MainScene = MainScene;
var Panel = /** @class */ (function (_super) {
    __extends(Panel, _super);
    function Panel(param) {
        var _this = _super.call(this, param) || this;
        _this.num = 0;
        return _this;
    }
    return Panel;
}(g.Sprite));
