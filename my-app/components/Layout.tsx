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
    <div className="min-h-screen flex flex-col">
      {/* Top Bar */}
      <header className="bg-matcha-700 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
          {/* Logo & Company */}
          <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition">
            <span className="text-2xl">{logo?.emoji || '🍵'}</span>
            <div>
              <h1 className="text-lg font-bold leading-tight">{company.name || 'Matcha Inc.'}</h1>
              <p className="text-xs text-matcha-200 leading-tight">{PHASE_NAMES[gamePhase]}</p>
            </div>
          </Link>

          {/* Stats Bar */}
          <div className="hidden md:flex items-center gap-6 text-sm">
            <div className="text-center">
              <p className="text-matcha-200 text-xs">Week</p>
              <p className="font-bold text-lg leading-tight">{currentWeek}</p>
            </div>
            <div className="w-px h-8 bg-matcha-500" />
            <div className="text-center">
              <p className="text-matcha-200 text-xs">資金</p>
              <p className={`font-bold leading-tight ${company.cash < 0 ? 'text-red-300' : ''}`}>
                {formatMoney(company.cash)}
              </p>
            </div>
            <div className="w-px h-8 bg-matcha-500" />
            <div className="text-center">
              <p className="text-matcha-200 text-xs">週収益</p>
              <p className={`font-bold leading-tight ${company.weeklyRevenue - company.weeklyExpenses < 0 ? 'text-red-300' : 'text-green-300'}`}>
                {formatMoney(company.weeklyRevenue - company.weeklyExpenses)}
              </p>
            </div>
            <div className="w-px h-8 bg-matcha-500" />
            <div className="text-center">
              <p className="text-matcha-200 text-xs">店舗</p>
              <p className="font-bold leading-tight">{stores.filter(s => s.isOpen).length}</p>
            </div>
            <div className="w-px h-8 bg-matcha-500" />
            <div className="text-center">
              <p className="text-matcha-200 text-xs">評判</p>
              <p className="font-bold leading-tight">{Math.round(company.brandReputation)}/100</p>
            </div>
          </div>

          {/* President */}
          <div className="text-right text-sm">
            <p className="text-matcha-200 text-xs">社長</p>
            <p className="font-medium">{company.presidentName}</p>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-matcha-800 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-1 overflow-x-auto py-1">
            {NAV_ITEMS.map((item) => {
              const isActive = router.pathname === item.href || router.pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-matcha-500 text-white'
                      : 'text-matcha-200 hover:bg-matcha-600 hover:text-white'
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                  {item.href === '/dashboard' && hasNotifications && (
                    <span className="relative">
                      <span className="notification-dot" />
                    </span>
                  )}
                </Link>
              );
            })}

            {/* Store links */}
            {stores.filter(s => s.isOpen).map((store) => (
              <Link
                key={store.id}
                href={`/store/${store.id}`}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  router.query.id === store.id
                    ? 'bg-matcha-500 text-white'
                    : 'text-matcha-200 hover:bg-matcha-600 hover:text-white'
                }`}
              >
                <span>🏪</span>
                <span>{store.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-matcha-800 text-matcha-200 text-center text-xs py-3">
        Matcha Inc. — 抹茶ラテ経営シミュレーション 🍵
      </footer>
    </div>
  );
}
