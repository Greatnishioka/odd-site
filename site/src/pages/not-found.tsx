import { Layout, siteName } from '../components/Layout';

export const NotFoundPage = () => (
	<Layout title={`ページが見つかりません｜${siteName}`}>
		<main class="wrap">
			<h1>ページが見つかりません</h1>
			<p>
				URL が変わったか、記事が公開されていない可能性があります。<a href="/">トップへ戻る</a>
			</p>
		</main>
	</Layout>
);
