// ============================
// Matcha Inc. — Supply Chain / Tea Procurement
// ============================

import { useRouter } from 'next/router';
import { useGameStore } from '@/store/gameStore';
import { useHydrated } from '@/lib/useHydration';
import Layout from '@/components/Layout';
import { formatMoney } from '@/lib/gameEngine';

const ORIGIN_NAMES: Record<string, string> = {
  uji: '宇治（京都）',
  shizuoka: '静岡',
  yame: '八女（福岡）',
  kagoshima: '鹿児島',
  overseas: '海外',
};

const GRADE_NAMES: Record<string, string> = {
  ceremonial: 'セレモニアル（最高級）',
  premium: 'プレミアム',
  culinary: 'クリナリー（ラテ用）',
};

const GRADE_ICONS: Record<string, string> = {
  ceremonial: '🏆',
  premium: '⭐',
  culinary: '🍵',
};

export default function SupplyChainPage() {
  const router = useRouter();
  const hydrated = useHydrated();
  const { initialized, suppliers, activeSupplier, contractSupplier } = useGameStore();

  if (!hydrated) return null;
  if (!initialized) { router.push('/'); return null; }

  const currentSupplier = suppliers.find(s => s.id === activeSupplier);

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-matcha-700">🍃 仕入れ・サプライチェーン</h1>
          <p className="text-bark-light text-sm">最高の一杯は、最高の茶葉から</p>
        </div>

        {/* Current Supplier */}
        <div className="game-card p-5">
          <h2 className="font-bold text-matcha-700 mb-3">📦 現在の仕入れ先</h2>
          {currentSupplier ? (
            <div className="bg-matcha-50 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">{GRADE_ICONS[currentSupplier.grade]}</span>
                <div>
                  <h3 className="font-bold text-matcha-700">{currentSupplier.name}</h3>
                  <p className="text-xs text-bark-light">
                    {ORIGIN_NAMES[currentSupplier.origin]} | {GRADE_NAMES[currentSupplier.grade]}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center text-xs mt-3">
                <div className="bg-white rounded p-2">
                  <p className="text-bark-light">kg単価</p>
                  <p className="font-bold text-matcha-700">{formatMoney(currentSupplier.costPerKg)}</p>
                </div>
                <div className="bg-white rounded p-2">
                  <p className="text-bark-light">品質</p>
                  <p className="font-bold">{currentSupplier.quality}/100</p>
                </div>
                <div className="bg-white rounded p-2">
                  <p className="text-bark-light">安定性</p>
                  <p className="font-bold">{currentSupplier.reliability}/100</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
              <p className="text-sm text-yellow-800">⚠️ 仕入れ先が未設定です。下のリストから選んで契約してください。</p>
            </div>
          )}
        </div>

        {/* Supplier List */}
        <div className="game-card p-5">
          <h2 className="font-bold text-matcha-700 mb-3">🏭 仕入れ先一覧</h2>
          <p className="text-xs text-bark-light mb-4">
            茶葉の品質はお客様の満足度に直結します。高級茶葉は原価が上がりますが、評価も上がります。
          </p>

          <div className="space-y-3">
            {suppliers.map((supplier) => {
              const isActive = supplier.id === activeSupplier;
              const cupCost = Math.round(supplier.costPerKg / 50);
              return (
                <div
                  key={supplier.id}
                  className={`game-card p-4 transition-all ${isActive ? 'game-card-selected bg-matcha-50' : ''}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{GRADE_ICONS[supplier.grade]}</span>
                      <div>
                        <h3 className="font-bold text-matcha-700">{supplier.name}</h3>
                        <p className="text-xs text-bark-light">
                          {ORIGIN_NAMES[supplier.origin]} | {GRADE_NAMES[supplier.grade]}
                        </p>
                      </div>
                    </div>
                    {isActive && (
                      <span className="text-xs bg-matcha-500 text-white px-2 py-1 rounded">契約中</span>
                    )}
                  </div>

                  <div className="grid grid-cols-4 gap-2 text-center text-xs mb-3">
                    <div className="bg-cream rounded p-2">
                      <p className="text-bark-light">kg単価</p>
                      <p className="font-bold">{formatMoney(supplier.costPerKg)}</p>
                    </div>
                    <div className="bg-cream rounded p-2">
                      <p className="text-bark-light">杯単価</p>
                      <p className="font-bold">¥{cupCost}</p>
                    </div>
                    <div className="bg-cream rounded p-2">
                      <p className="text-bark-light">品質</p>
                      <div className="flex items-center justify-center gap-1">
                        <div className="progress-bar flex-1" style={{ height: 6 }}>
                          <div className="progress-bar-fill bg-matcha-500" style={{ width: `${supplier.quality}%` }} />
                        </div>
                        <span className="font-bold">{supplier.quality}</span>
                      </div>
                    </div>
                    <div className="bg-cream rounded p-2">
                      <p className="text-bark-light">安定性</p>
                      <div className="flex items-center justify-center gap-1">
                        <div className="progress-bar flex-1" style={{ height: 6 }}>
                          <div className="progress-bar-fill bg-blue-500" style={{ width: `${supplier.reliability}%` }} />
                        </div>
                        <span className="font-bold">{supplier.reliability}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => contractSupplier(supplier.id)}
                    disabled={isActive}
                    className={`w-full text-sm ${isActive ? 'btn-outline opacity-50' : 'btn-matcha'}`}
                  >
                    {isActive ? '✅ 契約中' : '📝 この仕入れ先と契約する'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Info Box */}
        <div className="game-card p-5 bg-cream">
          <h2 className="font-bold text-matcha-700 mb-2">💡 茶葉グレードガイド</h2>
          <div className="space-y-2 text-sm text-bark-light">
            <p>🏆 <strong>セレモニアルグレード</strong> — 茶道で使われる最高級品。ラテにすると超プレミアムな味わいだが、原価が跳ね上がる。</p>
            <p>⭐ <strong>プレミアムグレード</strong> — ラテに最適なバランス。品質と原価のいいところ取り。</p>
            <p>🍵 <strong>クリナリーグレード</strong> — 製菓・ラテ用。コストパフォーマンスは良いが、味にこだわる客には物足りない。</p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
