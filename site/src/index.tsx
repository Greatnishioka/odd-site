// Worker の入り口。ページは表示のたびに作り（SSR）、公開ページは Workers Cache に持たせる
import { Hono } from 'hono';
import { adsConfig } from './lib/ads';
import { cachePublic, noStoreByDefault } from './lib/cache';
import { findArticle } from './lib/sample';
import { ArticlePage } from './pages/article';
import { HomePage } from './pages/home';
import { NotFoundPage } from './pages/not-found';

const app = new Hono<{ Bindings: Cloudflare.Env }>();

app.use(noStoreByDefault);

// 安全のためのヘッダー。広告の配信に必要なもの（リファラーや別ウィンドウ）は止めない
app.use(async (c, next) => {
	await next();
	c.header('X-Content-Type-Options', 'nosniff');
	c.header('X-Frame-Options', 'SAMEORIGIN');
	c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
	c.header('Strict-Transport-Security', 'max-age=31536000');
});

app.get('/', (c) => {
	// 新しい記事を足すたびに変わるので、期限は短めにする
	cachePublic(c, { maxAge: 600, swr: 3600 });
	return c.html('<!doctype html>' + <HomePage />);
});

app.get('/a/:slug', (c) => {
	const a = findArticle(c.req.param('slug'));
	if (!a) return c.notFound();
	// 記事が変わったら a:<記事ID> のタグで消すので、期限は長くてよい
	cachePublic(c, { maxAge: 31536000, swr: 86400, tags: [`a:${a.id}`] });
	const ads = a.adsAllowed ? adsConfig(c.env) : null;
	return c.html('<!doctype html>' + <ArticlePage a={a} ads={ads} />);
});

app.get('/robots.txt', (c) => {
	cachePublic(c, { maxAge: 86400 });
	return c.text('User-agent: *\nDisallow: /admin/\nDisallow: /api/\nDisallow: /me/\n');
});

app.notFound((c) => {
	// でたらめな URL を叩くボットが毎回 Worker まで届かないよう、404 も少しだけ持たせる
	cachePublic(c, { maxAge: 300 });
	return c.html('<!doctype html>' + <NotFoundPage />, 404);
});

export default app;
