// ============================
// Matcha Inc. — City Map (Main Game Screen) — Town View
// ============================

import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useGameStore } from '@/store/gameStore';
import { useHydrated } from '@/lib/useHydration';
import { AREAS, LOGO_OPTIONS } from '@/lib/gameData';
import { formatMoney } from '@/lib/gameEngine';
import { Property, AreaId } from '@/types/game';
import BuildingBlock, { DecorativeBuilding, Tree, Park, Car } from '@/components/BuildingBlock';
import PropertyModal from '@/components/PropertyModal';

// Decorative data for each area
const DECO_BUILDINGS: Record<string, { width: number; height: number; color: string }[]> = {
  shibuya: [
    { width: 30, height: 50, color: '#B0BEC5' },
    { width: 22, height: 35, color: '#90A4AE' },
    { width: 35, height: 70, color: '#78909C' },
    { width: 25, height: 40, color: '#CFD8DC' },
    { width: 28, height: 55, color: '#BDBDBD' },
    { width: 18, height: 30, color: '#E0E0E0' },
    { width: 32, height: 60, color: '#9E9E9E' },
    { width: 20, height: 25, color: '#B0BEC5' },
  ],
  marunouchi: [
    { width: 40, height: 90, color: '#455A64' },
    { width: 35, height: 75, color: '#546E7A' },
    { width: 28, height: 50, color: '#78909C' },
    { width: 38, height: 80, color: '#607D8B' },
    { width: 30, height: 65, color: '#90A4AE' },
    { width: 24, height: 45, color: '#B0BEC5' },
    { width: 42, height: 95, color: '#37474F' },
    { width: 26, height: 55, color: '#546E7A' },
  ],
  shimokitazawa: [
    { width: 22, height: 30, color: '#BCAAA4' },
    { width: 18, height: 25, color: '#D7CCC8' },
    { width: 25, height: 35, color: '#A1887F' },
    { width: 20, height: 28, color: '#EFEBE9' },
    { width: 24, height: 32, color: '#8D6E63' },
    { width: 16, height: 22, color: '#D7CCC8' },
    { width: 28, height: 38, color: '#BCAAA4' },
    { width: 20, height: 26, color: '#A1887F' },
  ],
  asakusa: [
    { width: 26, height: 35, color: '#A1887F' },
    { width: 22, height: 30, color: '#D7CCC8' },
    { width: 30, height: 40, color: '#8D6E63' },
    { width: 20, height: 28, color: '#BCAAA4' },
    { width: 24, height: 32, color: '#795548' },
    { width: 18, height: 25, color: '#EFEBE9' },
    { width: 28, height: 36, color: '#A1887F' },
    { width: 22, height: 30, color: '#D7CCC8' },
  ],
};

const CAR_COLORS = ['#EF5350', '#42A5F5', '#FFEE58', '#FFF', '#66BB6A', '#AB47BC', '#FF7043'];

