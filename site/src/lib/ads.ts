// 広告の設定。配信事業者は未定（仕様書 8 章）だが、日本向けで一般的な AdSense の形で作っておく
// - ADS_ENABLED が "true" で、発行者 ID があるときだけ配信する
// - 広告を出すかどうかはページごとに決める（ログイン・投稿・管理・非公開ページ、配信対象外の記事では出さない）
export type AdsConfig = { client: string } | null;

export function adsConfig(env: Cloudflare.Env): AdsConfig {
	if (env.ADS_ENABLED !== 'true' || !/^ca-pub-\d+$/.test(env.ADS_CLIENT)) return null;
	return { client: env.ADS_CLIENT };
}

// 広告枠の種類。高さを先に確保して、広告が入ったときに本文がずれないようにする（CLS）
export const adSlots = {
	// 記事の本文のあと（仕様書 7 章「公開記事の本文後に広告枠を設ける」）
	// slot は AdSense の広告ユニットの ID。広告を始めるときに入れる
	articleEnd: { slot: '', minHeight: 280 },
} as const;

export type AdSlotName = keyof typeof adSlots;
