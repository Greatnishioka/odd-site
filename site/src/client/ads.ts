// 広告の読み込み。表示を遅らせないよう、次の 3 つがそろってから配信元の JS を読む
// 1. prerender 中ではない。Speculation Rules で裏で用意しているページは、実際に表示されるまで待つ（見られていない広告を数えないため）
// 2. ページの読み込みが終わり、ブラウザの手が空いた
// 3. 広告枠が画面に近づいた（1 画面ぶん手前）
// 配信元の JS が読めなくても、閲覧・探索・コメントは続けられるようにする（仕様書 AC09）
declare global {
	interface Window {
		adsbygoogle?: object[];
	}
}

const activated = new Promise<void>((resolve) => {
	if ((document as Document & { prerendering?: boolean }).prerendering) {
		document.addEventListener('prerenderingchange', () => resolve(), { once: true });
	} else resolve();
});
const loaded = new Promise<void>((resolve) => {
	if (document.readyState === 'complete') resolve();
	else addEventListener('load', () => resolve(), { once: true });
});
const idle = () =>
	new Promise<void>((resolve) => ('requestIdleCallback' in window ? requestIdleCallback(() => resolve(), { timeout: 2000 }) : setTimeout(resolve, 200)));

let script: Promise<void> | undefined;
const loadScript = (client: string) =>
	(script ??= new Promise((resolve, reject) => {
		const s = document.createElement('script');
		s.async = true;
		s.crossOrigin = 'anonymous';
		s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(client)}`;
		s.onload = () => resolve();
		s.onerror = () => reject(new Error('広告の JS を読めませんでした'));
		document.head.append(s);
	}));

const slots = document.querySelectorAll<HTMLElement>('ins.adsbygoogle[data-ad-client]');
if (slots.length) {
	await activated;
	await loaded;
	await idle();
	const io = new IntersectionObserver(
		(entries) => {
			for (const e of entries) {
				if (!e.isIntersecting) continue;
				io.unobserve(e.target);
				(window.adsbygoogle ||= []).push({});
				loadScript((e.target as HTMLElement).dataset.adClient!).catch(() => {});
			}
		},
		{ rootMargin: '100% 0px' },
	);
	for (const s of slots) io.observe(s);
}

export {};
