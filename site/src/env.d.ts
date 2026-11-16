// scripts/build-assets.mjs が作る、圧縮した CSS とブラウザ用の JS（wrangler.jsonc の rules で文字列として読む）
declare module '*/generated/site.css' {
	const s: string;
	export default s;
}
declare module '*/generated/ads.js' {
	const s: string;
	export default s;
}
