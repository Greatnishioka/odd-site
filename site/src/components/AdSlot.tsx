// 広告枠。広告を出さないページ（ads が null）では何も出さない（空の枠を残さない）
import { adSlots, type AdsConfig, type AdSlotName } from '../lib/ads';

export const AdSlot = ({ ads, name }: { ads: AdsConfig; name: AdSlotName }) => {
	if (!ads) return null;
	const { slot, minHeight } = adSlots[name];
	return (
		<aside class="ad" aria-label="広告" style={`min-height:${minHeight}px`}>
			<p class="ad-label">広告</p>
			<ins class="adsbygoogle" style="display:block" data-ad-client={ads.client} data-ad-slot={slot} data-ad-format="auto" data-full-width-responsive="true"></ins>
		</aside>
	);
};
