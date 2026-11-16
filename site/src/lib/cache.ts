// Workers Cache の指定。何も指定しない 200 の応答は、Workers Cache に 2 時間持たれてしまう。
// なので既定は「キャッシュしない」にして（noStoreByDefault）、公開ページだけ cachePublic で期限とタグを付ける
import { cache } from 'cloudflare:workers';
import type { Context, MiddlewareHandler } from 'hono';

type CacheOptions = {
	// Workers Cache に持たせる秒数
	maxAge: number;
	// 期限が切れたあと、古い内容を返しながら取り直してよい秒数
	swr?: number;
	// 消すときに使うタグ（記事なら `a:<記事ID>`）。URL のパスのタグは自動で付ける
	tags?: string[];
};

export const pathTag = (pathname: string) => `path:${pathname}`;

// 公開ページの応答に付ける。Set-Cookie を付けた応答はキャッシュされないので、公開ページでは Cookie を発行しない
export function cachePublic(c: Context, { maxAge, swr = 0, tags = [] }: CacheOptions) {
	c.header('Cloudflare-CDN-Cache-Control', `public, max-age=${maxAge}${swr ? `, stale-while-revalidate=${swr}` : ''}`);
	c.header('Cache-Tag', [...tags, pathTag(new URL(c.req.url).pathname)].join(','));
	// ブラウザには持たせない（記事を直したときに、古い内容が残らないように）。戻るボタンの bfcache は効く
	c.header('Cache-Control', 'public, max-age=0, must-revalidate');
}

export const noStoreByDefault: MiddlewareHandler = async (c, next) => {
	await next();
	if (!c.res.headers.has('Cloudflare-CDN-Cache-Control') && !c.res.headers.has('Cache-Control')) {
		c.header('Cache-Control', 'private, no-store');
	}
};

// 記事の公開・更新・非公開のときに呼ぶ。タグは 1 回に送りすぎないよう分ける
export async function purgeTags(tags: string[]) {
	for (let i = 0; i < tags.length; i += 100) await cache.purge({ tags: tags.slice(i, i + 100) });
}
