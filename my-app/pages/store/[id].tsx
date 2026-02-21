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
        <div className="game-card p-12 text-center max-w-lg mx-auto mt-10">
          <span className="text-4xl block mb-4">🏪</span>
          <h2 className="text-xl font-bold text-gray-800 mb-2">店舗が見つかりません</h2>
          <p className="text-gray-500 mb-6">指定されたIDの店舗は存在しないか、閉店しました。</p>
          <button onClick={() => router.push('/city')} className="btn-matcha">マップへ戻る</button>
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
  // Note: Marketing campaigns are currently global (company-wide), not per-store.
  const activeCampaigns = campaigns.filter(c => c.isActive);

  const handleGenerateReviews = async () => {
    setLoadingReviews(true);
    try {
      const gameState = useGameStore.getState();
      const reviews = await generateReviews(store, gameState);
      // Ensure reviews is an array before mapping
      if (Array.isArray(reviews)) {
          const formattedReviews = reviews.map((r, i) => ({
            id: `review-${store.id}-${gameState.currentWeek}-${i}`,
            storeId: store.id,
            customerName: r.customerName,
            rating: r.rating,
            comment: r.comment,
            week: gameState.currentWeek,
          }));
          addReviewsToStore(store.id, formattedReviews);
      } else {
          console.error("Generated reviews is not an array:", reviews);
      }
    } catch (err) {
      console.error(err);
    }
    setLoadingReviews(false);
  };

  const recentReviews = [...store.reviews].reverse().slice(0, 10);

  return (
    <Layout>
      <div className="space-y-6 pb-12">
        {/* Header Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Link href="/city" className="text-xs font-bold text-gray-400 hover:text-matcha-600 flex items-center gap-1 transition-colors">
                  <span>←</span> Back to Map
                </Link>
                <span className="text-gray-300">|</span>
                <span className="text-xs font-bold text-matcha-600 bg-matcha-50 px-2 py-0.5 rounded-full border border-matcha-100">
                  Week {store.openedWeek} 開店
                </span>
              </div>
              <h1 className="text-3xl font-black text-gray-800 tracking-tight mb-1 flex items-center gap-3">
                {store.name}
                <span className="text-2xl">{area?.icon}</span>
              </h1>
              <p className="text-gray-500 text-sm flex items-center gap-2">
                <span className="font-bold">{area?.name}</span>
                <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                <span>{property?.name}</span>
              </p>
            </div>
            
            <div className="flex items-center gap-6 bg-gray-50 p-4 rounded-xl border border-gray-100">
              <div className="text-center">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Satisfaction</p>
                <div className="flex items-center gap-1 justify-center">
                  <span className={`text-2xl font-black ${store.customerSatisfaction >= 60 ? 'text-green-600' : store.customerSatisfaction >= 40 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {store.customerSatisfaction}%
                  </span>
                  <span className="text-lg">😊</span>
                </div>
              </div>
              <div className="w-px h-8 bg-gray-200"></div>
              <div className="text-center">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Weekly Profit</p>
                <p className={`text-xl font-black ${store.weeklyRevenue - store.weeklyExpenses >= 0 ? 'text-matcha-600' : 'text-red-500'}`}>
                  {formatMoney(store.weeklyRevenue - store.weeklyExpenses)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <div className="flex overflow-x-auto gap-6 no-scrollbar pb-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 pb-3 text-sm font-bold whitespace-nowrap transition-all relative ${
                  activeTab === tab.id 
                    ? 'text-matcha-600' 
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <span className="text-lg">{tab.icon}</span>
                {tab.label}
                {activeTab === tab.id && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-matcha-600 rounded-t-full"></span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* === Tab: Overview === */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-fade-in">
            {/* KPI Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="game-card p-4 bg-white hover:border-matcha-200 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <span className="p-1.5 rounded-md bg-blue-50 text-blue-600">👥</span>
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Customers</span>
                </div>
                <p className="text-2xl font-black text-gray-800">{store.weeklyCustomers}</p>
                <p className="text-xs text-gray-400">per week</p>
              </div>
              <div className="game-card p-4 bg-white hover:border-matcha-200 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <span className="p-1.5 rounded-md bg-green-50 text-green-600">💰</span>
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Revenue</span>
                </div>
                <p className="text-2xl font-black text-gray-800">{formatMoney(store.weeklyRevenue)}</p>
                <p className="text-xs text-gray-400">per week</p>
              </div>
              <div className="game-card p-4 bg-white hover:border-matcha-200 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <span className="p-1.5 rounded-md bg-red-50 text-red-600">💸</span>
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Expenses</span>
                </div>
                <p className="text-2xl font-black text-gray-800">{formatMoney(store.weeklyExpenses)}</p>
                <p className="text-xs text-gray-400">per week</p>
              </div>
              <div className="game-card p-4 bg-white hover:border-matcha-200 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <span className="p-1.5 rounded-md bg-matcha-50 text-matcha-600">💹</span>
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Profit</span>
                </div>
                <p className={`text-2xl font-black ${store.weeklyRevenue - store.weeklyExpenses >= 0 ? 'text-matcha-600' : 'text-red-500'}`}>
                  {formatMoney(store.weeklyRevenue - store.weeklyExpenses)}
                </p>
                <p className="text-xs text-gray-400">Net Income</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Store Specs */}
              <div className="game-card p-6">
                <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-5 bg-gray-800 rounded-full"></span>
                  店舗スペック
                </h2>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <span className="text-xs font-bold text-gray-500">物件タイプ</span>
                    <span className="text-sm font-bold text-gray-800">{property?.name}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <span className="text-xs font-bold text-gray-500">家賃 (月額)</span>
                    <span className="text-sm font-bold text-gray-800">{formatMoney(property?.rent || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <span className="text-xs font-bold text-gray-500">内装テーマ</span>
                    <span className="text-sm font-bold text-gray-800 flex items-center gap-1">
                      <span>{intData.icon}</span> {intData.name}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <span className="text-xs font-bold text-gray-500">設備グレード</span>
                    <span className="text-sm font-bold text-gray-800 flex items-center gap-1">
                      <span>{eqData.icon}</span> {eqData.name}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    <div className="text-center p-2 rounded-lg bg-gray-50 border border-gray-100">
                      <p className="text-[10px] text-gray-400">座席数</p>
                      <p className="font-bold text-gray-800">{store.setup.seatCount}</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-gray-50 border border-gray-100">
                      <p className="text-[10px] text-gray-400">Wi-Fi</p>
                      <p className="font-bold text-gray-800">{store.setup.hasWifi ? 'あり' : 'なし'}</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-gray-50 border border-gray-100">
                      <p className="text-[10px] text-gray-400">BGM</p>
                      <p className="font-bold text-gray-800">{store.setup.hasBgm ? 'あり' : 'なし'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Employees Summary */}
              <div className="game-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-gray-800 flex items-center gap-2">
                    <span className="w-1.5 h-5 bg-matcha-500 rounded-full"></span>
                    スタッフ ({storeEmployees.length}人)
                  </h2>
                  <button onClick={() => setActiveTab('hr')} className="text-xs font-bold text-matcha-600 hover:underline">
                    詳細管理 →
                  </button>
                </div>

                {storeEmployees.length === 0 ? (
                  <div className="text-center py-8 px-4 bg-orange-50 rounded-xl border border-orange-100">
                    <span className="text-3xl block mb-2">⚠️</span>
                    <p className="text-sm font-bold text-orange-800 mb-1">スタッフがいません</p>
                    <p className="text-xs text-orange-600 mb-3">店舗を運営するにはスタッフが必要です</p>
                    <button onClick={() => setActiveTab('hr')} className="btn-matcha text-xs px-4 py-2">
                      スタッフを配属する
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {storeEmployees.slice(0, 4).map((emp) => (
                      <div key={emp.id} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                            emp.role === 'manager' ? 'bg-indigo-100 text-indigo-600' : 'bg-matcha-100 text-matcha-600'
                          }`}>
                            {emp.role === 'manager' ? '👔' : '🍵'}
                          </div>
                          <div>
                            <p className="font-bold text-sm text-gray-800">{emp.name}</p>
                            <p className="text-[10px] text-gray-400">{emp.role === 'manager' ? 'Store Manager' : 'Barista'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <p className="text-[10px] text-gray-400">Skill</p>
                            <p className="text-xs font-bold text-gray-700">{emp.skill}</p>
                          </div>
                          <div className="w-px h-6 bg-gray-100 mx-1"></div>
                           <div className="text-right">
                            <p className="text-[10px] text-gray-400">Motiv.</p>
                            <p className={`text-xs font-bold ${emp.motivation > 70 ? 'text-green-600' : emp.motivation > 40 ? 'text-yellow-600' : 'text-red-600'}`}>
                              {emp.motivation}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                    {storeEmployees.length > 4 && (
                      <button onClick={() => setActiveTab('hr')} className="w-full py-2 text-xs text-gray-400 hover:text-matcha-600 font-bold border border-dashed border-gray-300 rounded-lg hover:border-matcha-300 hover:bg-matcha-50 transition-colors">
                        + 他 {storeEmployees.length - 4} 名を表示
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* === Tab: HR (Per-Store) === */}
        {activeTab === 'hr' && (
          <div className="space-y-6 animate-fade-in">
            <div className="game-card p-6">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h2 className="font-bold text-lg text-gray-800">人事管理</h2>
                  <p className="text-xs text-gray-500">スタッフの配属・採用・解雇を行います</p>
                </div>
                <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">
                  現在 {storeEmployees.length} 名
                </div>
              </div>

              {/* Current Store Employees */}
              <div className="mt-6">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Assigned Staff</h3>
                {storeEmployees.length === 0 ? (
                  <div className="bg-gray-50 rounded-xl p-8 text-center border border-dashed border-gray-300">
                    <p className="text-gray-400 text-sm">現在、この店舗に配属されているスタッフはいません</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {storeEmployees.map((emp) => (
                      <div key={emp.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-3">
                             <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                              emp.role === 'manager' ? 'bg-indigo-100 text-indigo-600' : 'bg-matcha-100 text-matcha-600'
                            }`}>
                              {emp.role === 'manager' ? '👔' : '🍵'}
                            </div>
                            <div>
                              <h4 className="font-bold text-gray-800">{emp.name}</h4>
                              <p className="text-xs text-gray-500">{emp.age}歳 / ¥{emp.hourlyWage}h</p>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={() => assignEmployee(emp.id, null)}
                              className="p-1.5 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded transition-colors"
                              title="配属解除"
                            >
                              📤
                            </button>
                            <button
                              onClick={() => fireEmployee(emp.id)}
                              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                              title="解雇"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div>
                            <div className="flex justify-between text-[10px] text-gray-500 mb-0.5">
                              <span>Skill</span>
                              <span className="font-bold text-gray-700">{emp.skill}</span>
                            </div>
                            <div className="progress-bar h-1.5"><div className="progress-bar-fill bg-blue-500" style={{ width: `${emp.skill}%` }} /></div>
                          </div>
                          <div>
                             <div className="flex justify-between text-[10px] text-gray-500 mb-0.5">
                              <span>Motivation</span>
                              <span className="font-bold text-gray-700">{emp.motivation}</span>
                            </div>
                            <div className="progress-bar h-1.5"><div className="progress-bar-fill bg-yellow-500" style={{ width: `${emp.motivation}%` }} /></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Unassigned employees */}
              {unassignedEmployees.length > 0 && (
                <div className="mt-8 pt-6 border-t border-gray-100">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Available Staff (Unassigned)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {unassignedEmployees.map((emp) => (
                      <div key={emp.id} className="bg-yellow-50/50 border border-yellow-200 rounded-xl p-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                           <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                            emp.role === 'manager' ? 'bg-indigo-100 text-indigo-600' : 'bg-matcha-100 text-matcha-600'
                          }`}>
                            {emp.role === 'manager' ? '👔' : '🍵'}
                          </div>
                          <div>
                            <h4 className="font-bold text-sm text-gray-800">{emp.name}</h4>
                            <p className="text-[10px] text-gray-500">Sk:{emp.skill} / Sp:{emp.speed}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => assignEmployee(emp.id, store.id)}
                          className="px-3 py-1.5 bg-matcha-600 text-white text-xs font-bold rounded-lg hover:bg-matcha-700 shadow-sm transition-colors"
                        >
                          配属する
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Applicants */}
              <div className="mt-8 pt-6 border-t border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">New Applicants</h3>
                  <button 
                    onClick={() => generateApplicants(3)} 
                    className="text-xs font-bold text-matcha-600 hover:bg-matcha-50 px-3 py-1.5 rounded-lg transition-colors border border-matcha-100"
                  >
                    🔄 求人を出す
                  </button>
                </div>
                
                {applicants.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    現在、応募者はいません
                  </p>
                ) : (
                  <div className="space-y-3">
                    {applicants.slice(0, 5).map((app) => (
                      <div key={app.id} className="bg-white rounded-xl p-4 border border-gray-200 hover:border-matcha-300 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                           <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                              app.role === 'manager' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'bg-matcha-50 text-matcha-600 border border-matcha-100'
                            }`}>
                              {app.role === 'manager' ? '👔' : '🍵'}
                            </div>
                            <div>
                              <h4 className="font-bold text-sm text-gray-800 flex items-center gap-2">
                                {app.name}
                                <span className="text-[10px] font-normal bg-gray-100 px-1.5 py-0.5 rounded text-gray-500">{app.age}歳</span>
                              </h4>
                              <p className="text-xs text-gray-500 mt-0.5">{app.background}</p>
                            </div>
                          </div>
                          <div className="text-right">
                             <p className="font-bold text-sm text-gray-800">¥{app.hourlyWage}<span className="text-[10px] font-normal text-gray-400">/h</span></p>
                          </div>
                        </div>
                        
                        <div className="bg-gray-50 rounded-lg p-2 text-xs text-gray-600 mb-3 flex items-center gap-2">
                          <span className="font-bold text-gray-400">性格:</span> {app.personality}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                           <div className="flex items-center justify-between bg-white border border-gray-100 rounded px-2 py-1">
                             <span className="text-gray-400">Skill</span>
                             <span className="font-bold">{app.skill}</span>
                           </div>
                           <div className="flex items-center justify-between bg-white border border-gray-100 rounded px-2 py-1">
                             <span className="text-gray-400">Speed</span>
                             <span className="font-bold">{app.speed}</span>
                           </div>
                        </div>

                        <button
                          onClick={() => {
                            hireEmployee(app.id);
                            // Auto-assign to this store
                            setTimeout(() => assignEmployee(app.id, store.id), 50);
                          }}
                          className="w-full py-2 bg-gray-900 text-white text-xs font-bold rounded-lg hover:bg-matcha-600 transition-colors shadow-sm"
                        >
                          採用してこの店舗に配属
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
          <div className="space-y-6 animate-fade-in">
            <div className="game-card p-6">
              <div className="mb-6">
                <h2 className="font-bold text-lg text-gray-800">マーケティング施策</h2>
                <p className="text-xs text-gray-500">広告キャンペーンを実施して集客を強化します</p>
              </div>

              {/* Active Campaigns */}
              {activeCampaigns.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-xs font-bold text-matcha-600 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-matcha-500 animate-pulse"></span>
                    Running Campaigns
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {activeCampaigns.map((campaign) => {
                      const channelData = MARKETING_CHANNELS[campaign.channel];
                      const progress = ((campaign.duration - campaign.remainingWeeks) / campaign.duration) * 100;
                      return (
                        <div key={campaign.id} className="bg-white border border-matcha-200 rounded-xl p-4 shadow-sm relative overflow-hidden">
                          <div className="absolute top-0 left-0 w-1 h-full bg-matcha-500"></div>
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-bold text-sm text-gray-800 flex items-center gap-2">
                              <span className="text-lg">{channelData.icon}</span> {channelData.name}
                            </h4>
                            <span className="text-xs font-bold text-matcha-600 bg-matcha-50 px-2 py-0.5 rounded-full">残り {campaign.remainingWeeks} 週</span>
                          </div>
                          
                          <div className="progress-bar mb-2 h-2">
                            <div className="progress-bar-fill bg-matcha-500" style={{ width: `${progress}%` }} />
                          </div>
                          
                          <div className="flex justify-between text-[10px] text-gray-500 font-medium">
                            <span>効果: <span className="text-green-600 font-bold">×{campaign.effectiveness}</span></span>
                            <span>投資額: {formatMoney(campaign.cost)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Available Channels */}
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Available Channels</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(Object.entries(MARKETING_CHANNELS) as [MarketingChannel, typeof MARKETING_CHANNELS['flyer']][]).map(([key, data]) => {
                  const totalCost = data.weeklyCost * data.duration;
                  const canAfford = company.cash >= totalCost;
                  const isActive = activeCampaigns.some(c => c.channel === key);
                  return (
                    <div key={key} className={`bg-white rounded-xl p-4 border transition-all ${
                      isActive 
                        ? 'border-matcha-200 bg-matcha-50/30 opacity-60' 
                        : 'border-gray-200 hover:border-matcha-300 hover:shadow-md'
                    }`}>
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-xl border border-gray-100">
                          {data.icon}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-sm text-gray-800">{data.name}</h4>
                          <p className="text-[11px] text-gray-500 leading-tight mt-0.5">{data.description}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2 text-center mb-3">
                         <div className="bg-gray-50 rounded-lg p-2">
                           <p className="text-[9px] text-gray-400">期間</p>
                           <p className="text-xs font-bold text-gray-700">{data.duration}週</p>
                         </div>
                         <div className="bg-gray-50 rounded-lg p-2">
                           <p className="text-[9px] text-gray-400">コスト</p>
                           <p className="text-xs font-bold text-gray-700">{formatMoney(totalCost)}</p>
                         </div>
                         <div className="bg-gray-50 rounded-lg p-2">
                           <p className="text-[9px] text-gray-400">期待効果</p>
                           <p className="text-xs font-bold text-green-600">×{data.effectiveness}</p>
                         </div>
                      </div>

                      <button
                        onClick={() => startCampaign(key)}
                        disabled={!canAfford || isActive}
                        className={`w-full py-2 text-xs font-bold rounded-lg transition-colors shadow-sm ${
                           isActive 
                             ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                             : canAfford
                               ? 'bg-gray-900 text-white hover:bg-matcha-600'
                               : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        {isActive ? '実施中' : canAfford ? 'キャンペーン開始' : '資金不足'}
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
          <div className="space-y-6 animate-fade-in">
            <div className="game-card p-6">
              <h2 className="font-bold text-lg text-gray-800 mb-4">提供メニュー ({store.menu.length}品)</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {store.menu.map((item) => (
                  <div key={item.id} className="flex items-center justify-between bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-cream-dark flex items-center justify-center text-xl">
                        🍵
                      </div>
                      <div>
                        <p className="font-bold text-sm text-gray-800">{item.name}</p>
                        <p className="text-[10px] text-gray-500">原価: ¥{item.cost} / 利益: <span className="text-green-600 font-bold">¥{item.price - item.cost}</span></p>
                      </div>
                    </div>
                    <div className="font-black text-lg text-matcha-700">¥{item.price}</div>
                  </div>
                ))}
              </div>
              {store.menu.length === 0 && (
                <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                  <p className="text-gray-400 text-sm">メニューが設定されていません</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* === Tab: Reviews === */}
        {activeTab === 'reviews' && (
          <div className="space-y-6 animate-fade-in">
            <div className="game-card p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="font-bold text-lg text-gray-800">顧客レビュー</h2>
                  <p className="text-xs text-gray-500">AIが生成したリアルな顧客の声</p>
                </div>
                <button
                  onClick={handleGenerateReviews}
                  disabled={loadingReviews}
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-xs font-bold rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center gap-2 disabled:opacity-50 disabled:hover:scale-100"
                >
                  {loadingReviews ? (
                    <>
                      <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      生成中...
                    </>
                  ) : (
                    <>
                      <span>✨</span> 新しいレビューを受信
                    </>
                  )}
                </button>
              </div>

              {recentReviews.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                  <span className="text-4xl block mb-2 opacity-50">💭</span>
                  <p className="text-sm text-gray-500">まだレビューがありません。</p>
                  <p className="text-xs text-gray-400 mt-1">「新しいレビューを受信」ボタンを押して、お客様の声を聞いてみましょう。</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentReviews.map((review) => (
                    <div key={review.id} className="flex gap-4 animate-slide-up">
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden border-2 border-white shadow-sm">
                         <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center text-white font-bold text-xs">
                           {review.customerName.charAt(0)}
                         </div>
                      </div>
                      <div className="flex-1">
                        <div className="bg-gray-100 rounded-2xl rounded-tl-none p-4 relative">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-bold text-sm text-gray-800">{review.customerName}</span>
                            <div className="flex gap-0.5 text-xs text-yellow-400">
                              {Array.from({ length: 5 }, (_, i) => (
                                <span key={i} className={i < review.rating ? '' : 'text-gray-300'}>★</span>
                              ))}
                            </div>
                          </div>
                          <p className="text-sm text-gray-700 leading-relaxed">{review.comment}</p>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-1 ml-2">Week {review.week}</p>
                      </div>
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
