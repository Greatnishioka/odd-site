// 全ページの外枠。CSS は HTML に埋め込み、フォントはシステムフォントにして、描画を止める読み込みを作らない
import type { Child } from 'hono/jsx';
import { raw } from 'hono/html';
import css from '../generated/site.css';
import adsJs from '../generated/ads.js';
import type { AdsConfig } from '../lib/ads';

export const siteName = '世界の奇妙なもの図鑑';

// サイト内のリンクは、カーソルを乗せたり指で触れたりしたときに、裏で表示まで済ませておく（prerender）。
// 開くと状態が変わるページや、毎回中身が変わるページは除く
const speculationRules = JSON.stringify({
	prerender: [
		{
			where: {
				and: [
					{ href_matches: '/*' },
					{
						not: {
							or: [
								{ href_matches: '/admin/*' },
								{ href_matches: '/api/*' },
								{ href_matches: '/me/*' },
								{ href_matches: '/login' },
								{ href_matches: '/logout' },
								{ href_matches: '/random' },
							],
						},
					},
					{ not: { selector_matches: '[data-no-prerender]' } },
				],
			},
			eagerness: 'moderate',
		},
	],
});

type Props = {
	title: string;
	description?: string;
	// 広告を出すページだけ渡す。渡さなければ、広告の JS は HTML に入らない
	ads?: AdsConfig;
	children: Child;
};

export const Layout = ({ title, description, ads, children }: Props) => (
	<html lang="ja">
		<head>
			<meta charset="utf-8" />
			<meta name="viewport" content="width=device-width,initial-scale=1" />
			<title>{title}</title>
			{description && <meta name="description" content={description} />}
			<style>{raw(css)}</style>
			<script type="speculationrules">{raw(speculationRules)}</script>
		</head>
		<body>
			<header class="hd">
				<div class="wrap">
					<a class="logo" href="/">
						{siteName}
					</a>
				</div>
			</header>
			{children}
			<footer class="ft">
				<div class="wrap">© {siteName}</div>
			</footer>
			{ads && <script type="module">{raw(adsJs)}</script>}
		</body>
	</html>
);
