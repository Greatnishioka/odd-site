import { raw } from 'hono/html';
import { AdSlot } from '../components/AdSlot';
import { Layout, siteName } from '../components/Layout';
import type { AdsConfig } from '../lib/ads';
import { fmtDate } from '../lib/format';
import type { Article } from '../lib/sample';

export const ArticlePage = ({ a, ads }: { a: Article; ads: AdsConfig }) => (
	<Layout title={`${a.title}｜${siteName}`} description={a.summary} ads={ads}>
		<main class="wrap">
			<article>
				<h1>{a.title}</h1>
				<div class="meta">
					<span>{a.category}</span>
					<span>{a.region}</span>
				</div>
				<p>{a.summary}</p>
				<p class="finder">
					このサイトでの第一発見者：{a.firstFinder.name}（{fmtDate(a.firstFinder.submittedAt)}に提出）
				</p>
				<div class="body">{raw(a.bodyHtml)}</div>
			</article>
			<AdSlot ads={ads} name="articleEnd" />
		</main>
	</Layout>
);
