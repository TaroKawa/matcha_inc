// ============================
// Matcha Inc. — Main Dashboard
// ============================

import { useRouter } from 'next/router';
import { useGameStore } from '@/store/gameStore';
import { useHydrated } from '@/lib/useHydration';
import Layout from '@/components/Layout';
import { formatMoney, PHASE_NAMES } from '@/lib/gameEngine';
import { AREAS } from '@/lib/gameData';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const RechartsArea = dynamic(
  () => import('recharts').then(mod => mod.AreaChart),
  { ssr: false }
);
const Area = dynamic(() => import('recharts').then(mod => mod.Area), { ssr: false });
const XAxis = dynamic(() => import('recharts').then(mod => mod.XAxis), { ssr: false });
const YAxis = dynamic(() => import('recharts').then(mod => mod.YAxis), { ssr: false });
const Tooltip = dynamic(() => import('recharts').then(mod => mod.Tooltip), { ssr: false });
const ResponsiveContainer = dynamic(
  () => import('recharts').then(mod => mod.ResponsiveContainer),
  { ssr: false }
);

export default function DashboardPage() {
  const router = useRouter();
  const hydrated = useHydrated();
  const {
    initialized, currentWeek, gamePhase, gameOver, gameOverReason,
    company, stores, employees, notifications, weeklyHistory,
    nextWeek, resetGame,
  } = useGameStore();

  if (!hydrated) return null;

  if (!initialized) {
    router.push('/');
    return null;
  }

  if (gameOver) {
    return (
      <div className="min-h-screen bg-matcha-800 flex items-center justify-center">
        <div className="game-card p-12 text-center max-w-lg">
          <span className="text-6xl block mb-4">💀</span>
          <h1 className="text-3xl font-bold text-red-600 mb-4">GAME OVER</h1>
          <p className="text-bark-light mb-6">{gameOverReason}</p>
          <div className="space-y-3">
            <p className="text-sm text-bark-light">最終成績: Week {currentWeek}</p>
            <p className="text-sm text-bark-light">総売上: {formatMoney(company.totalRevenue)}</p>
            <p className="text-sm text-bark-light">店舗数: {stores.length}</p>
          </div>
          <button
            onClick={() => { resetGame(); router.push('/'); }}
            className="btn-matcha mt-8 px-8"
          >
            タイトルに戻る
          </button>
        </div>
      </div>
    );
  }

  const openStores = stores.filter(s => s.isOpen);
  const weeklyProfit = company.weeklyRevenue - company.weeklyExpenses;
  const assignedEmployees = employees.filter(e => e.assignedStoreId);

  // Chart data (last 20 weeks)
  const chartData = weeklyHistory.slice(-20).map(h => ({
    week: `W${h.week}`,
    収益: h.revenue,
    支出: h.expenses,
    資金: h.cash,
  }));

  return (
    <Layout>
      <div className="space-y-6">
        {/* Week Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link href="/city" className="text-matcha-500 hover:text-matcha-600 text-sm">← マップに戻る</Link>
            </div>
            <h1 className="text-2xl font-bold text-matcha-700">
              📊 ダッシュボード
            </h1>
            <p className="text-bark-light text-sm">{PHASE_NAMES[gamePhase]} — Week {currentWeek}</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/city" className="btn-outline text-sm px-4 py-2">
              🗺️ マップ
            </Link>
            <button
              onClick={nextWeek}
              className="btn-matcha px-6 py-3 text-lg shadow-lg animate-pulse-glow"
            >
              ⏭️ 次の週へ進む
            </button>
          </div>
        </div>

        {/* Notifications */}
        {notifications.length > 0 && (
          <div className="space-y-2">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className={`game-card p-4 border-l-4 ${
                  notif.type === 'opportunity' ? 'border-l-green-500 bg-green-50' :
                  notif.type === 'crisis' ? 'border-l-red-500 bg-red-50' :
                  'border-l-blue-500 bg-blue-50'
                }`}
              >
                <h3 className="font-bold text-sm">{notif.title}</h3>
                <p className="text-xs text-bark-light mt-1">{notif.description}</p>
              </div>
            ))}
          </div>
        )}

        {/* Financial Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="game-card p-4">
            <p className="text-xs text-bark-light mb-1">💰 総資金</p>
            <p className={`text-xl font-bold ${company.cash < 0 ? 'text-red-600' : 'text-matcha-700'}`}>
              {formatMoney(company.cash)}
            </p>
          </div>
          <div className="game-card p-4">
            <p className="text-xs text-bark-light mb-1">📈 週間収益</p>
            <p className="text-xl font-bold text-matcha-600">
              {formatMoney(company.weeklyRevenue)}
            </p>
          </div>
          <div className="game-card p-4">
            <p className="text-xs text-bark-light mb-1">📉 週間支出</p>
            <p className="text-xl font-bold text-red-500">
              {formatMoney(company.weeklyExpenses)}
            </p>
          </div>
          <div className="game-card p-4">
            <p className="text-xs text-bark-light mb-1">💹 週間利益</p>
            <p className={`text-xl font-bold ${weeklyProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatMoney(weeklyProfit)}
            </p>
          </div>
        </div>

        {/* Chart */}
        {chartData.length > 1 && (
          <div className="game-card p-4">
            <h2 className="font-bold text-matcha-700 mb-3">📊 資金推移</h2>
            <div style={{ width: '100%', height: 200 }}>
              <ResponsiveContainer>
                <RechartsArea data={chartData}>
                  <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => `¥${(v/10000).toFixed(0)}万`} />
                  <Tooltip />
                  <Area type="monotone" dataKey="資金" stroke="#4A7C59" fill="#4A7C59" fillOpacity={0.2} />
                  <Area type="monotone" dataKey="収益" stroke="#22c55e" fill="#22c55e" fillOpacity={0.1} />
                  <Area type="monotone" dataKey="支出" stroke="#ef4444" fill="#ef4444" fillOpacity={0.1} />
                </RechartsArea>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Store Cards */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-matcha-700 text-lg">🏪 店舗一覧</h2>
            <Link href="/real-estate" className="btn-outline text-sm">
              + 新規出店
            </Link>
          </div>

          {openStores.length === 0 ? (
            <div className="game-card p-8 text-center">
              <span className="text-4xl block mb-3">🏠</span>
              <p className="text-bark-light mb-4">まだ店舗がありません。物件を探して最初の1店舗をオープンしましょう！</p>
              <Link href="/real-estate" className="btn-matcha">物件を探す</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {openStores.map((store) => {
                const area = AREAS.find(a => a.id === store.areaId);
                const storeEmployees = employees.filter(e => e.assignedStoreId === store.id);
                return (
                  <Link key={store.id} href={`/store/${store.id}`} className="game-card p-4 block">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-matcha-700">{store.name}</h3>
                        <p className="text-xs text-bark-light">{area?.icon} {area?.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-bark-light">満足度</p>
                        <p className={`font-bold ${store.customerSatisfaction >= 60 ? 'text-green-600' : store.customerSatisfaction >= 40 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {store.customerSatisfaction}%
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="bg-matcha-50 rounded p-2">
                        <p className="text-bark-light">客数/週</p>
                        <p className="font-bold text-matcha-700">{store.weeklyCustomers}</p>
                      </div>
                      <div className="bg-matcha-50 rounded p-2">
                        <p className="text-bark-light">売上/週</p>
                        <p className="font-bold text-matcha-700">{formatMoney(store.weeklyRevenue)}</p>
                      </div>
                      <div className="bg-matcha-50 rounded p-2">
                        <p className="text-bark-light">従業員</p>
                        <p className="font-bold text-matcha-700">{storeEmployees.length}人</p>
                      </div>
                    </div>
                    {storeEmployees.length === 0 && (
                      <p className="text-xs text-red-500 mt-2">⚠️ 従業員がいません！人事管理から配置してください。</p>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="game-card p-4 text-center">
            <p className="text-xs text-bark-light">👥 総従業員</p>
            <p className="text-2xl font-bold text-matcha-700">{assignedEmployees.length}</p>
          </div>
          <div className="game-card p-4 text-center">
            <p className="text-xs text-bark-light">⭐ ブランド評判</p>
            <p className="text-2xl font-bold text-matcha-700">{Math.round(company.brandReputation)}</p>
          </div>
          <div className="game-card p-4 text-center">
            <p className="text-xs text-bark-light">📊 累計売上</p>
            <p className="text-lg font-bold text-matcha-700">{formatMoney(company.totalRevenue)}</p>
          </div>
          <div className="game-card p-4 text-center">
            <p className="text-xs text-bark-light">📊 累計支出</p>
            <p className="text-lg font-bold text-red-500">{formatMoney(company.totalExpenses)}</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="game-card p-4">
          <h2 className="font-bold text-matcha-700 mb-3">⚡ クイックアクション</h2>
          <div className="flex flex-wrap gap-2">
            <Link href="/real-estate" className="btn-outline text-sm">🏠 物件探し</Link>
            <Link href="/hr" className="btn-outline text-sm">👥 人事管理</Link>
            <Link href="/supply-chain" className="btn-outline text-sm">🍃 仕入れ</Link>
            <Link href="/market" className="btn-outline text-sm">📢 広告</Link>
            <Link href="/finance" className="btn-outline text-sm">💰 財務</Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
