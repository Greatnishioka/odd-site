# 世界の奇妙なもの図鑑

世界各地の珍しい物事を、利用者が見つけて投稿し、他の利用者が探索・議論・補足できる日本語の Web メディア。建築や風習だけでなく、ニッチな資格や検定も同じ図鑑に収録する。

仕様は [docs/世界の奇妙なもの図鑑 仕様書.md](docs/世界の奇妙なもの図鑑%20仕様書.md) にある。

## いまの状況（2026-11-17）

- 仕様書 v1.0 ができている
- フレームワークを比べて、**Hono** に決めた（下の「決まったこと」）
- `site/` に Hono のプロジェクトを作った。キャッシュの指定・広告枠・ページ間の移動の土台だけで、記事は仮のデータ。DB・認証・投稿はまだない
- 次は構成の設計（`docs/architecture.md`）を書く

## 決まったこと

| 項目 | 決めたこと | 理由 |
|---|---|---|
| インフラ | Cloudflare（Workers）。構成は参考の site-1 を下敷きにする | 訪問者はほぼ日本から来る。site-1 で運用の実績がある |
| フレームワーク | Hono（hono/jsx）で、全ページを Worker で作る（SSR） | 3 つを本番で比べて、負けた項目がなかった。起動が一番速く（5ms）、HTML の生成も一番速い組（1 ページ 0.47ms）、Worker も一番小さい（gzip 76KB）。認証・投稿・審査などサーバー側の処理が多いサイトにも合う。比べた結果は [bench/2026-11-17-fw/README.md](bench/2026-11-17-fw/README.md) |
| キャッシュ | Workers Cache を Worker の前に置き、完成した HTML を持つ。記事が変わったらタグで消す | キャッシュに載っていれば Worker が動かず、CPU 時間も掛からない |
| ブラウザ側の JS | 素の JS を esbuild で圧縮し、HTML に埋め込む | 記事ページの動く部分（絞り込み・評価・コメント投稿）は gzip 0.7KB で書けた |
| 画面の外を後から読み込むこと | しない。HTML は最初から全部出す | 減るのは約 3KB だけで、往復が 1 回増える。JS だけを遅らせる方式は、JS が届く前のクリックを捨てることが本番で確認された |
| 記事の本文 | Markdown で書き、公開の承認時に markdown-it で HTML に変換して保存する | markdown-it は速く（1 万字で 0.23ms）、既定で安全（生の HTML や `javascript:` のリンクを通さない）。表示のたびに変換しなくて済む |
| MDX | 使わない | 利用者が書いた本文でコードが動いてしまう |
| CSS | Tailwind（CLI でビルドし、HTML に埋め込む）。ページ別に分け、そのページに必要な分だけ埋め込む。今の `site/src/styles/site.css` は仮の素の CSS で、画面を作るときに移す | 素の CSS との差は数 KB で、体感できない。開発者が慣れているほうを選んだ。埋め込みはページごとに毎回かかるので、画面が増えても肥大化しないよう分ける |
| キャッシュの既定 | 何も指定しない応答は `private, no-store` にする。公開ページだけ期限とタグを付ける（`site/src/lib/cache.ts`） | Workers Cache は、指定のない 200 の応答も 2 時間持ってしまう。マイページや管理画面が他人に見えないようにする。公開ページでは Cookie を発行しない（`Set-Cookie` があるとキャッシュされない） |
| 広告 | 広告を前提に作る。配信元の JS は、ページの読み込みが終わり、広告枠が画面に近づいてから読む（`site/src/client/ads.ts`）。枠の高さは先に確保する | 広告の JS は重いので、本文の表示を待たせない。枠の高さを決めておけば、広告が入っても本文がずれない |
| 広告と prerender | 裏で用意しているページ（prerender）では、実際に表示されるまで広告を読まない | 見られていない広告を表示として数えないため |
| 広告を出すページ | 公開記事だけ。ログイン・投稿・管理・非公開のページと、配信対象外の記事には広告の JS を入れない | 仕様書 7 章・AC09 |
| 広告の配信元 | AdSense の形で作っておく。`ADS_ENABLED` と発行者 ID を入れるまでは配信しない | 配信事業者と開始時期は、運営責任者が決める（仕様書 8 章） |
| サイト内の移動 | Speculation Rules の prerender（カーソルを乗せたときに裏で表示まで済ませる）と View Transitions | クリックした瞬間に切り替わり、白く光らない |

## 候補（まだ決めていない）

設計書を書くときに決める。

- データの原本：D1（Drizzle ORM）
- 認証：Better Auth（メール認証・パスワード再設定・管理者の多要素認証）
- メール送信：Cloudflare Email Service か Resend
- 画像：原本は R2、配信は Cloudflare Images
- 時間の掛かる処理（実績の再計算・検索の更新・キャッシュ消去）：Queues
- スパム対策：Turnstile と Rate Limiting
- 管理画面：同じ Worker の `/admin`。手前に Cloudflare Access を置く
- 圧縮：独自ドメインを付けたら、Cloudflare の Compression Rules で zstd を有効にする（Brotli と gzip を残す）。Worker の中では圧縮しない。効果は、デプロイ後に `content-encoding` と転送量で確かめる
- 広告の同意管理（CMP）：EU・英国からのアクセスに広告を出すなら必要

## ディレクトリ

| 場所 | 中身 |
|---|---|
| [site/](site/) | サイト本体（Hono・Cloudflare Workers） |
| [docs/](docs/) | 仕様書（これから設計書も置く） |
| [bench/](bench/) | フレームワーク（Astro・Marko・Hono）と Markdown ライブラリの比較。測り方と結果は [bench/2026-11-17-fw/README.md](bench/2026-11-17-fw/README.md) |

## 開発

```sh
cd site
npm install
npm run dev     # http://localhost:8787 。CSS とブラウザ用の JS は、変えると自動で作り直される
npm run check   # 型の検査（Worker 側とブラウザ側）
npm run types   # wrangler.jsonc を変えたら、Worker の型を作り直す
```

広告を手元で確かめるときは、`npx wrangler dev --var ADS_ENABLED:true --var ADS_CLIENT:ca-pub-…` で起動する。
