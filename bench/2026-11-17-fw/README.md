# フレームワークの比較（2026-11-17）

同じ記事ページを Astro・Marko・Hono の 3 つで作り、表示の速さに関わる数字を測った。

## 何を作ったか

- 記事ページ 1 枚：本文 約 1 万字、コメント 50 件、関連記事 6 件、出典 3 件（データは `shared/fixture.json`。`shared/make-fixture.mjs` で作る）
- 動く部分も 3 つで同じ動きにした：コメントの種別での絞り込み、「おもしろい」ボタン、コメントの投稿（文字数の表示つき）
- CSS は 3 つとも同じもの（`shared/styles.css`）を HTML に埋め込む

| | 版 | 動く部分の書き方 |
|---|---|---|
| Astro | astro 7.4.12 ＋ @astrojs/cloudflare 14.4.8 | 素の JS（`shared/client.js`）。Astro が HTML に埋め込む |
| Marko | marko 6.4.16 ＋ @marko/run 0.11.17 ＋ @marko/run-adapter-cloudflare 0.1.1 | Marko のタグ。コメント欄は画面に入ったときに JS を読み込む |
| Hono | hono 4.13.19（hono/jsx） | 素の JS（`shared/client.js` を圧縮したもの）を HTML に埋め込む |

URL に条件を付けると、測る条件を変えられる。

- `?md=1`：本文を表示のたびに Markdown から HTML に変換する（markdown-it）
- `?delay=50`：コメントの取得に 50ms 掛かると仮定し、ストリーミングで後から流す

## 結果

ローカルの wrangler dev（workerd）で測った。本番の Cloudflare では測っていない。

### サーバー（`scripts/measure-server.mjs`）

キャッシュにないときの生成の速さ。Worker の中で同じページを 2,000 回作って割った値。wrangler dev の中継の時間は含めない。

| | 本文は変換済みの HTML | 本文を表示のたびに Markdown から変換 |
|---|---|---|
| Astro | 0.170 ms | 0.447 ms |
| **Marko** | **0.092 ms** | **0.327 ms** |
| Hono | 0.218 ms | 0.455 ms |

Worker のプログラムの大きさ（`wrangler deploy --dry-run`。記事データと markdown-it を含む）

| | そのまま | gzip |
|---|---|---|
| Astro | 748 KB | 198 KB |
| Marko | 453 KB | 112 KB |
| **Hono** | **322 KB** | **76 KB** |

HTML の大きさは 3 つともほぼ同じ（gzip で 8.6〜8.8 KB）。そのうち 35% が、記事本文より後ろ（評価・広告・関連記事・コメント）。

コメントの取得に 50ms 掛かるとき（ストリーミング、20 回の中央値）

| | 最初の 1 バイト | 記事本文の終わりまで | 全体 |
|---|---|---|---|
| Astro | 5.4 ms | 5.4 ms | 60.6 ms |
| Marko | 8.1 ms | 8.1 ms | 59.5 ms |
| Hono | 4.5 ms | 4.7 ms | 59.5 ms |

### ブラウザ（`scripts/measure-browser.mjs`）

Chrome 149。下り 1.6Mbps・CPU を 4 倍遅くした条件。localhost では回線の遅延（RTT）が効かないので、表示時間は 3 つを比べる目安として扱う。

| | FCP | LCP | 最初に読み込む JS（gzip） | スクロール後に読み込む JS（gzip） |
|---|---|---|---|---|
| Astro | 320 ms | 328 ms | 0.7 KB（HTML に埋め込み） | なし |
| Marko | 308 ms | 308 ms | 6.1 KB（うち Marko の実行部分 5.0 KB） | 2.3 KB |
| Hono | 232 ms | 352 ms | 0.7 KB（HTML に埋め込み） | なし |

FCP と LCP は、測るたびに 100ms ほど入れ替わる。3 つの差はこの揺れの範囲に収まっている。

動作の確認（絞り込み・「おもしろい」・投稿・文字数）は 3 つとも合格した。

### Markdown の変換（`md/bench.mjs`、Node 26）

本文 約 1 万字。どれも、生の HTML や `javascript:` のリンクを通さない設定にした。

| ライブラリ | 1 回の変換（中央値） | Worker に足される大きさ（gzip） | 備考 |
|---|---|---|---|
| **markdown-it** | **0.23 ms** | 40 KB | 既定で安全（生の HTML は通さず、危ないリンクも弾く） |
| marked | 0.29 ms | 15 KB | 既定では生の HTML をそのまま通す。エスケープとリンクの確認を自分で足す必要がある |
| micromark | 1.80 ms | 33 KB | 既定で安全 |
| unified（remark ＋ rehype-sanitize） | 2.23 ms | 64 KB | 拡張しやすいが遅い |