export default function CityPage() {
  const router = useRouter();
  const hydrated = useHydrated();
  const {
    initialized, currentWeek, company, stores, properties, notifications, nextWeek,
  } = useGameStore();

  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [selectedArea, setSelectedArea] = useState<AreaId | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  if (!hydrated) return null;
  if (!initialized) { router.push('/'); return null; }

  const logo = LOGO_OPTIONS[company.logoIndex];

  const getDateString = () => {
    const baseDate = new Date(2024, 0, 1);
    baseDate.setDate(baseDate.getDate() + (currentWeek - 1) * 7);
    return `${baseDate.getFullYear()}年${baseDate.getMonth() + 1}月${baseDate.getDate()}日`;
  };

  const getStoreForProperty = (propId: string) => stores.find(s => s.propertyId === propId);

  const areaDisplayOrder: AreaId[] = ['shibuya', 'marunouchi', 'shimokitazawa', 'asakusa'];
  const currentAreaName = selectedArea
    ? AREAS.find(a => a.id === selectedArea)?.name || '東京'
    : '東京';
  const openStores = stores.filter(s => s.isOpen);
  const hasNotifications = notifications.length > 0;

  // Render a city block (one area)
  const renderCityBlock = (areaId: AreaId) => {
    const area = AREAS.find(a => a.id === areaId)!;
    const areaProperties = properties.filter(p => p.areaId === areaId);
    const decos = DECO_BUILDINGS[areaId] || [];
    const areaStoreCount = stores.filter(s => s.areaId === areaId && s.isOpen).length;

    // Interleave buildings with decorative elements
    const buildingElements: React.ReactNode[] = [];

    // Left decorative buildings
    buildingElements.push(
      <div key={`deco-l-0-${areaId}`} className="flex flex-col justify-end">
        <Tree size="md" />
      </div>
    );
    buildingElements.push(
      <div key={`deco-l-1-${areaId}`} className="flex flex-col justify-end">
        <DecorativeBuilding {...decos[0]} />
      </div>
    );
    buildingElements.push(
      <div key={`deco-l-2-${areaId}`} className="flex flex-col justify-end">
        <DecorativeBuilding {...decos[1]} />
      </div>
    );

    // Real properties
    areaProperties.forEach((prop, idx) => {
      // Add a tree or deco between properties
      if (idx > 0 && idx % 1 === 0) {
        const decoIdx = (idx + 2) % decos.length;
        buildingElements.push(
          <div key={`deco-mid-${areaId}-${idx}`} className="flex flex-col justify-end">
            {idx % 3 === 0 ? (
              <Tree size={idx % 2 === 0 ? 'lg' : 'md'} />
            ) : (
              <DecorativeBuilding {...decos[decoIdx]} />
            )}
          </div>
        );
      }

      const store = getStoreForProperty(prop.id);
      buildingElements.push(
        <div key={prop.id} className="flex flex-col justify-end">
          <BuildingBlock property={prop} store={store} onClick={() => setSelectedProperty(prop)} />
        </div>
      );
    });

    // Right decorative buildings
    buildingElements.push(
      <div key={`deco-r-0-${areaId}`} className="flex flex-col justify-end">
        <DecorativeBuilding {...decos[decos.length - 2]} />
      </div>
    );
    buildingElements.push(
      <div key={`deco-r-1-${areaId}`} className="flex flex-col justify-end">
        <Tree size="lg" />
      </div>
    );
    buildingElements.push(
      <div key={`deco-r-2-${areaId}`} className="flex flex-col justify-end">
        <DecorativeBuilding {...decos[decos.length - 1]} />
      </div>
    );

    return (
      <div key={areaId} className="mb-2">
        {/* Area header */}
        <div className="flex items-center gap-2 px-4 mb-2 mt-4">
          <div className="flex items-center gap-2 bg-matcha-800/80 backdrop-blur-sm rounded-lg px-3 py-1.5">
            <span className="text-lg">{area.icon}</span>
            <span className="text-white font-bold text-sm">{area.name}</span>
            <span className="text-white/70 text-xs">— {area.description.slice(0, 20)}...</span>
          </div>
          {areaStoreCount > 0 && (
            <span className="bg-matcha-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold shadow">
              🏪 {areaStoreCount}店舗
            </span>
          )}
        </div>

        {/* Sidewalk + buildings */}
        <div className="relative">
          {/* Sidewalk */}
          <div className="bg-gray-300 rounded-lg mx-2 pt-3 pb-1 px-3">
            {/* Buildings row */}
            <div className="flex items-end gap-2 overflow-x-auto pb-2 justify-start" style={{ minHeight: '160px' }}>
              {buildingElements}
            </div>
          </div>

          {/* Curb */}
          <div className="mx-2 h-[3px] bg-gray-400 rounded-b-sm" />

          {/* Road */}
          <div className="mx-0 relative overflow-hidden" style={{ height: '40px' }}>
            {/* Asphalt */}
            <div className="absolute inset-0 bg-gray-600" />

            {/* Center line (dashed) */}
            <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-[2px] flex gap-3 px-2">
              {Array.from({ length: 30 }).map((_, i) => (
                <div key={i} className="w-4 h-[2px] bg-yellow-400 flex-shrink-0" />
              ))}
            </div>

            {/* Edge lines */}
            <div className="absolute top-[4px] left-0 right-0 h-[1px] bg-white/40" />
            <div className="absolute bottom-[4px] left-0 right-0 h-[1px] bg-white/40" />

            {/* Cars */}
            <div className="absolute top-[8px] flex gap-16 px-8">
              <Car color={CAR_COLORS[areaId.charCodeAt(0) % CAR_COLORS.length]} />
              <Car color={CAR_COLORS[(areaId.charCodeAt(1) + 2) % CAR_COLORS.length]} />
              <Car color={CAR_COLORS[(areaId.charCodeAt(2) + 4) % CAR_COLORS.length]} />
            </div>
            <div className="absolute bottom-[8px] flex gap-20 px-24">
              <div className="scale-x-[-1]">
                <Car color={CAR_COLORS[(areaId.charCodeAt(0) + 3) % CAR_COLORS.length]} />
              </div>
              <div className="scale-x-[-1]">
                <Car color={CAR_COLORS[(areaId.charCodeAt(1) + 5) % CAR_COLORS.length]} />
              </div>
            </div>
          </div>

          {/* Curb bottom */}
          <div className="mx-2 h-[3px] bg-gray-400 rounded-t-sm" />

          {/* Opposite sidewalk with trees/park */}
          <div className="bg-gray-300 rounded-lg mx-2 py-2 px-3 flex items-end gap-3 overflow-x-auto">
            <Park />
            <DecorativeBuilding {...decos[3]} />
            <Tree size="sm" />
            <DecorativeBuilding {...decos[4]} />
            <Park />
            <DecorativeBuilding {...decos[5]} />
            <Tree size="lg" />
            <DecorativeBuilding {...decos[6]} />
            <Tree size="sm" />
            <Park />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen flex flex-col relative overflow-hidden">
      {/* Sky */}
      <div className="absolute inset-0 city-sky" />

      {/* Clouds */}
      <div className="absolute top-6 left-[8%] text-white/25 text-6xl select-none">☁</div>
      <div className="absolute top-10 right-[12%] text-white/15 text-5xl select-none">☁</div>
      <div className="absolute top-3 left-[50%] text-white/20 text-4xl select-none">☁</div>
      <div className="absolute top-14 left-[30%] text-white/10 text-3xl select-none">☁</div>

      {/* === Top HUD === */}
      {/* Company info (left) */}
      <div className="absolute top-3 left-3 z-30">
        <div className="city-info-badge rounded-xl px-3 py-2 flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-lg">
            {logo?.emoji || '🍵'}
          </div>
          <div>
            <p className="text-white font-bold text-xs leading-tight">{company.name || 'Matcha Inc.'}</p>
            <p className="text-green-300 font-bold text-xs leading-tight">{formatMoney(company.cash)}</p>
          </div>
        </div>
      </div>

      {/* Next week (center) */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30">
        <button
          onClick={nextWeek}
          className="city-info-badge rounded-xl px-4 py-2 text-white font-bold text-xs hover:bg-white/20 transition flex items-center gap-1.5"
        >
          ⏭️ 次の週へ
        </button>
      </div>

      {/* Date (right) */}
      <div className="absolute top-3 right-3 z-30">
        <div className="city-info-badge rounded-xl px-3 py-2">
          <p className="text-white font-bold text-xs">{getDateString()}</p>
        </div>
      </div>

      {/* Notification bell */}
      {hasNotifications && (
        <div className="absolute top-3 right-36 z-30">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="city-info-badge rounded-xl px-2.5 py-2 text-white relative text-sm"
          >
            🔔
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full text-[8px] flex items-center justify-center font-bold text-white">
              {notifications.length}
            </span>
          </button>
        </div>
      )}

      {/* Notification dropdown */}
      {showNotifications && notifications.length > 0 && (
        <div className="absolute top-14 right-3 z-40 w-72">
          <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
            <div className="bg-matcha-700 text-white px-3 py-1.5 flex items-center justify-between">
              <span className="font-bold text-xs">📢 通知</span>
              <button onClick={() => setShowNotifications(false)} className="text-white/70 hover:text-white text-sm">✕</button>
            </div>
            <div className="max-h-48 overflow-y-auto">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`px-3 py-2 border-b border-cream text-xs ${
                    notif.type === 'opportunity' ? 'bg-green-50' :
                    notif.type === 'crisis' ? 'bg-red-50' :
                    'bg-blue-50'
                  }`}
                >
                  <p className="font-bold">{notif.title}</p>
                  <p className="text-bark-light mt-0.5">{notif.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* === City Map === */}
      <div className="flex-1 relative z-10 city-scroll pt-14 pb-16">
        {/* Green hills at top */}
        <div className="relative h-12 overflow-hidden">
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-green-500/50 to-transparent rounded-b-[50%]" />
          <div className="absolute bottom-0 left-[10%] w-24 h-8 bg-green-600/30 rounded-t-full" />
          <div className="absolute bottom-0 right-[15%] w-20 h-6 bg-green-500/20 rounded-t-full" />
          {/* Distant trees */}
          <div className="absolute bottom-0 left-[20%] flex gap-2 items-end">
            <Tree size="sm" />
            <Tree size="md" />
            <Tree size="sm" />
          </div>
          <div className="absolute bottom-0 right-[25%] flex gap-2 items-end">
            <Tree size="md" />
            <Tree size="sm" />
          </div>
        </div>

        {/* Area tabs */}
        <div className="sticky top-0 z-20 py-2 px-3 flex gap-1.5 overflow-x-auto bg-gradient-to-b from-sky-200/80 to-transparent backdrop-blur-sm">
          <button
            onClick={() => setSelectedArea(null)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition shadow-sm ${
              !selectedArea ? 'bg-matcha-600 text-white' : 'bg-white/90 text-bark-light hover:bg-white'
            }`}
          >
            🗾 全エリア
          </button>
          {areaDisplayOrder.map((areaId) => {
            const a = AREAS.find(ar => ar.id === areaId)!;
            const cnt = stores.filter(s => s.areaId === areaId && s.isOpen).length;
            return (
              <button
                key={areaId}
                onClick={() => setSelectedArea(selectedArea === areaId ? null : areaId)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition shadow-sm flex items-center gap-1 ${
                  selectedArea === areaId ? 'bg-matcha-600 text-white' : 'bg-white/90 text-bark-light hover:bg-white'
                }`}
              >
                {a.icon} {a.name}
                {cnt > 0 && <span className="bg-matcha-400 text-white text-[9px] px-1 rounded-full">{cnt}</span>}
              </button>
            );
          })}
        </div>

        {/* City blocks */}
        <div className="mt-2">
          {(selectedArea ? [selectedArea] : areaDisplayOrder).map(renderCityBlock)}
        </div>

        {/* Bottom stats */}
        <div className="grid grid-cols-4 gap-2 mx-3 mt-4 mb-6">
          <div className="bg-white/85 backdrop-blur rounded-lg p-2 text-center shadow-sm">
            <p className="text-[10px] text-bark-light">🏪 店舗</p>
            <p className="text-sm font-bold text-matcha-700">{openStores.length}</p>
          </div>
          <div className="bg-white/85 backdrop-blur rounded-lg p-2 text-center shadow-sm">
            <p className="text-[10px] text-bark-light">💰 週利益</p>
            <p className={`text-xs font-bold ${company.weeklyRevenue - company.weeklyExpenses >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatMoney(company.weeklyRevenue - company.weeklyExpenses)}
            </p>
          </div>
          <div className="bg-white/85 backdrop-blur rounded-lg p-2 text-center shadow-sm">
            <p className="text-[10px] text-bark-light">⭐ 評判</p>
            <p className="text-sm font-bold text-matcha-700">{Math.round(company.brandReputation)}</p>
          </div>
          <div className="bg-white/85 backdrop-blur rounded-lg p-2 text-center shadow-sm">
            <p className="text-[10px] text-bark-light">📅 Week</p>
            <p className="text-sm font-bold text-matcha-700">{currentWeek}</p>
          </div>
        </div>
      </div>

      {/* === Bottom Bar === */}
      <div className="absolute bottom-0 left-0 right-0 z-30 city-bottom-bar">
        <div className="flex items-center justify-between px-5 py-2.5">
          <Link href="/dashboard" className="flex flex-col items-center gap-0.5 active:scale-95 transition">
            <span className="text-lg">📊</span>
            <span className="text-[9px] text-white/70">ダッシュボード</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-base">🗾</span>
            <span className="text-white font-bold text-sm">{currentAreaName}</span>
          </div>
          <button onClick={() => setShowMenu(!showMenu)} className="flex flex-col items-center gap-0.5 active:scale-95 transition">
            <span className="text-lg">☰</span>
            <span className="text-[9px] text-white/70">メニュー</span>
          </button>
        </div>
      </div>

      {/* === Side Menu === */}
      {showMenu && (
        <div className="fixed inset-0 z-50" onClick={() => setShowMenu(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="absolute right-0 top-0 bottom-0 w-64 side-menu text-white p-5 animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-base font-bold">📋 メニュー</h2>
              <button onClick={() => setShowMenu(false)} className="text-white/70 hover:text-white text-lg">✕</button>
            </div>
            <nav className="space-y-1">
              {[
                { href: '/dashboard', icon: '📊', label: 'ダッシュボード' },
                { href: '/real-estate', icon: '🏠', label: '物件探し' },
                { href: '/hr', icon: '👥', label: '人事管理' },
                { href: '/market', icon: '📢', label: 'マーケティング' },
                { href: '/finance', icon: '💰', label: '財務' },
                { href: '/supply-chain', icon: '🍃', label: '仕入れ' },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/10 transition text-sm"
                  onClick={() => setShowMenu(false)}
                >
                  <span>{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </Link>
              ))}
            </nav>
            {openStores.length > 0 && (
              <div className="mt-5 pt-5 border-t border-white/20">
                <h3 className="text-xs font-bold text-white/50 mb-2">🏪 店舗一覧</h3>
                {openStores.map((s) => {
                  const a = AREAS.find(ar => ar.id === s.areaId);
                  return (
                    <Link
                      key={s.id}
                      href={`/store/${s.id}`}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/10 transition text-sm"
                      onClick={() => setShowMenu(false)}
                    >
                      <span>{a?.icon}</span>
                      <div>
                        <p className="text-xs font-medium">{s.name}</p>
                        <p className="text-[10px] text-white/40">{a?.name}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* === Property Modal === */}
      {selectedProperty && (
        <PropertyModal
          property={selectedProperty}
          store={getStoreForProperty(selectedProperty.id)}
          onClose={() => setSelectedProperty(null)}
        />
      )}
    </div>
  );
}
