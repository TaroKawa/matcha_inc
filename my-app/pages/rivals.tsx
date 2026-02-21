// ============================
// Matcha Inc. — Rival Information
// ============================

import { useRouter } from 'next/router';
import { useGameStore } from '@/store/gameStore';
import { useHydrated } from '@/lib/useHydration';
import Layout from '@/components/Layout';
import { AREAS } from '@/lib/gameData';

export default function RivalsPage() {
  const router = useRouter();
  const hydrated = useHydrated();
  const { initialized, rivals, currentWeek } = useGameStore();

  if (!hydrated) return null;
  if (!initialized) { router.push('/'); return null; }

  const activeRivals = rivals.filter(r => r.isActive);
  const upcomingRivals = rivals.filter(r => !r.isActive);

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-matcha-700">⚔️ ライバル情報</h1>
          <p className="text-bark-light text-sm">敵を知り、己を知れば——</p>
        </div>

        {/* Active Rivals */}
        <div className="game-card p-5">
          <h2 className="font-bold text-matcha-700 mb-3">🏪 活動中の競合 ({activeRivals.length}社)</h2>
          {activeRivals.length === 0 ? (
            <p className="text-sm text-bark-light text-center py-4">まだライバルは現れていません... しかし油断は禁物。</p>
          ) : (
            <div className="space-y-4">
              {activeRivals.map((rival) => {
                const area = AREAS.find(a => a.id === rival.areaId);
                return (
                  <div key={rival.id} className="bg-cream rounded-lg p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-bold text-matcha-700">{rival.companyName}</h3>
                        <p className="text-sm text-bark-light">CEO: {rival.ceoName}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded font-bold ${
                        rival.priceLevel === 'low' ? 'bg-blue-100 text-blue-700' :
                        rival.priceLevel === 'high' ? 'bg-purple-100 text-purple-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {rival.priceLevel === 'low' ? '💰 低価格' : rival.priceLevel === 'high' ? '💎 高級' : '⚖️ 中価格'}
                      </span>
                    </div>
                    <p className="text-sm text-bark-light mb-3">{rival.description}</p>
                    <div className="grid grid-cols-4 gap-3 text-center text-xs">
                      <div className="bg-white rounded p-2">
                        <p className="text-bark-light">エリア</p>
                        <p className="font-bold">{area?.icon} {area?.name}</p>
                      </div>
                      <div className="bg-white rounded p-2">
                        <p className="text-bark-light">戦略</p>
                        <p className="font-bold text-matcha-700">{rival.strategy.substring(0, 10)}...</p>
                      </div>
                      <div className="bg-white rounded p-2">
                        <p className="text-bark-light">品質</p>
                        <p className="font-bold">{rival.quality}/100</p>
                      </div>
                      <div className="bg-white rounded p-2">
                        <p className="text-bark-light">市場シェア</p>
                        <p className="font-bold text-red-600">{rival.marketShare}%</p>
                      </div>
                    </div>
                    <div className="mt-3">
                      <p className="text-xs text-bark-light">💡 戦略: {rival.strategy}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Upcoming Rivals */}
        {upcomingRivals.length > 0 && (
          <div className="game-card p-5">
            <h2 className="font-bold text-matcha-700 mb-3">👀 今後の脅威</h2>
            <div className="space-y-2">
              {upcomingRivals.map((rival) => (
                <div key={rival.id} className="bg-white rounded-lg p-3 border border-cream-dark opacity-60">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold">???</span>
                      <span className="text-xs text-bark-light ml-2">未知の競合</span>
                    </div>
                    <span className="text-xs text-bark-light">Week {rival.appearedWeek}頃に出現予定</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