### 本番の Cloudflare（`scripts/measure-prod.mjs`、2026-11-17）

3 つを workers.dev にデプロイして測った（測ったあとに削除した）。CPU 時間は Cloudflare が記録した値（`wrangler tail` の `cpuTime`）。本番の Worker の中では、時計が I/O のときにしか進まないので、ローカルの測り方は使えない。tail は短い間隔のリクエストを間引くので、0.7 秒ずつ間を空けて送った。

Worker の起動時間（デプロイ時に表示される Worker Startup Time）

| Astro | Marko | Hono |
|---|---|---|
| 11 ms | 9 ms | **5 ms** |

CPU 時間

| | 新しい Worker での最初の 1 回 | 温まったあとの 1 回（中央値） | 同・Markdown を毎回変換 | Worker の中で 2,000 回作ったときの 1 回あたり | 同・Markdown を毎回変換 |
|---|---|---|---|---|---|
| Astro | 12〜13 ms | 2 ms | 4 ms | 0.86 ms | 1.97 ms |
| Marko | 10〜12 ms | 2 ms | 3 ms | 0.48 ms | 1.30 ms |
| Hono | 7〜10 ms | **1 ms** | **2 ms** | **0.47 ms** | **0.99 ms** |

- 記録は 1ms 単位。1 回ずつの値は丸められるので、細かい差は「2,000 回作ったときの 1 回あたり」で見る
- 本番の CPU はローカルより 3〜5 倍遅かった。Hono はローカルでは 3 つの中で一番遅かったが、本番では Marko と並んだ。ローカルの順位はそのまま当てにならない
- 新しい Worker での最初の 1 回は、JIT が効く前なので 7〜13ms 掛かる

手元（日本・東京）から見た時間（温まったあとの 20 回の中央値）

| | 最初の 1 バイト | 全体 |
|---|---|---|
| Astro | 63 ms | 64 ms |
| Marko | 57 ms | 58 ms |
| Hono | 70 ms | 72 ms |

この差は回線の揺れで、測るたびに順位が入れ替わった（1 回目の測定では Hono 38ms・Marko 41ms・Astro 45ms）。

ブラウザ（下り 1.6Mbps・CPU 4 倍遅い、本物の回線越し、5 回の中央値）

| | FCP | LCP | 最初に読み込む JS | スクロール後に読み込む JS |
|---|---|---|---|---|
| Astro | 504 ms | 504 ms | HTML に埋め込み（0.7 KB） | なし |
| Marko | 488 ms | 488 ms | 6.9 KB | 2.9 KB |
| Hono | 500 ms | 500 ms | HTML に埋め込み（0.7 KB） | なし |

**本番では、Marko の絞り込みが動作確認で失敗した。** コメント欄までスクロールしてから 0.5 秒以内に押したクリックが捨てられた。追加で調べたところ、コメント欄の JS が届くのはスクロールから約 0.1 秒後で、それより前のクリックは何も起こさなかった。届いたあとのクリックは正しく動いた。回線が遅いほど、クリックが捨てられる時間は長くなる。

## わかったこと

### HTML を作る速さ

- ローカルでは Marko が一番速く、Astro の約 2 倍だった。本番では Marko と Hono が並び（0.47〜0.48ms）、Astro はその約 2 倍（0.86ms）だった。差は 1 ページあたり 0.4ms
- このサイトでは、記事ページは Workers Cache から返す。キャッシュに載っていれば Worker は動かないので、この差が出るのはキャッシュにないときだけ
- キャッシュにないときも、DB の往復（数 ms〜数十 ms）と回線の往復のほうがずっと大きい。訪問者が体感できる差にはならない

### ブラウザに送る JS

- このサイトの動く部分（絞り込み・ボタン・投稿フォーム）は小さい。素の JS なら gzip で 0.7KB で済む
- Marko は、自分の実行部分（約 5KB）を毎回読み込むので、素の JS より多くなった
- Marko が有利になるのは、動く部分が大きい画面（投稿の編集画面や管理画面）。ただし、これらはキャッシュしない画面で、表示速度の目標の対象でもない

### スクロールに合わせた読み込み

