// CSS とブラウザ用の JS を圧縮し、src/generated/ に書き出す。Worker はこれを文字列として読み込み、HTML に埋め込む
// （別ファイルとして配らないので、描画を止めるリクエストが増えない）
import { build } from 'esbuild';

const root = new URL('../', import.meta.url).pathname;

await build({
	absWorkingDir: root,
	entryPoints: {
		site: 'src/styles/site.css',
		ads: 'src/client/ads.ts',
	},
	outdir: 'src/generated',
	bundle: true,
	minify: true,
	format: 'esm',
	target: ['chrome120', 'safari17', 'firefox120'],
	logLevel: 'warning',
});
