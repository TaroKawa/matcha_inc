// ============================
// Matcha Inc. — Marketing & Advertising
// ============================

import { useRouter } from 'next/router';
import { useGameStore } from '@/store/gameStore';
import { useHydrated } from '@/lib/useHydration';
import Layout from '@/components/Layout';
import { MARKETING_CHANNELS } from '@/lib/gameData';
import { formatMoney } from '@/lib/gameEngine';
import { MarketingChannel } from '@/types/game';

export default function MarketPage() {
  const router = useRouter();
  const hydrated = useHydrated();
  const { initialized, company, campaigns, startCampaign } = useGameStore();

  if (!hydrated) return null;
  if (!initialized) { router.push('/'); return null; }

  const activeCampaigns = campaigns.filter(c => c.isActive);

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-matcha-700">📢 マーケティング・広告</h1>
          <p className="text-bark-light text-sm">知られなければ、存在しないのと同じ</p>
        </div>

        {/* Active Campaigns */}
        {activeCampaigns.length > 0 && (
          <div className="game-card p-5">
            <h2 className="font-bold text-matcha-700 mb-3">🔥 実施中のキャンペーン</h2>
            <div className="space-y-3">
              {activeCampaigns.map((campaign) => {
                const channelData = MARKETING_CHANNELS[campaign.channel];
                const progress = ((campaign.duration - campaign.remainingWeeks) / campaign.duration) * 100;
                return (
                  <div key={campaign.id} className="bg-matcha-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold">{channelData.icon} {channelData.name}</h3>
                      <span className="text-sm text-matcha-600">残り{campaign.remainingWeeks}週</span>
                    </div>
                    <div className="progress-bar mb-2">
                      <div className="progress-bar-fill bg-matcha-500" style={{ width: `${progress}%` }} />
                    </div>
                    <div className="flex justify-between text-xs text-bark-light">
                      <span>効果: ×{campaign.effectiveness}</span>
                      <span>総コスト: {formatMoney(campaign.cost)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Available Channels */}
        <div className="game-card p-5">
          <h2 className="font-bold text-matcha-700 mb-3">📋 広告チャネル</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(Object.entries(MARKETING_CHANNELS) as [MarketingChannel, typeof MARKETING_CHANNELS['flyer']][]).map(([key, data]) => {
              const totalCost = data.weeklyCost * data.duration;
              const canAfford = company.cash >= totalCost;
              const isActive = activeCampaigns.some(c => c.channel === key);
              return (
                <div key={key} className={`game-card p-5 ${isActive ? 'opacity-60' : ''}`}>
                  <div className="flex items-start gap-3 mb-3">
                    <span className="text-3xl">{data.icon}</span>
                    <div className="flex-1">
                      <h3 className="font-bold text-matcha-700">{data.name}</h3>
                      <p className="text-xs text-bark-light mt-1">{data.description}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs mb-3">
                    <div className="bg-cream rounded p-2">
                      <p className="text-bark-light">週コスト</p>
                      <p className="font-bold">{formatMoney(data.weeklyCost)}</p>
                    </div>
                    <div className="bg-cream rounded p-2">
                      <p className="text-bark-light">期間</p>
                      <p className="font-bold">{data.duration}週間</p>
                    </div>
                    <div className="bg-cream rounded p-2">
                      <p className="text-bark-light">効果</p>
                      <p className="font-bold text-green-600">×{data.effectiveness}</p>
                    </div>
                  </div>
                  <div className="text-center text-sm mb-3">
                    <span className="text-bark-light">総コスト: </span>
                    <span className="font-bold text-matcha-700">{formatMoney(totalCost)}</span>
                  </div>
                  <button
                    onClick={() => startCampaign(key)}
                    disabled={!canAfford || isActive}
                    className="btn-matcha w-full text-sm"
                  >
                    {isActive ? '実施中' : canAfford ? '🚀 キャンペーン開始' : '💸 資金不足'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Layout>
  );
}