「スクロールに合わせて読み込む」には 2 種類あり、どちらも今回のページでは得が小さかった。

1. **JS だけを遅らせる（HTML は最初から出す）**：Marko の `load: "visible#…"`。Astro なら `client:visible` が同じ仕組み
   - 減ったのは 2.3KB だけだった
   - **JS が届く前のクリックは捨てられる**（確かめた）。`on-click` を足しても、そのクリックはやり直されない。押してすぐ結果が出るボタンには使えず、使えるのは文字を入力する欄のように、操作に時間が掛かる部品だけ
2. **HTML ごと後から取りに行く**（別のリクエストで、コメントや関連記事を読み込む）
   - 減るのは、本文より後ろの約 3KB（gzip）。1.6Mbps の回線でも 15ms ほど
   - その代わり、読み込むときに往復が 1 回増える（スマホの回線なら 100ms 以上）。リクエストのたびに Worker も動く
   - 検索エンジンから関連記事のリンクやコメントが見えにくくなる。読み込んだときに、画面のずれ（CLS）も起きやすい

画面の外にある部分の描画を軽くしたいなら、CSS の `content-visibility: auto` のほうが安く済む（今回は測っていない）。

### ストリーミング

- 3 つとも、遅い部分（コメント）を待たずに、それより前の部分を先に流せた
- 遅い部分を後から差し込む機能（Marko の `<try>`、Hono の `Suspense`）が効くのは、遅い部分がページの上のほうにあるときだけ。記事ページではコメントが一番下にあるので、上から順に流す Astro と差が出なかった

### Markdown

- **公開の承認時に HTML に変換して保存する**。表示のたびに変換しても +0.25ms（markdown-it）で済むが、毎回同じ処理をする理由はない。変換の処理を Worker に入れずに済めば、Worker も 40KB 小さくなる
- 変換は markdown-it を使う。速く、既定で安全で、独自の書き方（サイト内の記事へのリンクや脚注など）もプラグインで足せる
- **利用者が書く本文に MDX は使わない**。MDX はコードを実行できるので、投稿された内容で任意のコードが動いてしまう
- Markdown の変換と、編集画面のリッチテキストエディタは、どのフレームワークを選んでも同じように使える（変換結果は HTML の文字列で、エディタは投稿画面だけで使う部品）。フレームワークを選ぶ決め手にはならない

### Marko を使って気づいた注意点

- `static` で読み込んだものは、ブラウザ用の JS にも入る。`server` を付け忘れたら、記事データと markdown-it がまるごと入り、ブラウザ用の JS が 185KB になった（直したあとは 5.5KB）
- 上に書いたとおり、遅らせて読み込んだ部品は、JS が届く前のクリックを捨てる
- Cloudflare 用のアダプターは 0.1.1（2026 年 10 月に公開）。README には「`heldOpen` を使わないと、ストリーミングの最後の書き込みが落ちることがある」と書かれている
- Workers Cache のタグ付け（Astro の `Astro.cache.set`）に当たる仕組みはない。ヘッダーを自分で付ける

## 測っていないこと

- D1 を読む時間（3 つとも同じ処理になるので、フレームワークの比較には入れていない）
- 海外からのアクセスと、スマホの実機での表示

## 動かし方

比べたときのコード（各フレームワークの実装・測定スクリプト・データ）は git に載せていない（`bench/.gitignore`）。作った人の手元にだけある。

```sh
# データと圧縮済みの JS を作る
node shared/make-fixture.mjs
md/node_modules/.bin/esbuild shared/client.js --minify --outfile=shared/client.min.js

# それぞれ npm install して起動する（ポートは測定スクリプトに合わせる）
(cd astro && npm run build && npx wrangler dev --port 8802)
(cd marko && npm run build && npx wrangler dev --port 8803 --inspector-port 9240)
(cd hono && npx wrangler dev --port 8801 --inspector-port 9241)

# 測る
(cd scripts && node measure-server.mjs && node measure-browser.mjs)
(cd md && node bench.mjs)

# 本番で測る：3 つを wrangler deploy し、それぞれ tail を動かしてから測る。終わったら wrangler delete で消す
#（scripts/measure-prod.mjs と measure-browser.mjs の workers.dev の URL は、デプロイ先のアカウントに合わせて直す）
npx wrangler tail bench-hono --format json > /tmp/tails/tail-hono.jsonl   # astro・marko も同じ
(cd scripts && node measure-prod.mjs /tmp/tails && PROD=1 node measure-browser.mjs)
```
