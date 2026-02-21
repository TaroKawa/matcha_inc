// ============================
// Matcha Inc. — Landing / Title Page
// ============================

import { useRouter } from 'next/router';
import { useGameStore } from '@/store/gameStore';
import { useEffect, useState } from 'react';
import { useHydrated } from '@/lib/useHydration';

export default function Home() {
  const router = useRouter();
  const { initialized, resetGame } = useGameStore();
  const hydrated = useHydrated();
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 500);
    return () => clearTimeout(timer);
  }, []);

  const handleNewGame = () => {
    resetGame();
    router.push('/register');
  };

  const handleContinue = () => {
    router.push('/city');
  };

  if (!hydrated) return null;

  return (
    <div className="min-h-screen bg-matcha-800 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-0"
      >
        <source src="/matcha_inc_bannar.mp4" type="video/mp4" />
      </video>

      {/* Dark overlay for text readability */}
      <div className="absolute inset-0 bg-black/50 z-[1]" />

      {/* Steam particles */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="steam-particle absolute text-white/20 text-4xl"
            style={{
              left: `${(i - 2) * 30}px`,
              animationDelay: `${i * 0.4}s`,
            }}
          >
            ☁
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className={`text-center z-10 transition-all duration-1000 ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        {/* Title */}
        <h1 className="text-6xl font-black text-white mb-3 tracking-tight">
          Matcha Inc.
        </h1>
        <p className="text-matcha-200 text-xl mb-2 font-light">
          抹茶ラテ経営シミュレーション
        </p>
        <p className="text-matcha-300/60 text-sm mb-12 max-w-md mx-auto">
          東京の小さな1店舗から始まり、AIが生み出すリアルな顧客・従業員・ライバルと戦いながら、
          全国チェーンへと成長させよう。
        </p>

        {/* Buttons */}
        <div className="flex flex-col gap-4 items-center">
          <button
            onClick={handleNewGame}
            className="btn-matcha text-lg px-12 py-4 rounded-xl shadow-lg shadow-matcha-900/50 hover:shadow-xl hover:shadow-matcha-900/50 transition-all text-white bg-matcha-500 hover:bg-matcha-400 font-bold tracking-wide"
          >
            🌱 新しいゲームを始める
          </button>

          {initialized && (
            <button
              onClick={handleContinue}
              className="btn-outline text-matcha-200 border-matcha-400/50 hover:bg-matcha-700/50 px-10 py-3 rounded-xl transition-all"
            >
              📂 続きから
            </button>
          )}
        </div>

        {/* Version info */}
        <p className="text-matcha-400/40 text-xs mt-16">
          v0.1.0 — Powered by Gemini AI
        </p>
      </div>

      {/* Decorative leaves */}
      <div className="absolute bottom-0 left-0 text-6xl opacity-10 transform -rotate-45">🍃</div>
      <div className="absolute top-20 right-10 text-4xl opacity-10 transform rotate-12">🍃</div>
      <div className="absolute bottom-20 right-20 text-5xl opacity-10 transform -rotate-30">🌿</div>
    </div>
  );
}
