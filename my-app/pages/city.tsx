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
      <div key={areaId} className="mb-6 animate-fade-in">
        {/* Area header */}
        <div className="flex items-center gap-3 px-4 mb-3 mt-4">
          <div className="flex items-center gap-2 bg-white/90 backdrop-blur-md rounded-full px-4 py-1.5 shadow-sm border border-white/50">
            <span className="text-xl">{area.icon}</span>
            <span className="text-gray-800 font-bold text-sm">{area.name}</span>
          </div>
          {areaStoreCount > 0 && (
            <span className="bg-matcha-500 text-white text-[10px] px-2 py-1 rounded-full font-bold shadow-sm">
              {areaStoreCount}店舗
            </span>
          )}
          <div className="h-px bg-white/30 flex-1 ml-2"></div>
        </div>

        {/* Sidewalk + buildings */}
        <div className="relative">
          {/* Sidewalk */}
          <div className="bg-[#e0e0e0] rounded-xl mx-2 pt-4 pb-1 px-4 shadow-inner border-t border-white/40">
            {/* Buildings row */}
            <div className="flex items-end gap-3 overflow-x-auto pb-2 justify-start no-scrollbar" style={{ minHeight: '180px' }}>
              {buildingElements}
            </div>
          </div>

          {/* Curb */}
          <div className="mx-2 h-[4px] bg-[#bdbdbd] rounded-b-sm shadow-sm" />

          {/* Road */}
          <div className="mx-0 relative overflow-hidden my-0.5 shadow-inner" style={{ height: '50px' }}>
            {/* Asphalt */}
            <div className="absolute inset-0 bg-[#455A64]" />

            {/* Center line (dashed) */}
            <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-[2px] flex gap-4 px-2">
              {Array.from({ length: 30 }).map((_, i) => (
                <div key={i} className="w-6 h-[2px] bg-yellow-400/80 flex-shrink-0" />
              ))}
            </div>

            {/* Edge lines */}
            <div className="absolute top-[6px] left-0 right-0 h-[1px] bg-white/30" />
            <div className="absolute bottom-[6px] left-0 right-0 h-[1px] bg-white/30" />

            {/* Cars */}
            <div className="absolute top-[10px] flex gap-20 px-8 w-[200%] animate-slide-right">
              <Car color={CAR_COLORS[areaId.charCodeAt(0) % CAR_COLORS.length]} />
              <Car color={CAR_COLORS[(areaId.charCodeAt(1) + 2) % CAR_COLORS.length]} />
              <Car color={CAR_COLORS[(areaId.charCodeAt(2) + 4) % CAR_COLORS.length]} />
              <Car color={CAR_COLORS[(areaId.charCodeAt(0) + 1) % CAR_COLORS.length]} />
            </div>
            <div className="absolute bottom-[10px] flex gap-24 px-24 w-[200%] animate-slide-left">
              <div className="scale-x-[-1]">
                <Car color={CAR_COLORS[(areaId.charCodeAt(0) + 3) % CAR_COLORS.length]} />
              </div>
              <div className="scale-x-[-1]">
                <Car color={CAR_COLORS[(areaId.charCodeAt(1) + 5) % CAR_COLORS.length]} />
              </div>
              <div className="scale-x-[-1]">
                <Car color={CAR_COLORS[(areaId.charCodeAt(2) + 6) % CAR_COLORS.length]} />
              </div>
            </div>
          </div>

          {/* Curb bottom */}
          <div className="mx-2 h-[4px] bg-[#bdbdbd] rounded-t-sm shadow-sm" />

          {/* Opposite sidewalk with trees/park */}
          <div className="bg-[#e0e0e0] rounded-xl mx-2 py-3 px-4 flex items-end gap-4 overflow-x-auto shadow-sm border-b border-black/10 no-scrollbar">
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
    <div className="h-screen flex flex-col relative overflow-hidden font-sans">
      {/* Sky Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-sky-300 via-sky-100 to-white" />
      
      {/* Animated Clouds */}
      <div className="absolute top-10 left-[10%] opacity-40 animate-pulse-slow">
        <span className="text-6xl text-white drop-shadow-md">☁</span>
      </div>
      <div className="absolute top-20 right-[15%] opacity-30 animate-pulse-slow" style={{ animationDelay: '1s' }}>
        <span className="text-5xl text-white drop-shadow-md">☁</span>
      </div>
      <div className="absolute top-5 left-[60%] opacity-20 animate-pulse-slow" style={{ animationDelay: '2s' }}>
        <span className="text-4xl text-white drop-shadow-md">☁</span>
      </div>

      {/* === Top HUD === */}
      {/* Company info (left) */}
      <div className="absolute top-4 left-4 z-30">
        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-1.5 pr-4 flex items-center gap-3 shadow-lg border border-white/50 hover:bg-white/90 transition-all cursor-pointer group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-matcha-500 to-matcha-700 flex items-center justify-center text-xl shadow-inner group-hover:scale-105 transition-transform text-white">
            {logo?.emoji || '🍵'}
          </div>
          <div>
            <p className="text-gray-800 font-bold text-xs leading-tight">{company.name || 'Matcha Inc.'}</p>
            <p className="text-matcha-600 font-black text-sm leading-tight tracking-tight mt-0.5">{formatMoney(company.cash)}</p>
          </div>
        </div>
      </div>

      {/* Next week (center) */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 pointer-events-none md:pointer-events-auto">
        <button
          onClick={nextWeek}
          className="pointer-events-auto bg-matcha-600 text-white rounded-full px-6 py-2.5 font-bold text-sm shadow-lg shadow-matcha-600/30 hover:bg-matcha-500 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 border-2 border-white/20"
        >
          <span>⏭️</span>
          <span className="hidden sm:inline">Next Week</span>
        </button>
      </div>

      {/* Date & Stats (right) */}
      <div className="absolute top-4 right-4 z-30 flex flex-col items-end gap-2">
        <div className="bg-white/80 backdrop-blur-md rounded-full px-4 py-2 shadow-lg border border-white/50 text-xs font-bold text-gray-700 flex items-center gap-2">
          <span>📅</span>
          <span>{getDateString()}</span>
          <span className="w-px h-3 bg-gray-300 mx-1"></span>
          <span className="text-matcha-600">Week {currentWeek}</span>
        </div>

        {/* Notification bell */}
        {hasNotifications && (
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="bg-white/90 backdrop-blur-md rounded-full w-10 h-10 flex items-center justify-center shadow-lg border border-white/50 text-xl relative hover:scale-110 transition-transform"
          >
            🔔
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-[10px] flex items-center justify-center font-bold text-white border-2 border-white animate-bounce">
              {notifications.length}
            </span>
          </button>
        )}
      </div>

      {/* Notification dropdown */}
      {showNotifications && notifications.length > 0 && (
        <div className="absolute top-20 right-4 z-40 w-80 animate-slide-up">
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden border border-white/50">
            <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-b border-gray-100">
              <span className="font-bold text-xs text-gray-500 uppercase tracking-wider">NOTIFICATIONS</span>
              <button onClick={() => setShowNotifications(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="max-h-64 overflow-y-auto p-2 space-y-2">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-3 rounded-xl text-xs border ${
                    notif.type === 'opportunity' ? 'bg-green-50 border-green-100' :
                    notif.type === 'crisis' ? 'bg-red-50 border-red-100' :
                    'bg-blue-50 border-blue-100'
                  }`}
                >
                  <p className={`font-bold mb-1 ${
                    notif.type === 'opportunity' ? 'text-green-800' :
                    notif.type === 'crisis' ? 'text-red-800' :
                    'text-blue-800'
                  }`}>{notif.title}</p>
                  <p className="text-gray-600 leading-relaxed">{notif.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* === City Map === */}
      <div className="flex-1 relative z-10 city-scroll pt-20 pb-24 px-2 sm:px-4">
        
        {/* Area tabs */}
        <div className="sticky top-0 z-20 py-4 flex gap-2 overflow-x-auto no-scrollbar justify-center mb-4">
          <button
            onClick={() => setSelectedArea(null)}
            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all shadow-sm border ${
              !selectedArea 
                ? 'bg-gray-800 text-white border-gray-800 scale-105 shadow-md' 
                : 'bg-white/90 text-gray-500 border-white/50 hover:bg-white hover:text-gray-800'
            }`}
          >
            All Areas
          </button>
          {areaDisplayOrder.map((areaId) => {
            const a = AREAS.find(ar => ar.id === areaId)!;
            const cnt = stores.filter(s => s.areaId === areaId && s.isOpen).length;
            const isSelected = selectedArea === areaId;
            return (
              <button
                key={areaId}
                onClick={() => setSelectedArea(isSelected ? null : areaId)}
                className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all shadow-sm flex items-center gap-1.5 border ${
                  isSelected 
                    ? 'bg-matcha-600 text-white border-matcha-600 scale-105 shadow-md' 
                    : 'bg-white/90 text-gray-500 border-white/50 hover:bg-white hover:text-gray-800'
            }`}
              >
                <span>{a.icon}</span>
                <span>{a.name}</span>
                {cnt > 0 && (
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ml-1 ${
                    isSelected ? 'bg-white text-matcha-600' : 'bg-matcha-100 text-matcha-600'
                  }`}>{cnt}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* City blocks */}
        <div className="pb-10 max-w-5xl mx-auto">
          {(selectedArea ? [selectedArea] : areaDisplayOrder).map(renderCityBlock)}
        </div>
      </div>

      {/* === Bottom Bar === */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 w-[95%] max-w-2xl">
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/40 p-1.5 flex items-center justify-between">
          <div className="flex items-center gap-1">
             <Link 
              href="/dashboard" 
              className="flex flex-col items-center justify-center w-14 h-14 rounded-xl hover:bg-white/50 transition-colors group"
            >
              <span className="text-xl group-hover:-translate-y-1 transition-transform duration-300">📊</span>
              <span className="text-[9px] font-bold text-gray-500 group-hover:text-matcha-600">Dash</span>
            </Link>
            <div className="w-px h-8 bg-gray-200 mx-1"></div>
            
             <button 
              onClick={() => setShowMenu(!showMenu)}
              className="flex flex-col items-center justify-center w-14 h-14 rounded-xl hover:bg-white/50 transition-colors group"
            >
              <span className="text-xl group-hover:-translate-y-1 transition-transform duration-300">☰</span>
              <span className="text-[9px] font-bold text-gray-500 group-hover:text-matcha-600">Menu</span>
            </button>
          </div>

          <div className="flex items-center gap-4 px-4">
             <div className="text-center hidden sm:block">
              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Stores</p>
              <p className="text-lg font-black text-gray-800 leading-none">{openStores.length}</p>
            </div>
            <div className="text-center hidden sm:block">
              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Revenue</p>
              <p className={`text-lg font-black leading-none ${company.weeklyRevenue >= 0 ? 'text-green-600' : 'text-gray-800'}`}>
                {formatMoney(company.weeklyRevenue)}
              </p>
            </div>
             <div className="text-center">
              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Reputation</p>
              <p className="text-lg font-black text-matcha-600 leading-none">{Math.round(company.brandReputation)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* === Side Menu Overlay === */}
      {showMenu && (
        <div className="fixed inset-0 z-50 overflow-hidden" onClick={() => setShowMenu(false)}>
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm animate-fade-in" />
          <div
            className="absolute bottom-24 left-1/2 -translate-x-1/2 w-[90%] max-w-sm bg-white rounded-2xl shadow-2xl p-4 animate-slide-up border border-gray-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4 px-2">
              <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-matcha-500"></span>
                Quick Menu
              </h2>
              <button onClick={() => setShowMenu(false)} className="text-gray-400 hover:text-gray-800">✕</button>
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              {[
                { href: '/dashboard', icon: '📊', label: 'Dashboard' },
                { href: '/real-estate', icon: '🏠', label: 'Real Estate' },
                { href: '/hr', icon: '👥', label: 'HR' },
                { href: '/market', icon: '📢', label: 'Marketing' },
                { href: '/finance', icon: '💰', label: 'Finance' },
                { href: '/supply-chain', icon: '🍃', label: 'Supply' },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex flex-col items-center justify-center p-3 rounded-xl bg-gray-50 hover:bg-matcha-50 hover:text-matcha-700 transition-colors border border-transparent hover:border-matcha-200"
                  onClick={() => setShowMenu(false)}
                >
                  <span className="text-2xl mb-1">{item.icon}</span>
                  <span className="text-[10px] font-bold text-gray-500">{item.label}</span>
                </Link>
              ))}
            </div>
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
