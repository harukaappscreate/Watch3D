# Watch3D — haruka_apps Calibre HA-01

A fully procedural **3D mechanical watch** (automatic + flying tourbillon) built with **Three.js r186.1**.
It sits in a boutique vitrine, takes itself apart and reassembles in a loop — and it teaches how a watch works,
in **Japanese and English**.

Three.js r186.1 で作った、完全手続き生成の **3D機械式腕時計**（自動巻き＋フライング・トゥールビヨン）です。
ショーケースに展示され、分解と組立をループで見せ、**日本語／英語**で時計のしくみを学べます。


## ▶ Live demo / デモを試す
**[https://harukaappscreate.github.io/Watch3D/](https://harukaappscreate.github.io/Watch3D/)**

インストール不要。PC・スマホのブラウザでそのまま遊べます（Chrome / Safari / Edge / Firefox の最新版推奨）。
No install needed — runs in any modern desktop or mobile browser.

- デモから始める / Start with the demo loop: [https://harukaappscreate.github.io/Watch3D/?mode=loop](https://harukaappscreate.github.io/Watch3D/?mode=loop)
- 自由に観察する / Explore mode: [https://harukaappscreate.github.io/Watch3D/?mode=explore](https://harukaappscreate.github.io/Watch3D/?mode=explore)
- 動作が重いときは軽量モード / Light mode for slower devices: [https://harukaappscreate.github.io/Watch3D/?q=low](https://harukaappscreate.github.io/Watch3D/?q=low)
- サウンドは右上のボタンでオン / Tap the speaker icon (top right) to enable sound.

---

## 日本語

### 見どころ
- **展示** — ガラスケース、回転台、スポットライト、光の筋と舞う埃。
- **デモ（ループ）** — 時計がケースから浮き上がり、約90個の部品が一気に分解 → 分解したまま動き続ける「生きた分解図」 → 1つずつ組み上がる、をくり返します。振り付けは「層・放射・螺旋・流星」の4種類（設定で固定も可）。30秒操作がないと展示からデモへ自動で切り替わります。
- **観察** — 分解スライダー、時間の速さ（最大1/40のスロー）、X線、断面、ルーペ、巻き上げ、リューズを引いて時刻合わせ（秒針停止）、裏返し。部品をタップすると図鑑が開きます。
- **学ぶ（ガイドツアー9章）** — 巻く → 蓄える → 伝える → 刻む → 整える → 支える（ルビーの石） → 示す → 回る檻（トゥールビヨン） → 自動巻き。光の粒が力の流れを表します。
- **職人ツアー6本** — 宝石職人／仕上げ職人／調速職人／歯車職人／組立職人／ケース・文字盤職人。工程を再現した小さなシーン付き。
- **図鑑** — 52種類の部品（役割・たとえ・素材・歯数・回転時間・つながり）。
- **もしも実験** — 脱進機を外す、ヒゲゼンマイの長さを変える、トゥールビヨンを止める、石を金属にする。
- **用語集** — 本文中の用語をタップで解説（52語）。
- **カスタマイズ** — ケース（スチール／ローズゴールド／イエローゴールド）、文字盤（ブルー／シルバー／ブラック）、ベルト（革／金属）。

### 動かし方
ES Modules を使うため、ローカルサーバー経由で開いてください（ファイルを直接ダブルクリックしても動きません）。
- **macOS**：`start.command` をダブルクリック（初回は右クリック →「開く」）
- **Windows**：`start.bat` をダブルクリック
- **その他**：このフォルダで `python3 -m http.server 8080` を実行し、`http://localhost:8080/` を開く

GitHub Pages でもそのまま動きます（Settings → Pages → Branch: `main` / `(root)`）。

### 操作
| 操作 | PC | スマホ |
|---|---|---|
| 回転 | ドラッグ | 1本指ドラッグ |
| 拡大縮小 | ホイール | ピンチ |
| モード切替 | 下のドック / キー `1`〜`8` | 下のドック |
| ツアー移動 | `←` `→` | 「次へ」ボタン |
| パネルを閉じる | `Esc` | 下にスワイプ |

URLパラメータ：`?mode=loop`（デモから開始）、`?q=low|medium|high`（描画品質を固定）。

---

## English

### Highlights
- **Showcase** — glass vitrine, turntable, spotlight, light beam and drifting dust.
- **Demo loop** — the watch lifts off its cushion, ~90 parts burst apart, keep ticking as a *living exploded view*, then reassemble one by one. Four choreographies: Layers, Bloom, Spiral, Meteor. After 30 s idle in Showcase the demo starts automatically.
- **Explore** — explode slider, time scale (down to 1/40), X-ray, section, loupe, winding, crown pulling with hacking & hand setting, flip. Tap any part to open its card.
- **Learn (9 chapters)** — Winding → Storing → Transmitting → Counting → Regulating → Supporting (ruby jewels) → Displaying → Tourbillon → Self-winding, with a glowing power-flow.
- **Six artisan tours** — Jewel Maker, Finisher, Regulator, Wheel Cutter, Assembler, Case & Dial, with procedural workbench vignettes.
- **Parts encyclopedia** (52 types), **What-if experiments**, **Glossary** (52 terms), **customisation**.

### Run
ES modules need a local web server:
- macOS: double-click `start.command` · Windows: double-click `start.bat`
- or run `python3 -m http.server 8080` here and open `http://localhost:8080/`

Works as-is on GitHub Pages (Settings → Pages → `main` / root).

---

## Project structure / 構成
```
index.html            entry (import map → vendor/three)
css/style.css         UI (responsive: side panel on desktop, bottom sheet on phones)
locales/ja.json en.json   all texts (parts, tours, glossary, UI)
vendor/three/         Three.js r186.1 + addons used (MIT)
js/
  config.js           movement spec (teeth, modules, z-levels), timings, quality tiers
  core/               App, Stage, Quality, Timeline, Settings, i18n, Emitter
  geometry/           GearGeometry (ogival teeth), SDF (2D modelling → shapes), Spring, Small, Sweep
  materials/          Materials, ProceduralTextures (Côtes de Genève, perlage, guilloché, printing…)
  watch/              Watch, Part, Case, Dial, Hands, Strap
    movement/         layout, Mainplate, Train, Tourbillon, Bridges, Winding, Keyless, MotionWorks, kinematics
  demo/               Director, Showcase, Explode, CameraRig, Labels, Explore, choreographies/
  learn/              Tour, Chapters, Widgets, PowerFlow, Glossary, WhatIf, Encyclopedia, Highlight, artisan/
  fx/                 Environment, PostFX, Particles, LightShafts, Trails
  audio/              AudioEngine (Web Audio synthesis)
  ui/                 UI, Panel, icons
```

### Extending / 拡張のしかた
- **New part** — create it in a builder with `W.addPart(id, type, parent, opts)`, set `ex` (explode offset) and add `parts.<type>` to both locale files.
- **New choreography** — add a file in `js/demo/choreographies/` exporting `{ id, offset(part, i, n), from?(part, i) }` and register it in `index.js` (+ `loop.choreo.<id>` / `loop.name.<id>` texts).
- **New tour** — add a file in `js/learn/artisan/` with `{ id, scenes: [...] }`, register it in `artisan/index.js`, and write `artisan.<id>` texts.
- **New language** — copy `locales/en.json`, translate, and add the code to `LANGS` in `js/core/i18n.js`.

## Notes / 注意
- All geometry, finishes and sounds are generated in code. No external models, textures, HDRIs, fonts or audio are used.
- "haruka_apps" and the calibre "HA-01" are original designs; the watch is not modelled on any real brand or product. Mechanisms (Swiss lever escapement, tourbillon, etc.) are generic horological principles.
- Numerical values in the positional-error charts are illustrative.

## License
MIT © 2026 haruka_apps — see [LICENSE](LICENSE). Three.js is MIT licensed (see `vendor/three/LICENSE`).
