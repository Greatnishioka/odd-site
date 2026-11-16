import { Layout, siteName } from '../components/Layout';
import { sampleArticles } from '../lib/sample';

export const HomePage = () => (
	<Layout title={siteName} description="世界各地の珍しい物事を、見つけて投稿し、みんなで補足していく図鑑。">
		<main class="wrap">
			<h1>新着</h1>
			<ul class="cards">
				{sampleArticles.map((a) => (
					<li>
						<a href={`/a/${a.slug}`}>{a.title}</a>
						<p>
							{a.category}・{a.region}
						</p>
						<p>{a.summary}</p>
					</li>
				))}
			</ul>
		</main>
	</Layout>
);
