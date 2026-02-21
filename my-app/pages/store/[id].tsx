// ============================
// Matcha Inc. — Store Detail / Operations
// ============================

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useGameStore } from '@/store/gameStore';
import { useHydrated } from '@/lib/useHydration';
import Layout from '@/components/Layout';
import { AREAS, EQUIPMENT_DATA, INTERIOR_DATA } from '@/lib/gameData';
import { formatMoney } from '@/lib/gameEngine';
import { generateReviews } from '@/lib/gemini';

export default function StoreDetailPage() {
  const router = useRouter();
  const hydrated = useHydrated();
  const { id } = router.query;
  const { initialized, stores, employees, properties, addReviewsToStore } = useGameStore();
  const [loadingReviews, setLoadingReviews] = useState(false);

  const store = stores.find(s => s.id === id);

  if (!hydrated) return null;
  if (!initialized) { router.push('/'); return null; }
  if (!store) {
    return (
      <Layout>
        <div className="game-card p-8 text-center">
          <p className="text-bark-light">店舗が見つかりません</p>
          <button onClick={() => router.push('/dashboard')} className="btn-matcha mt-4">ダッシュボードへ</button>
        </div>
      </Layout>
    );
  }

  const area = AREAS.find(a => a.id === store.areaId);
  const property = properties.find(p => p.id === store.propertyId);
  const storeEmployees = employees.filter(e => e.assignedStoreId === store.id);
  const eqData = EQUIPMENT_DATA[store.setup.equipment];
  const intData = INTERIOR_DATA[store.setup.interiorTheme];

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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
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

          {/* Employees */}
          <div className="game-card p-5">
            <h2 className="font-bold text-matcha-700 mb-3">👥 従業員 ({storeEmployees.length}人)</h2>
            {storeEmployees.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-sm text-red-500 mb-2">⚠️ 従業員がいません</p>
                <button onClick={() => router.push('/hr')} className="btn-outline text-sm">人事管理へ</button>
              </div>
            ) : (
              <div className="space-y-2">
                {storeEmployees.map((emp) => (
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
              </div>
            )}
          </div>
        </div>

        {/* Menu */}
        <div className="game-card p-5">
          <h2 className="font-bold text-matcha-700 mb-3">📋 メニュー ({store.menu.length}品)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {store.menu.map((item) => (
              <div key={item.id} className="flex items-center justify-between bg-cream rounded-lg p-3">
                <div>
                  <p className="font-medium text-sm">{item.name}</p>
                  <p className="text-xs text-bark-light">原価: ¥{item.cost}</p>
                </div>
                <div className="font-bold text-matcha-700">¥{item.price}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Customer Reviews */}
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
    </Layout>
  );
}
