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
      <div className="min-h-screen bg-matcha-900 flex items-center justify-center p-4">
        <div className="game-card p-12 text-center max-w-lg w-full bg-white shadow-2xl border-none">
          <span className="text-6xl block mb-6">💀</span>
          <h1 className="text-3xl font-black text-red-600 mb-4 tracking-tight">GAME OVER</h1>
          <p className="text-bark-light mb-8 text-lg font-medium">{gameOverReason}</p>
          <div className="space-y-4 bg-gray-50 p-6 rounded-xl border border-gray-100">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500 font-bold uppercase tracking-wider">Final Week</span>
              <span className="font-mono text-xl font-bold text-gray-800">{currentWeek}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500 font-bold uppercase tracking-wider">Total Revenue</span>
              <span className="font-mono text-xl font-bold text-matcha-600">{formatMoney(company.totalRevenue)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500 font-bold uppercase tracking-wider">Stores</span>
              <span className="font-mono text-xl font-bold text-gray-800">{stores.length}</span>
            </div>
          </div>
          <button
            onClick={() => { resetGame(); router.push('/'); }}
            className="btn-matcha mt-10 px-8 py-3 w-full text-lg shadow-lg hover:shadow-xl transition-all"
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
      <div className="space-y-8 pb-12">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-widest uppercase bg-matcha-100 text-matcha-700 border border-matcha-200">
                {PHASE_NAMES[gamePhase]}
              </span>
              <span className="text-gray-400 text-xs font-mono">Week {currentWeek}</span>
            </div>
            <h1 className="text-3xl font-black text-gray-800 tracking-tight">
              Dashboard
            </h1>
            <p className="text-gray-500 text-sm mt-1">経営状況のサマリーと主要指標</p>
          </div>
          
          <div className="flex items-center gap-3">
            <Link href="/city" className="btn-outline text-sm px-5 py-2.5 flex items-center gap-2 bg-white hover:bg-gray-50">
              <span>🗺️</span> マップ
            </Link>
            <button
              onClick={nextWeek}
              className="btn-matcha px-6 py-2.5 text-sm md:text-base flex items-center gap-2 shadow-lg hover:shadow-xl shadow-matcha-500/20"
            >
              <span>⏭️</span> 次の週へ
            </button>
          </div>
        </div>

        {/* Notifications Area */}
        {notifications.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider ml-1">Notifications</h2>
            <div className="grid gap-3">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`relative overflow-hidden rounded-xl border p-4 shadow-sm transition-all hover:shadow-md ${
                    notif.type === 'opportunity' ? 'bg-gradient-to-r from-green-50 to-white border-green-200' :
                    notif.type === 'crisis' ? 'bg-gradient-to-r from-red-50 to-white border-red-200' :
                    'bg-gradient-to-r from-blue-50 to-white border-blue-200'
                  }`}
                >
                  <div className={`absolute top-0 left-0 w-1 h-full ${
                    notif.type === 'opportunity' ? 'bg-green-500' :
                    notif.type === 'crisis' ? 'bg-red-500' : 'bg-blue-500'
                  }`} />
                  <div className="pl-3">
                    <h3 className={`font-bold text-sm mb-1 ${
                      notif.type === 'opportunity' ? 'text-green-800' :
                      notif.type === 'crisis' ? 'text-red-800' : 'text-blue-800'
                    }`}>{notif.title}</h3>
                    <p className="text-xs text-gray-600 leading-relaxed">{notif.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="game-card p-5 flex flex-col justify-between h-full bg-gradient-to-br from-white to-gray-50">
            <div className="flex items-center justify-between mb-4">
              <span className="p-2 rounded-lg bg-yellow-100 text-yellow-600 text-xl">💰</span>
              <span className={`text-xs font-bold px-2 py-1 rounded-full ${company.cash >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {company.cash >= 0 ? 'Safe' : 'Danger'}
              </span>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Total Cash</p>
              <p className={`text-2xl font-black tracking-tight ${company.cash < 0 ? 'text-red-600' : 'text-gray-800'}`}>
                {formatMoney(company.cash)}
              </p>
            </div>
          </div>

          <div className="game-card p-5 flex flex-col justify-between h-full bg-gradient-to-br from-white to-gray-50">
            <div className="flex items-center justify-between mb-4">
              <span className="p-2 rounded-lg bg-blue-100 text-blue-600 text-xl">📈</span>
              <span className="text-xs font-bold px-2 py-1 rounded-full bg-blue-50 text-blue-600">Weekly</span>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Revenue</p>
              <p className="text-2xl font-black tracking-tight text-blue-600">
                {formatMoney(company.weeklyRevenue)}
              </p>
            </div>
          </div>

          <div className="game-card p-5 flex flex-col justify-between h-full bg-gradient-to-br from-white to-gray-50">
            <div className="flex items-center justify-between mb-4">
              <span className="p-2 rounded-lg bg-red-100 text-red-600 text-xl">📉</span>
              <span className="text-xs font-bold px-2 py-1 rounded-full bg-red-50 text-red-600">Costs</span>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Expenses</p>
              <p className="text-2xl font-black tracking-tight text-red-500">
                {formatMoney(company.weeklyExpenses)}
              </p>
            </div>
          </div>

          <div className="game-card p-5 flex flex-col justify-between h-full bg-gradient-to-br from-white to-gray-50">
            <div className="flex items-center justify-between mb-4">
              <span className="p-2 rounded-lg bg-matcha-100 text-matcha-600 text-xl">💹</span>
              <span className={`text-xs font-bold px-2 py-1 rounded-full ${weeklyProfit >= 0 ? 'bg-matcha-50 text-matcha-700' : 'bg-red-50 text-red-700'}`}>
                Net
              </span>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Profit</p>
              <p className={`text-2xl font-black tracking-tight ${weeklyProfit >= 0 ? 'text-matcha-600' : 'text-red-600'}`}>
                {formatMoney(weeklyProfit)}
              </p>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Charts & Quick Actions */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Chart */}
            <div className="game-card p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-matcha-500 rounded-full"></span>
                  資金推移
                </h2>
                <div className="flex gap-2 text-xs">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-matcha-500"></span>資金</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span>収益</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span>支出</span>
                </div>
              </div>
              
              {chartData.length > 1 ? (
                <div style={{ width: '100%', height: 280 }}>
                  <ResponsiveContainer>
                    <RechartsArea data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorCash" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#65a30d" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#65a30d" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis 
                        dataKey="week" 
                        tick={{ fontSize: 10, fill: '#9ca3af' }} 
                        axisLine={false}
                        tickLine={false}
                        tickMargin={10}
                      />
                      <YAxis 
                        tick={{ fontSize: 10, fill: '#9ca3af' }} 
                        tickFormatter={(v: number) => `¥${(v/10000).toFixed(0)}万`} 
                        axisLine={false}
                        tickLine={false}
                        tickMargin={10}
                      />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                        labelStyle={{ color: '#6b7280', fontSize: '10px', marginBottom: '4px' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="資金" 
                        stroke="#65a30d" 
                        strokeWidth={3}
                        fill="url(#colorCash)" 
                        animationDuration={1500}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="収益" 
                        stroke="#22c55e" 
                        strokeWidth={2}
                        strokeDasharray="4 4"
                        fill="none" 
                        opacity={0.6}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="支出" 
                        stroke="#ef4444" 
                        strokeWidth={2}
                        strokeDasharray="4 4"
                        fill="none" 
                        opacity={0.6}
                      />
                    </RechartsArea>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[280px] flex items-center justify-center bg-gray-50 rounded-xl border border-dashed border-gray-200 text-gray-400 text-sm">
                  データ収集中...
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="game-card p-6">
              <h2 className="font-bold text-gray-800 text-lg mb-4 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-yellow-500 rounded-full"></span>
                クイックアクション
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                <Link href="/real-estate" className="flex flex-col items-center justify-center p-4 rounded-xl border border-gray-200 hover:border-matcha-300 hover:bg-matcha-50 transition-all group">
                  <span className="text-2xl mb-2 group-hover:scale-110 transition-transform">🏠</span>
                  <span className="text-xs font-bold text-gray-600">物件探し</span>
                </Link>
                <Link href="/hr" className="flex flex-col items-center justify-center p-4 rounded-xl border border-gray-200 hover:border-matcha-300 hover:bg-matcha-50 transition-all group">
                  <span className="text-2xl mb-2 group-hover:scale-110 transition-transform">👥</span>
                  <span className="text-xs font-bold text-gray-600">人事管理</span>
                </Link>
                <Link href="/supply-chain" className="flex flex-col items-center justify-center p-4 rounded-xl border border-gray-200 hover:border-matcha-300 hover:bg-matcha-50 transition-all group">
                  <span className="text-2xl mb-2 group-hover:scale-110 transition-transform">🍃</span>
                  <span className="text-xs font-bold text-gray-600">仕入れ</span>
                </Link>
                <Link href="/market" className="flex flex-col items-center justify-center p-4 rounded-xl border border-gray-200 hover:border-matcha-300 hover:bg-matcha-50 transition-all group">
                  <span className="text-2xl mb-2 group-hover:scale-110 transition-transform">📢</span>
                  <span className="text-xs font-bold text-gray-600">広告</span>
                </Link>
                <Link href="/finance" className="flex flex-col items-center justify-center p-4 rounded-xl border border-gray-200 hover:border-matcha-300 hover:bg-matcha-50 transition-all group">
                  <span className="text-2xl mb-2 group-hover:scale-110 transition-transform">💰</span>
                  <span className="text-xs font-bold text-gray-600">財務</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Right Column: Stores & Stats */}
          <div className="space-y-6">
            
            {/* Store List Summary */}
            <div className="game-card p-6 h-full flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-blue-500 rounded-full"></span>
                  店舗一覧
                </h2>
                <Link href="/real-estate" className="text-xs font-bold text-matcha-600 hover:underline">
                  + 新規出店
                </Link>
              </div>

              <div className="flex-1 space-y-3">
                {openStores.length === 0 ? (
                  <div className="text-center py-8 px-4 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    <span className="text-3xl block mb-2">🏪</span>
                    <p className="text-gray-500 text-sm mb-4">まだ店舗がありません</p>
                    <Link href="/real-estate" className="btn-matcha text-xs px-4 py-2">物件を探す</Link>
                  </div>
                ) : (
                  openStores.map((store) => {
                    const area = AREAS.find(a => a.id === store.areaId);
                    return (
                      <Link key={store.id} href={`/store/${store.id}`} className="block group">
                        <div className="p-4 rounded-xl border border-gray-100 bg-white hover:border-matcha-300 hover:shadow-md transition-all">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className="font-bold text-gray-800 text-sm group-hover:text-matcha-600 transition-colors">{store.name}</h3>
                              <p className="text-[10px] text-gray-500 flex items-center gap-1">
                                <span>{area?.icon}</span>
                                {area?.name}
                              </p>
                            </div>
                            <div className="text-right">
                              <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                                store.customerSatisfaction >= 60 ? 'bg-green-100 text-green-700' : 
                                store.customerSatisfaction >= 40 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                              }`}>
                                {store.customerSatisfaction}%
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex justify-between items-end">
                            <div className="text-xs text-gray-500">
                              売上: <span className="font-bold text-gray-700">{formatMoney(store.weeklyRevenue)}</span>
                            </div>
                            <span className="text-[10px] text-matcha-500 font-bold group-hover:translate-x-1 transition-transform">詳細 &rarr;</span>
                          </div>
                        </div>
                      </Link>
                    );
                  })
                )}
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="game-card p-4 bg-white">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Employees</p>
                <div className="flex items-center gap-2">
                  <span className="text-xl">👥</span>
                  <span className="text-lg font-black text-gray-800">{assignedEmployees.length}</span>
                </div>
              </div>
              <div className="game-card p-4 bg-white">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Reputation</p>
                <div className="flex items-center gap-2">
                  <span className="text-xl">⭐</span>
                  <span className="text-lg font-black text-gray-800">{Math.round(company.brandReputation)}</span>
                </div>
              </div>
            </div>

            {/* Reset Button (Bottom Right) */}
            <div className="text-center pt-2">
               <button
                  onClick={() => {
                    if (window.confirm('本当にリセットしますか？\nすべてのセーブデータが削除されます。')) {
                      resetGame();
                      router.push('/');
                    }
                  }}
                  className="text-xs text-red-400 hover:text-red-600 hover:underline transition-colors"
                >
                  データをリセットして最初から
                </button>
            </div>

          </div>
        </div>
      </div>
    </Layout>
  );
}
