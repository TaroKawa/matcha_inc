// ============================
// Matcha Inc. — Store Detail / Operations (Tab-based Management)
// ============================

import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useGameStore } from '@/store/gameStore';
import { useHydrated } from '@/lib/useHydration';
import Layout from '@/components/Layout';
import { AREAS, EQUIPMENT_DATA, INTERIOR_DATA, MARKETING_CHANNELS } from '@/lib/gameData';
import { formatMoney } from '@/lib/gameEngine';
import { generateReviews } from '@/lib/gemini';
import { MarketingChannel } from '@/types/game';

type TabId = 'overview' | 'hr' | 'marketing' | 'menu' | 'reviews';

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'overview', label: '概要', icon: '📊' },
  { id: 'hr', label: '人事', icon: '👥' },
  { id: 'marketing', label: 'マーケ', icon: '📢' },
  { id: 'menu', label: 'メニュー', icon: '📋' },
  { id: 'reviews', label: 'レビュー', icon: '⭐' },
];

export default function StoreDetailPage() {
  const router = useRouter();
  const hydrated = useHydrated();
  const { id } = router.query;
  const {
    initialized, stores, employees, applicants, properties, campaigns, company,
    addReviewsToStore, hireEmployee, fireEmployee, assignEmployee,
    generateApplicants, startCampaign,
  } = useGameStore();

  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [loadingReviews, setLoadingReviews] = useState(false);

  const store = stores.find(s => s.id === id);

  if (!hydrated) return null;
  if (!initialized) { router.push('/'); return null; }
  if (!store) {
    return (
      <Layout>
        <div className="game-card p-8 text-center">
          <p className="text-bark-light">店舗が見つかりません</p>
          <button onClick={() => router.push('/city')} className="btn-matcha mt-4">マップへ戻る</button>
        </div>
      </Layout>
    );
  }

  const area = AREAS.find(a => a.id === store.areaId);
  const property = properties.find(p => p.id === store.propertyId);
  const storeEmployees = employees.filter(e => e.assignedStoreId === store.id);
  const unassignedEmployees = employees.filter(e => !e.assignedStoreId);
  const eqData = EQUIPMENT_DATA[store.setup.equipment];
  const intData = INTERIOR_DATA[store.setup.interiorTheme];
  const activeCampaigns = campaigns.filter(c => c.isActive);

  const handleGenerateReviews = async () => {
    setLoadingReviews(true);
    try {
      const gameState = useGameStore.getState();
      const reviews = await generateReviews(store, gameState);
      const formattedReviews = reviews.map((r, i) => ({
        id: `review-${store.id}-${gameState.currentWeek}-${i}`,
        storeId: store.id,
        customerName: r.customerName,
        rating: r.rating,
        comment: r.comment,
        week: gameState.currentWeek,
      }));
      addReviewsToStore(store.id, formattedReviews);
    } catch (err) {
      console.error(err);
    }
    setLoadingReviews(false);
  };

  const recentReviews = [...store.reviews].reverse().slice(0, 10);

  return (
    <Layout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link href="/city" className="text-matcha-500 hover:text-matcha-600 text-sm">← マップ</Link>
            </div>
            <h1 className="text-2xl font-bold text-matcha-700">🏪 {store.name}</h1>
            <p className="text-bark-light text-sm">{area?.icon} {area?.name} | Week {store.openedWeek}に開店</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-bark-light">顧客満足度</p>
            <p className={`text-3xl font-bold ${store.customerSatisfaction >= 60 ? 'text-green-600' : store.customerSatisfaction >= 40 ? 'text-yellow-600' : 'text-red-600'}`}>
              {store.customerSatisfaction}%
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex overflow-x-auto border-b border-cream-dark -mx-4 px-4">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`store-tab ${activeTab === tab.id ? 'store-tab-active' : ''}`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* === Tab: Overview === */}
        {activeTab === 'overview' && (
          <div className="space-y-4 animate-fade-in">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="game-card p-4">
                <p className="text-xs text-bark-light">👥 週間来客</p>
                <p className="text-xl font-bold text-matcha-700">{store.weeklyCustomers}人</p>
              </div>
              <div className="game-card p-4">
                <p className="text-xs text-bark-light">💰 週間売上</p>
                <p className="text-xl font-bold text-green-600">{formatMoney(store.weeklyRevenue)}</p>
              </div>
              <div className="game-card p-4">
                <p className="text-xs text-bark-light">📉 週間支出</p>
                <p className="text-xl font-bold text-red-500">{formatMoney(store.weeklyExpenses)}</p>
              </div>
              <div className="game-card p-4">
                <p className="text-xs text-bark-light">💹 週間利益</p>
                <p className={`text-xl font-bold ${store.weeklyRevenue - store.weeklyExpenses >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatMoney(store.weeklyRevenue - store.weeklyExpenses)}
                </p>
              </div>
            </div>

            {/* Store Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Setup Info */}
              <div className="game-card p-5">
                <h2 className="font-bold text-matcha-700 mb-3">🏗️ 店舗情報</h2>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-bark-light">物件</span><span>{property?.name}</span></div>
                  <div className="flex justify-between"><span className="text-bark-light">家賃/月</span><span>{formatMoney(property?.rent || 0)}</span></div>
                  <div className="flex justify-between"><span className="text-bark-light">内装</span><span>{intData.icon} {intData.name}</span></div>
                  <div className="flex justify-between"><span className="text-bark-light">設備</span><span>{eqData.icon} {eqData.name}</span></div>
                  <div className="flex justify-between"><span className="text-bark-light">座席</span><span>{store.setup.seatCount}席</span></div>
                  <div className="flex justify-between"><span className="text-bark-light">Wi-Fi</span><span>{store.setup.hasWifi ? '✅' : '❌'}</span></div>
                  <div className="flex justify-between"><span className="text-bark-light">BGM</span><span>{store.setup.hasBgm ? '✅' : '❌'}</span></div>
                </div>
              </div>

              {/* Quick Employee Summary */}
              <div className="game-card p-5">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-bold text-matcha-700">👥 従業員 ({storeEmployees.length}人)</h2>
                  <button onClick={() => setActiveTab('hr')} className="text-xs text-matcha-500 hover:underline">管理 →</button>
                </div>
                {storeEmployees.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-red-500 mb-2">⚠️ 従業員がいません</p>
                    <button onClick={() => setActiveTab('hr')} className="btn-outline text-sm">人事タブへ</button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {storeEmployees.slice(0, 4).map((emp) => (
                      <div key={emp.id} className="flex items-center justify-between text-sm bg-cream rounded-lg p-2">
                        <div>
                          <p className="font-medium">{emp.name}</p>
                          <p className="text-xs text-bark-light">{emp.role === 'manager' ? '👔 マネージャー' : '🍵 バリスタ'}</p>
                        </div>
                        <div className="text-right text-xs">
                          <p>スキル: {emp.skill} | やる気: {emp.motivation}</p>
                        </div>
                      </div>
                    ))}
                    {storeEmployees.length > 4 && (
                      <p className="text-xs text-bark-light text-center">...他{storeEmployees.length - 4}人</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* === Tab: HR (Per-Store) === */}
        {activeTab === 'hr' && (
          <div className="space-y-4 animate-fade-in">
            <div className="game-card p-5">
              <h2 className="font-bold text-matcha-700 mb-1">👥 {store.name}の人事管理</h2>
              <p className="text-xs text-bark-light mb-4">この店舗に配属されている従業員を管理します</p>

              {/* Current Store Employees */}
              <h3 className="font-bold text-sm text-matcha-600 mb-2">📋 配属中の従業員 ({storeEmployees.length}人)</h3>
              {storeEmployees.length === 0 ? (
                <div className="bg-red-50 rounded-lg p-4 mb-4 text-center">
                  <p className="text-sm text-red-600">⚠️ この店舗に従業員がいません。下の一覧から配属してください。</p>
                </div>
              ) : (
                <div className="space-y-2 mb-4">
                  {storeEmployees.map((emp) => (
                    <div key={emp.id} className="bg-cream rounded-lg p-3">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-bold text-sm">
                            {emp.role === 'manager' ? '👔' : '🍵'} {emp.name}
                            <span className="text-xs font-normal text-bark-light ml-2">
                              {emp.age}歳 / {emp.role === 'manager' ? 'マネージャー' : 'バリスタ'}
                            </span>
                          </h4>
                          <p className="text-xs text-bark-light">{emp.background}</p>
                        </div>
                        <span className="text-xs text-bark-light">¥{emp.hourlyWage}/h</span>
                      </div>
                      <div className="grid grid-cols-4 gap-2 text-xs mb-2">
                        <div>
                          <p className="text-bark-light">スキル</p>
                          <div className="progress-bar mt-0.5"><div className="progress-bar-fill bg-blue-500" style={{ width: `${emp.skill}%` }} /></div>
                          <p className="font-bold text-center">{emp.skill}</p>
                        </div>
                        <div>
                          <p className="text-bark-light">スピード</p>
                          <div className="progress-bar mt-0.5"><div className="progress-bar-fill bg-green-500" style={{ width: `${emp.speed}%` }} /></div>
                          <p className="font-bold text-center">{emp.speed}</p>
                        </div>
                        <div>
                          <p className="text-bark-light">やる気</p>
                          <div className="progress-bar mt-0.5"><div className="progress-bar-fill bg-yellow-500" style={{ width: `${emp.motivation}%` }} /></div>
                          <p className="font-bold text-center">{emp.motivation}</p>
                        </div>
                        <div>
                          <p className="text-bark-light">疲労</p>
                          <div className="progress-bar mt-0.5"><div className="progress-bar-fill bg-red-500" style={{ width: `${emp.fatigue}%` }} /></div>
                          <p className="font-bold text-center">{emp.fatigue}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => assignEmployee(emp.id, null)}
                          className="text-xs text-orange-600 border border-orange-300 rounded px-2 py-1 hover:bg-orange-50"
                        >
                          配属解除
                        </button>
                        <button
                          onClick={() => fireEmployee(emp.id)}
                          className="text-xs text-red-500 border border-red-300 rounded px-2 py-1 hover:bg-red-50"
                        >
                          解雇
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Unassigned employees */}
              {unassignedEmployees.length > 0 && (
                <>
                  <h3 className="font-bold text-sm text-matcha-600 mb-2">🔄 未配属の従業員 ({unassignedEmployees.length}人)</h3>
                  <div className="space-y-2 mb-4">
                    {unassignedEmployees.map((emp) => (
                      <div key={emp.id} className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-bold text-sm">
                              {emp.role === 'manager' ? '👔' : '🍵'} {emp.name}
                              <span className="text-xs font-normal text-bark-light ml-1">
                                スキル:{emp.skill} 速度:{emp.speed}
                              </span>
                            </h4>
                          </div>
                          <button
                            onClick={() => assignEmployee(emp.id, store.id)}
                            className="btn-matcha text-xs px-3 py-1"
                          >
                            この店舗に配属
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Applicants */}
              <div className="border-t border-cream-dark pt-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-sm text-matcha-600">📝 応募者リスト ({applicants.length}人)</h3>
                  <button onClick={() => generateApplicants(3)} className="btn-outline text-xs">
                    🔄 新しい応募者
                  </button>
                </div>
                {applicants.length === 0 ? (
                  <p className="text-sm text-bark-light text-center py-3">応募者がいません</p>
                ) : (
                  <div className="space-y-2">
                    {applicants.slice(0, 5).map((app) => (
                      <div key={app.id} className="bg-white rounded-lg p-3 border border-cream-dark">
                        <div className="flex items-center justify-between mb-1">
                          <div>
                            <h4 className="font-bold text-sm">
                              {app.role === 'manager' ? '👔' : '🍵'} {app.name}
                              <span className="text-xs font-normal text-bark-light ml-1">
                                {app.age}歳 | ¥{app.hourlyWage}/h
                              </span>
                            </h4>
                            <p className="text-xs text-bark-light">{app.background} — {app.personality}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs mb-2">
                          <span>スキル:{app.skill}</span>
                          <span>速度:{app.speed}</span>
                        </div>
                        <button
                          onClick={() => {
                            hireEmployee(app.id);
                            // Auto-assign to this store
                            setTimeout(() => assignEmployee(app.id, store.id), 50);
                          }}
                          className="btn-matcha w-full text-xs py-1.5"
                        >
                          ✅ 採用してこの店舗に配属
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* === Tab: Marketing (Per-Store) === */}
        {activeTab === 'marketing' && (
          <div className="space-y-4 animate-fade-in">
            <div className="game-card p-5">
              <h2 className="font-bold text-matcha-700 mb-1">📢 {store.name}のマーケティング</h2>
              <p className="text-xs text-bark-light mb-4">広告キャンペーンで集客力をアップしましょう</p>

              {/* Active Campaigns */}
              {activeCampaigns.length > 0 && (
                <div className="mb-4">
                  <h3 className="font-bold text-sm text-matcha-600 mb-2">🔥 実施中のキャンペーン</h3>
                  <div className="space-y-2">
                    {activeCampaigns.map((campaign) => {
                      const channelData = MARKETING_CHANNELS[campaign.channel];
                      const progress = ((campaign.duration - campaign.remainingWeeks) / campaign.duration) * 100;
                      return (
                        <div key={campaign.id} className="bg-matcha-50 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-bold text-sm">{channelData.icon} {channelData.name}</h4>
                            <span className="text-xs text-matcha-600">残り{campaign.remainingWeeks}週</span>
                          </div>
                          <div className="progress-bar mb-1">
                            <div className="progress-bar-fill bg-matcha-500" style={{ width: `${progress}%` }} />
                          </div>
                          <div className="flex justify-between text-xs text-bark-light">
                            <span>効果: ×{campaign.effectiveness}</span>
                            <span>コスト: {formatMoney(campaign.cost)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Available Channels */}
              <h3 className="font-bold text-sm text-matcha-600 mb-2">📋 広告チャネル</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(Object.entries(MARKETING_CHANNELS) as [MarketingChannel, typeof MARKETING_CHANNELS['flyer']][]).map(([key, data]) => {
                  const totalCost = data.weeklyCost * data.duration;
                  const canAfford = company.cash >= totalCost;
                  const isActive = activeCampaigns.some(c => c.channel === key);
                  return (
                    <div key={key} className={`bg-white rounded-lg p-4 border border-cream-dark ${isActive ? 'opacity-60' : ''}`}>
                      <div className="flex items-start gap-2 mb-2">
                        <span className="text-2xl">{data.icon}</span>
                        <div className="flex-1">
                          <h4 className="font-bold text-sm text-matcha-700">{data.name}</h4>
                          <p className="text-[11px] text-bark-light">{data.description}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-1 text-center text-xs mb-2">
                        <div className="bg-cream rounded p-1.5">
                          <p className="text-bark-light">週</p>
                          <p className="font-bold">{formatMoney(data.weeklyCost)}</p>
                        </div>
                        <div className="bg-cream rounded p-1.5">
                          <p className="text-bark-light">期間</p>
                          <p className="font-bold">{data.duration}週</p>
                        </div>
                        <div className="bg-cream rounded p-1.5">
                          <p className="text-bark-light">効果</p>
                          <p className="font-bold text-green-600">×{data.effectiveness}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => startCampaign(key)}
                        disabled={!canAfford || isActive}
                        className="btn-matcha w-full text-xs py-1.5"
                      >
                        {isActive ? '実施中' : canAfford ? `🚀 開始 (${formatMoney(totalCost)})` : '💸 資金不足'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* === Tab: Menu === */}
        {activeTab === 'menu' && (
          <div className="space-y-4 animate-fade-in">
            <div className="game-card p-5">
              <h2 className="font-bold text-matcha-700 mb-3">📋 メニュー ({store.menu.length}品)</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {store.menu.map((item) => (
                  <div key={item.id} className="flex items-center justify-between bg-cream rounded-lg p-3">
                    <div>
                      <p className="font-medium text-sm">{item.name}</p>
                      <p className="text-xs text-bark-light">原価: ¥{item.cost} | 利益: ¥{item.price - item.cost}</p>
                    </div>
                    <div className="font-bold text-matcha-700">¥{item.price}</div>
                  </div>
                ))}
              </div>
              {store.menu.length === 0 && (
                <p className="text-sm text-bark-light text-center py-4">メニューが設定されていません</p>
              )}
            </div>
          </div>
        )}

        {/* === Tab: Reviews === */}
        {activeTab === 'reviews' && (
          <div className="space-y-4 animate-fade-in">
            <div className="game-card p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-matcha-700">⭐ 顧客レビュー</h2>
                <button
                  onClick={handleGenerateReviews}
                  disabled={loadingReviews}
                  className="btn-outline text-sm"
                >
                  {loadingReviews ? '🔄 生成中...' : '🤖 AIレビュー生成'}
                </button>
              </div>

              {recentReviews.length === 0 ? (
                <p className="text-sm text-bark-light text-center py-4">
                  まだレビューがありません。AIレビュー生成ボタンを押してみましょう！
                </p>
              ) : (
                <div className="space-y-3">
                  {recentReviews.map((review) => (
                    <div key={review.id} className="bg-cream rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">{review.customerName}</span>
                        <span className="text-sm">
                          {Array.from({ length: 5 }, (_, i) => (
                            <span key={i} className={i < review.rating ? 'star-filled' : 'star-empty'}>★</span>
                          ))}
                        </span>
                      </div>
                      <p className="text-sm text-bark-light">{review.comment}</p>
                      <p className="text-xs text-bark-light/50 mt-1">Week {review.week}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
