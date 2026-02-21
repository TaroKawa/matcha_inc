// ============================
// Matcha Inc. — Game Layout with Navigation
// ============================

import Link from 'next/link';
import { useRouter } from 'next/router';
import { useGameStore } from '@/store/gameStore';
import { formatMoney } from '@/lib/gameEngine';
import { PHASE_NAMES } from '@/lib/gameEngine';
import { LOGO_OPTIONS } from '@/lib/gameData';

interface LayoutProps {
  children: React.ReactNode;
}

const NAV_ITEMS = [
  { href: '/dashboard', label: 'ダッシュボード', icon: '📊' },
  { href: '/real-estate', label: '物件探し', icon: '🏠' },
  { href: '/hr', label: '人事管理', icon: '👥' },
  { href: '/market', label: 'マーケティング', icon: '📢' },
  { href: '/finance', label: '財務', icon: '💰' },
  { href: '/supply-chain', label: '仕入れ', icon: '🍃' },
];

export default function Layout({ children }: LayoutProps) {
  const router = useRouter();
  const { company, currentWeek, gamePhase, stores, notifications } = useGameStore();

  const logo = LOGO_OPTIONS[company.logoIndex];
  const hasNotifications = notifications.length > 0;

  return (
    <div className="min-h-screen flex flex-col bg-cream font-sans">
      {/* Top Bar */}
      <header className="bg-matcha-900 text-white shadow-md sticky top-0 z-50 border-b border-matcha-800">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Logo & Company */}
          <Link href="/dashboard" className="flex items-center gap-3 hover:opacity-90 transition group">
            <div className="w-10 h-10 bg-matcha-800 rounded-full flex items-center justify-center text-2xl shadow-inner group-hover:scale-105 transition-transform border border-matcha-700">
              {logo?.emoji || '🍵'}
            </div>
            <div>
              <h1 className="text-lg font-bold leading-none tracking-wide text-tea-100">{company.name || 'Matcha Inc.'}</h1>
              <p className="text-xs text-tea-300/80 font-medium mt-1 uppercase tracking-wider">{PHASE_NAMES[gamePhase]}</p>
            </div>
          </Link>

          {/* Stats Bar */}
          <div className="hidden md:flex items-center bg-matcha-800/50 rounded-xl p-1 border border-matcha-700/50 backdrop-blur-sm">
            <div className="px-4 py-1 text-center">
              <p className="text-tea-400 text-[10px] uppercase font-bold tracking-wider mb-0.5">Week</p>
              <p className="font-bold text-lg leading-none text-white">{currentWeek}</p>
            </div>
            <div className="w-px h-8 bg-matcha-700" />
            <div className="px-4 py-1 text-center min-w-[100px]">
              <p className="text-tea-400 text-[10px] uppercase font-bold tracking-wider mb-0.5">Cash</p>
              <p className={`font-bold leading-none ${company.cash < 0 ? 'text-red-400' : 'text-white'}`}>
                {formatMoney(company.cash)}
              </p>
            </div>
            <div className="w-px h-8 bg-matcha-700" />
            <div className="px-4 py-1 text-center min-w-[100px]">
              <p className="text-tea-400 text-[10px] uppercase font-bold tracking-wider mb-0.5">Weekly</p>
              <p className={`font-bold leading-none ${company.weeklyRevenue - company.weeklyExpenses < 0 ? 'text-red-400' : 'text-tea-200'}`}>
                {formatMoney(company.weeklyRevenue - company.weeklyExpenses)}
              </p>
            </div>
            <div className="w-px h-8 bg-matcha-700" />
            <div className="px-4 py-1 text-center">
              <p className="text-tea-400 text-[10px] uppercase font-bold tracking-wider mb-0.5">Stores</p>
              <p className="font-bold leading-none text-white">{stores.filter(s => s.isOpen).length}</p>
            </div>
            <div className="w-px h-8 bg-matcha-700" />
            <div className="px-4 py-1 text-center">
              <p className="text-tea-400 text-[10px] uppercase font-bold tracking-wider mb-0.5">Reputation</p>
              <p className="font-bold leading-none text-white">{Math.round(company.brandReputation)}</p>
            </div>
          </div>

          {/* President */}
          <div className="flex items-center gap-3 pl-4 border-l border-matcha-800">
            <div className="text-right hidden sm:block">
              <p className="text-tea-400 text-[10px] uppercase font-bold tracking-wider">President</p>
              <p className="font-medium text-tea-100">{company.presidentName}</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-tea-600 flex items-center justify-center text-tea-100 font-bold border-2 border-matcha-700 shadow-sm">
              {company.presidentName?.charAt(0) || 'P'}
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-cream-dark sticky top-[64px] z-40 shadow-sm/50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-2 overflow-x-auto py-2 no-scrollbar">
            {NAV_ITEMS.map((item) => {
              const isActive = router.pathname === item.href || router.pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all border ${
                    isActive
                      ? 'bg-matcha-50 text-matcha-700 border-matcha-200 shadow-sm'
                      : 'text-gray-500 border-transparent hover:bg-gray-50 hover:text-gray-700'
                  }`}
                >
                  <span className={isActive ? 'opacity-100' : 'opacity-70 grayscale'}>{item.icon}</span>
                  <span>{item.label}</span>
                  {item.href === '/dashboard' && hasNotifications && (
                    <span className="relative flex h-2 w-2 ml-1">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                  )}
                </Link>
              );
            })}

            <div className="w-px h-6 bg-gray-200 mx-1" />

            {/* Store links */}
            {stores.filter(s => s.isOpen).map((store) => (
              <Link
                key={store.id}
                href={`/store/${store.id}`}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all border ${
                  router.query.id === store.id
                    ? 'bg-tea-50 text-tea-700 border-tea-200 shadow-sm'
                    : 'text-gray-500 border-transparent hover:bg-gray-50 hover:text-gray-700'
                }`}
              >
                <span className={router.query.id === store.id ? 'opacity-100' : 'opacity-70 grayscale'}>🏪</span>
                <span>{store.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
        <div className="animate-fade-in">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-cream-dark text-bark-light text-center text-xs py-6 mt-auto">
        <div className="flex flex-col items-center gap-2">
          <p className="font-medium opacity-80">Matcha Inc. — 抹茶ラテ経営シミュレーション 🍵</p>
          <p className="opacity-50">© 2024 AI Game Studio</p>
        </div>
      </footer>
    </div>
  );
}
