import { Button } from "./Button";
import { Config } from "./Config";
declare function require(x: string): any;
export class MainScene extends g.Scene {
	public lastJoinedPlayerId: string; // 配信者のID
	private font: g.Font;

	constructor(param: g.SceneParameterObject) {
		param.assetIds = [
			"img_numbers_n", "img_numbers_n_red", "title", "start", "finish", "mate", "combo", "waku", "selectArea", "score", "time",
			"config", "volume", "test", "glyph72", "ui_common",
			"panel", "panel2", "panel3", "score",
			"se_start", "se_timeup", "move", "miss", "biri", "bgm", "clear", "line"];
		super(param);

		const tl = require("@akashic-extension/akashic-timeline");
		const timeline = new tl.Timeline(this);

		this.loaded.add(() => {

			g.game.vars.gameState = { score: 0 };

			// 何も送られてこない時は、標準の乱数生成器を使う
			let random = g.game.random;
			let isStart = false;
			const panelList: number[] = [];
			let panelListNum = 0;
			const isDebug = false;//デバッグ用必ずfalseに

			this.message.add((msg) => {
				if (msg.data && msg.data.type === "start" && msg.data.parameters) { // セッションパラメータのイベント
					const sessionParameters = msg.data.parameters;
					if (sessionParameters.randomSeed != null) {
						// プレイヤー間で共通の乱数生成器を生成
						// `g.XorshiftRandomGenerator` は Akashic Engine の提供する乱数生成器実装で、 `g.game.random` と同じ型。
						random = new g.XorshiftRandomGenerator(sessionParameters.randomSeed);
					}
				}
			});

			// 配信者のIDを取得
			this.lastJoinedPlayerId = "";
			g.game.join.add((ev) => {
				this.lastJoinedPlayerId = ev.player.id;
			});

			// 背景
			const bg = new g.FilledRect({ scene: this, width: 640, height: 360, cssColor: "#303030", opacity: 0 });
			this.append(bg);
			bg.touchable = true;
			if ((typeof window !== "undefined" && window.RPGAtsumaru) || isDebug) {
				bg.opacity = 1.0;
				bg.modified();
			}

			const base = new g.Sprite({ scene: this, src: this.assets["waku"] });
			this.append(base);
			base.hide();

			const uiBase = new g.E({ scene: this });
			this.append(uiBase);
			uiBase.hide();

			//タイトル
			const sprTitle = new g.Sprite({ scene: this, src: this.assets["title"], x: 70 });
			this.append(sprTitle);
			timeline.create(
				sprTitle, {
					modified: sprTitle.modified, destroyd: sprTitle.destroyed
				}).wait(5000).moveBy(-800, 0, 200).call(() => {
					bg.show();
					base.show();
					uiBase.show();
					isStart = true;
					reset();
				});

			let glyph = JSON.parse((this.assets["test"] as g.TextAsset).data);
			const numFont = new g.BitmapFont({
				src: this.assets["img_numbers_n"],
				map: glyph.map,
				defaultGlyphWidth: glyph.width,
				defaultGlyphHeight: glyph.height,
				missingGlyph: glyph.missingGlyph
			});

			const numFontRed = new g.BitmapFont({
				src: this.assets["img_numbers_n_red"],
				map: glyph.map,
				defaultGlyphWidth: glyph.width,
				defaultGlyphHeight: glyph.height,
				missingGlyph: glyph.missingGlyph
			});

			glyph = JSON.parse((this.assets["glyph72"] as g.TextAsset).data);
			const numFont72 = new g.BitmapFont({
				src: this.assets["ui_common"],
				map: glyph.map,
				defaultGlyphWidth: 72,
				defaultGlyphHeight: 80
			});

			//スコア
			uiBase.append(new g.Sprite({ scene: this, src: this.assets["score"], x: 370, y: 6 }));
			let score = 0;
			const labelScore = new g.Label({
				scene: this,
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
			const labelScorePlus = new g.Label({
				scene: this,
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
			uiBase.append(new g.Sprite({ scene: this, src: this.assets["line"], x: 480, y: 76 }));
			let lineCnt = 0;
			const labelLine = new g.Label({
				scene: this,
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
			uiBase.append(new g.Sprite({ scene: this, src: this.assets["time"], x: 540, y: 320 }));
			const labelTime = new g.Label({ scene: this, font: numFont, fontSize: 32, text: "70", x: 580, y: 323 });
			uiBase.append(labelTime);

			const size = 336;
			const panelNum = 7;
			const panelSize = size / panelNum;
			const margin = 12;

			//開始
			const sprStart = new g.Sprite({ scene: this, src: this.assets["start"], x: 50, y: 100 });
			uiBase.append(sprStart);
			sprStart.hide();

			//終了
			const finishBase = new g.E({ scene: this, x: 0, y: 0 });
			this.append(finishBase);
			finishBase.hide();

			const finishBg = new g.FilledRect({ scene: this, width: 640, height: 360, cssColor: "#000000", opacity: 0.3 });
			finishBase.append(finishBg);

			const sprFinish = new g.Sprite({ scene: this, src: this.assets["finish"], x: 120, y: 100 });
			finishBase.append(sprFinish);

			//最前面
			const fg = new g.FilledRect({ scene: this, width: 640, height: 480, cssColor: "#ff0000", opacity: 0.0 });
			this.append(fg);

			//リセットボタン
			const btnReset = new Button(this, ["リセット"], 500, 270, 130);
			if ((typeof window !== "undefined" && window.RPGAtsumaru) || isDebug) {
				finishBase.append(btnReset);
				btnReset.pushEvent = () => {
					reset();
				};
			}

			//ランキングボタン
			const btnRanking = new Button(this, ["ランキング"], 500, 200, 130);
			if ((typeof window !== "undefined" && window.RPGAtsumaru) || isDebug) {
				finishBase.append(btnRanking);
				btnRanking.pushEvent = () => {
					window.RPGAtsumaru.experimental.scoreboards.display(1);
				};
			}

			//設定ボタン
			const btnConfig = new g.Sprite({ scene: this, x: 600, y: 0, src: this.assets["config"], touchable: true });
			if ((typeof window !== "undefined" && window.RPGAtsumaru) || isDebug) {
				this.append(btnConfig);
			}

			//設定画面
			const config = new Config(this, 380, 40);
			if ((typeof window !== "undefined" && window.RPGAtsumaru) || isDebug) {
				this.append(config);
			}
			config.hide();

			btnConfig.pointDown.add(() => {
				if (config.state & 1) {
					config.show();
				} else {
					config.hide();
				}
			});

			config.bgmEvent = (n) => {
				bgm.changeVolume(0.5 * n);
			};

			config.colorEvent = (str) => {
				bg.cssColor = str;
				bg.modified();
			};

			const playSound = (name: string) => {
				(this.assets[name] as g.AudioAsset).play().changeVolume(config.volumes[1]);
			};

			const bgm = (this.assets["bgm"] as g.AudioAsset).play();
			bgm.changeVolume(0.2);

			//置けない
			const sprMate = new g.Sprite({ scene: this, src: this.assets["mate"], x: 120, y: 100 });
			uiBase.append(sprMate);
			sprMate.hide();

			//同時消し
			const sprRen = new g.Sprite({
				scene: this, src: this.assets["combo"], x: 120, y: 90,
				width: 300, height: 74
			});
			uiBase.append(sprRen);
			sprRen.hide();
			const labelRen = new g.Label({
				scene: this, font: numFont72, fontSize: 72, text: "2", x: 0, y: 90, width: 120, textAlign: g.TextAlign.Right, widthAutoAdjust: false
			});
			uiBase.append(labelRen);
			labelRen.hide();

			//連鎖
			let comboCnt = 0;
			const sprCombo = new g.Sprite({
				scene: this, src: this.assets["combo"], x: 120, y: 170,
				srcX: 0, srcY: 74, width: 300, height: 74
			});
			uiBase.append(sprCombo);
			sprCombo.hide();
			const labelCombo = new g.Label({
				scene: this, font: numFont72, fontSize: 72, text: "2", x: 0, y: 170, width: 120, textAlign: g.TextAlign.Right, widthAutoAdjust: false
			});
			uiBase.append(labelCombo);
			labelCombo.hide();

			//グリッド
			for (let i = 1; i < panelNum; i++) {
				base.append(new g.FilledRect({ scene: this, x: i * panelSize + margin - 1, y: margin, width: 2, height: size, cssColor: "green" }));
				base.append(new g.FilledRect({ scene: this, y: i * panelSize + margin - 1, x: margin, height: 2, width: size, cssColor: "green" }));
			}

			//パネル
			const panels: Panel[][] = [];
			for (let y = 0; y < panelNum; y++) {
				panels[y] = [];
				for (let x = 0; x < panelNum; x++) {
					const rect = new Panel({
						scene: this,
						x: panelSize * x + margin,
						y: panelSize * y + margin,
						src: this.assets["panel"]
					});
					base.append(rect);
					panels[y].push(rect);
					rect.hide();
				}
			}

			//ブロック選択用
			const rectSelects: g.FrameSprite[] = [];
			const posX = [370, 470, 370];
			const posY = [80, 160, 240];
			for (let i = 0; i < 3; i++) {
				const rect = new g.FrameSprite({
					scene: this,
					x: posX[i],
					y: posY[i],
					width: 100,
					height: 100,
					src: this.assets["selectArea"] as g.ImageAsset,
					frames: [0, 1, 2, 3]
				});
				base.append(rect);
				rectSelects.push(rect);

				for (let j = 0; j < 9; j++) {
					const r = new g.Sprite({
						scene: this,
						x: 0,
						y: 0,
						width: 30,
						height: 30,
						src: this.assets["panel2"]
					});
					r.hide();
					rect.append(r);
				}
			}

			const panelPos = [
				[[-1, 0], [0, 0], [0, -1]],//くの字2
				[[1, 0], [0, 0], [0, -1]],
				[[1, 0], [0, 0], [0, 1]],
				[[-1, 0], [0, 0], [0, 1]],
				[[-1, 1], [0, 1], [1, 1], [1, 0], [1, -1]],//くの字3
				[[-1, -1], [-1, 0], [-1, 1], [0, 1], [1, 1]],
				[[1, -1], [0, -1], [-1, -1], [-1, 0], [-1, 1]],
				[[-1, -1], [0, -1], [1, -1], [1, 0], [1, 1]],
				[[0, 0], [1, 0]], //直線2
				[[0, 0], [0, 1]],
				[[-1, 0], [0, 0], [1, 0]], //直線3
				[[0, -1], [0, 0], [0, 1]],
				[[-1, 0], [0, 0], [1, 0], [2, 0]],//直線4
				[[0, -1], [0, 0], [0, 1], [0, 2]],
				[[-2, 0], [-1, 0], [0, 0], [1, 0], [2, 0]],//直線5
				[[0, -2], [0, -1], [0, 0], [0, 1], [0, 2]],
				[[0, 0]],//点
				[[-1, 0], [0, 0], [-1, -1], [0, -1]],//四角2
				[[-1, 0], [0, 0], [1, 0], [-1, -1], [0, -1], [1, -1], [-1, 1], [0, 1], [1, 1]]//四角3
			];

			let num = -1;
			const numSelect = [0, 1, 2];

			//プレイヤー

			const playersRect: g.FilledRect[] = [];
			for (let i = 0; i < 9; i++) {
				const player = new g.FilledRect({ scene: this, width: panelSize, height: panelSize, cssColor: "yellow", opacity: 0.8 });
				playersRect.push(player);
				base.append(player);
				player.hide();
			}

			const players: g.Sprite[] = [];
			for (let i = 0; i < 9; i++) {
				const player = new g.Sprite({ scene: this, width: panelSize, height: panelSize, src: this.assets["panel3"] });
				players.push(player);
				base.append(player);
				player.hide();
			}

			//揃ったラインエフェクト用
			const LinesX: g.FilledRect[] = [];
			const LinesY: g.FilledRect[] = [];
			for (let i = 0; i < panelNum; i++) {
				let spr = new g.FilledRect({
					scene: this, x: margin + panelSize * i, y: margin, width: panelSize, height: size,
					cssColor: "yellow"
				});
				LinesX.push(spr);
				this.append(spr);
				spr.hide();

				spr = new g.FilledRect({
					scene: this, y: margin + panelSize * i, x: margin, height: panelSize, width: size,
					cssColor: "yellow", opacity: 0.8
				});
				LinesY.push(spr);
				this.append(spr);
				spr.hide();
			}

			let px = 0;
			let py = 0;
			let isCleaning = false;

			//押したとき
			bg.pointDown.add((ev) => {
				if (!isStart || isCleaning) return;

				const x = ev.point.x;
				const y = ev.point.y;

				for (let i = 0; i < 3; i++) {
					const r = rectSelects[i];
					if (r.x < x && r.y < y && x < r.x + r.width && y < r.y + r.width) {
						num = i;
						rectSelects.forEach((e) => {
							e.frameNumber = (e === r) ? 2 : 0;
							e.modified();
						});
						break;
					}
				}

				if (num === -1) return;
				const panel = panelPos[numSelect[num]];
				for (let i = 0; i < panel.length; i++) {
					players[i].show();
				}

				for (let i = 0; i < panel.length; i++) {
					px = Math.floor((ev.point.x) / panelSize);
					py = Math.floor((ev.point.y) / panelSize);
					const xx = (px + panel[i][0]) * panelSize + margin;
					const yy = (py + panel[i][1]) * panelSize + margin;
					players[i].moveTo(xx, yy);
					players[i].modified();
				}
			});

			//動かしたとき
			bg.pointMove.add((ev) => {
				if (!isStart || isCleaning) return;
				if (num === -1) return;

				px = Math.floor((ev.point.x + ev.startDelta.x - margin) / panelSize);
				py = Math.floor((ev.point.y + ev.startDelta.y - margin) / panelSize);

				//置けるかどうか確認
				let flgSet = true;
				const panel = panelPos[numSelect[num]];
				for (let i = 0; i < panel.length; i++) {
					const x = px + panel[i][0];
					const y = py + panel[i][1];
					if (x < 0 || x >= panelNum || y < 0 || y >= panelNum || panels[y][x].num === 1) {
						flgSet = false;
						break;
					}
				}

				//プレイヤーの移動と透明度設定
				for (let i = 0; i < panel.length; i++) {
					//const x = (px + panel[i][0]) * panelSize + margin;
					//const y = (py + panel[i][1]) * panelSize + margin;

					let x = ((ev.point.x + ev.startDelta.x) + (panel[i][0] * panelSize)) - (panelSize / 2);
					let y = ((ev.point.y + ev.startDelta.y) + (panel[i][1] * panelSize)) - (panelSize / 2);

					players[i].moveTo(x, y);
					players[i].opacity = (flgSet) ? 1.0 : 0.5;
					players[i].modified();

					if (flgSet) {
						x = (px + panel[i][0]) * panelSize + margin;
						y = (py + panel[i][1]) * panelSize + margin;
						playersRect[i].show();
						playersRect[i].moveTo(x, y);
						playersRect[i].modified();
					} else {
						playersRect[i].hide();
					}
				}
			});

			//離したとき
			bg.pointUp.add((ev) => {
				if (!isStart || isCleaning) return;
				if (num === -1) return;

				const panel = panelPos[numSelect[num]];
				px = Math.floor((ev.point.x + ev.startDelta.x - margin) / panelSize);
				py = Math.floor((ev.point.y + ev.startDelta.y - margin) / panelSize);

				//置けるかどうかの確認
				const dx = [0, 1, 0, -1, 0];//補正用
				const dy = [0, 0, 1, 0, -1];

				let flgSet = true;
				for (let j = 0; j < dx.length; j++) {
					flgSet = true;
					for (let i = 0; i < panel.length; i++) {
						const x = px + panel[i][0] + dx[j];
						const y = py + panel[i][1] + dy[j];
						if (x < 0 || x >= panelNum || y < 0 || y >= panelNum || panels[y][x].num === 1) {
							flgSet = false;
							break;
						}
					}
					if (flgSet) {
						px += dx[j];//補正を反映
						py += dy[j];
						break;
					}
				}

				//置けない場合の処理
				if (!flgSet) {
					for (let i = 0; i < panel.length; i++) {
						players[i].hide();
					}
					//num = -1;
					playSound("miss");
					return;
				}

				//ブロック設置
				for (let i = 0; i < panel.length; i++) {
					const x = px + panel[i][0];
					const y = py + panel[i][1];
					panels[y][x].show();
					panels[y][x].num = 1;
					panels[y][x].modified();
					players[i].hide();
					playersRect[i].hide();
				}

				//縦横各列のブロックを確認
				const flgsX: number[] = [];
				for (let x = 0; x < panelNum; x++) {
					let flg = true;
					for (let y = 0; y < panelNum; y++) {
						if (panels[y][x].num !== 1) {
							flg = false;
							break;
						}
					}
					if (flg) flgsX.push(x);
				}

				const flgsY: number[] = [];
				for (let y = 0; y < panelNum; y++) {
					let flg = true;
					for (let x = 0; x < panelNum; x++) {
						if (panels[y][x].num !== 1) {
							flg = false;
							break;
						}
					}
					if (flg) flgsY.push(y);
				}

				//揃っているブロックを消す処理
				flgsX.forEach(x => {
					for (let y = 0; y < panelNum; y++) {
						panels[y][x].num = 0;
					}
					LinesX[x].show();
					timeline.create().every((t: number, d: number) => {
						LinesX[x].scaleY = d;
						LinesX[x].modified();
					}, 100).wait(100).call(() => {
						for (let y = 0; y < panelNum; y++) {
							panels[y][x].hide();
						}
						LinesX[x].hide();
					});
				});

				flgsY.forEach(y => {
					for (let x = 0; x < panelNum; x++) {
						panels[y][x].num = 0;
					}
					LinesY[y].show();
					timeline.create().every((t: number, d: number) => {
						LinesY[y].scaleX = d;
						LinesY[y].modified();
					}, 100).wait(100).call(() => {
						for (let x = 0; x < panelNum; x++) {
							panels[y][x].hide();
						}
						LinesY[y].hide();
					});
				});

				//同時消し情報表示
				const cnt = flgsX.length + flgsY.length;
				if (cnt > 1) {
					sprRen.show();
					labelRen.show();
					labelRen.text = "" + cnt;
					labelRen.invalidate();
					timeline.create().wait(800).call(() => {
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
						timeline.create().wait(800).call(() => {
							sprCombo.hide();
							labelCombo.hide();
						});
					}

					isCleaning = true;
					timeline.create().wait(400).call(() => {
						isCleaning = false;
					});
				} else {
					comboCnt = 0;
				}

				//スコア加算
				if (cnt > 0) {
					const scorePlus = cnt * 100 + ((cnt - 1) * (cnt - 1)) * 80 + ((comboCnt - 1) * 100);
					score += scorePlus;
					g.game.vars.gameState.score = score;

					timeline.create().every((e: number, p: number) => {
						labelScore.text = "" + (score - Math.floor(scorePlus * (1 - p)) + "P");
						labelScore.invalidate();
					}, 500);

					labelScorePlus.text = "+" + scorePlus;
					labelScorePlus.invalidate();
					labelScorePlus.show();

					lineCnt += cnt;

					labelLine.text = "" + lineCnt;
					labelLine.invalidate();
				} else {
					labelScorePlus.hide();
				}

				//選択パネル差し替え
				//console.log(panelListNum + ":" + panelList[panelListNum % 100]);
				numSelect[num] = panelList[panelListNum % 100];
				setPanel(num);
				panelListNum++;
				//num = -1;

				//すべて置けない場合の確認
				let flg = true;
				for (let i = 0; i < rectSelects.length; i++) {
					const p = panelPos[numSelect[i]];
					for (let y = 0; y < panelNum; y++) {
						for (let x = 0; x < panelNum; x++) {
							flg = true;
							for (let j = 0; j < p.length; j++) {
								const xx = x + p[j][0];
								const yy = y + p[j][1];
								if (xx < 0 || xx >= panelNum || yy < 0 || yy >= panelNum || panels[yy][xx].num === 1) {
									flg = false;
									break;
								}
							}
							if (flg) break;
						}
						if (flg) break;
					}
					if (flg) break;
				}

				if (!flg) {
					sprMate.show();
					timeline.create().wait(1500).call(() => {
						sprMate.hide();
						clear();
					});
					playSound("biri");
				} else if (cnt > 0) {
					playSound("clear");
				} else {
					playSound("move");
				}
			});

			//メインループ
			let bkTime = 0;
			const timeLimit = 70;
			let startTime: number = 0;
			this.update.add(() => {
				if (!isStart) return;

				const t = timeLimit - Math.floor((Date.now() - startTime) / 1000);

				if (t <= -1) {
					finishBase.show();
					labelScorePlus.hide();

					isStart = false;

					timeline.create().wait(1500).call(() => {
						if (typeof window !== "undefined" && window.RPGAtsumaru) {
							window.RPGAtsumaru.experimental.scoreboards.setRecord(1, g.game.vars.gameState.score).then(() => {
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
					timeline.create().wait(500).call(() => {
						fg.opacity = 0.0;
						fg.modified();
					});
				}

				bkTime = t;
			});

			const setPanel = (i: number) => {
				//選択パネルセット
				const panel = panelPos[numSelect[i]];
				rectSelects[i].children.forEach((e) => e.hide());
				for (let j = 0; j < panel.length; j++) {
					const x = panel[j][0];
					const y = panel[j][1];
					rectSelects[i].children[j].show();
					rectSelects[i].children[j].x = x * 30 + 40;
					rectSelects[i].children[j].y = y * 30 + 40;
					rectSelects[i].children[j].modified();
				}
			};

			//盤面のクリア
			const clear = () => {
				//パネルをすべて消す
				for (let y = 0; y < panelNum; y++) {
					for (let x = 0; x < panelNum; x++) {
						panels[y][x].hide();
						panels[y][x].num = 0;
					}
				}
				comboCnt = 0;
			};

			//リセット
			const reset = () => {
				panelListNum = 0;
				panelList.length = 0;
				bkTime = 0;
				//パネルの種類の出す順番リストを作成
				while (panelList.length <= 100) {
					const arr: number[] = [];
					for (let i = 0; i < panelPos.length; i++) {
						arr.push(i);
					}
					let m = arr.length - 1;
					while (m) {
						const i = random.get(0, m - 1);
						[arr[m], arr[i]] = [arr[i], arr[m]];
						m--;
					}
					Array.prototype.push.apply(panelList, arr);
				}
				clear();

				//選択用ブロックの表示
				for (let i = 0; i < 3; i++) {
					numSelect[i] = panelList[panelListNum % 100];
					setPanel(i);
					panelListNum++;
				}

				sprStart.show();
				timeline.create().wait(750).call(() => {
					sprStart.hide();
				});

				players.forEach((e) => e.hide());
				playersRect.forEach((e) => e.hide());

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

			};

		});
	}
}

class Panel extends g.Sprite {
	public num: number = 0;
	constructor(param: g.SpriteParameterObject) {
		super(param);
	}
}
