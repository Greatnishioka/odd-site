// 日本時間の「2026年9月12日」。日時は UTC で保存し、表示するときだけ変える
export const fmtDate = (iso: string) => {
	const d = new Date(Date.parse(iso) + 9 * 3600 * 1000);
	return `${d.getUTCFullYear()}年${d.getUTCMonth() + 1}月${d.getUTCDate()}日`;
};
