// 仮の記事データ。DB（D1 の予定）を作るまで、画面と広告枠・キャッシュの確認に使う
export type Article = {
	id: string;
	slug: string;
	title: string;
	summary: string;
	category: string;
	region: string;
	firstFinder: { name: string; submittedAt: string };
	// 公開の承認時に Markdown から変換して保存した HTML
	bodyHtml: string;
	// 配信対象外の記事は false（仕様書 7 章）
	adsAllowed: boolean;
};

export const sampleArticles: Article[] = [
	{
		id: 'a0001',
		slug: 'upside-down-house',
		title: '逆さまに建てられた家',
		summary: '屋根が地面に着き、床が空を向いている家。中に入ると家具も天井に固定されている。',
		category: '建築・施設',
		region: 'ドイツ',
		firstFinder: { name: '探検家たろう', submittedAt: '2026-09-12T03:21:00.000Z' },
		bodyHtml: '<p>（仮の本文）屋根が地面に着いた形で建てられた家。</p><h2>どうして逆さまなのか</h2><p>（仮の本文）観光客を呼ぶために作られた。</p>',
		adsAllowed: true,
	},
];

export const findArticle = (slug: string) => sampleArticles.find((a) => a.slug === slug);
