// ============================
// Matcha Inc. — Company Registration Page
// ============================

import { useState } from 'react';
import { useRouter } from 'next/router';
import { useGameStore } from '@/store/gameStore';
import { LOGO_OPTIONS, DIFFICULTY_PRESETS } from '@/lib/gameData';
import { formatMoney } from '@/lib/gameEngine';

export default function RegisterPage() {
  const router = useRouter();
  const { initGame } = useGameStore();

  const [companyName, setCompanyName] = useState('');
  const [presidentName, setPresidentName] = useState('');
  const [logoIndex, setLogoIndex] = useState(0);
  const [capitalIndex, setCapitalIndex] = useState(1); // default: normal
  const [step, setStep] = useState(1);

  const canProceed = step === 1
    ? companyName.trim() !== '' && presidentName.trim() !== ''
    : true;

  const handleStart = () => {
    const preset = DIFFICULTY_PRESETS[capitalIndex];
    initGame({
      name: companyName.trim(),
      presidentName: presidentName.trim(),
      logoIndex,
      initialCapital: preset.capital,
    });
    router.push('/city');
  };

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <span className="text-5xl mb-3 block">🍵</span>
          <h1 className="text-3xl font-bold text-matcha-700">会社設立</h1>
          <p className="text-bark-light mt-1">あなたの抹茶帝国は、ここから始まる</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                s <= step ? 'bg-matcha-500 text-white' : 'bg-cream-dark text-bark-light'
              }`}>
                {s}
              </div>
              {s < 3 && <div className={`w-12 h-0.5 ${s < step ? 'bg-matcha-500' : 'bg-cream-dark'}`} />}
            </div>
          ))}
        </div>

        {/* Step 1: Company & President */}
        {step === 1 && (
          <div className="game-card p-8 animate-slide-up">
            <h2 className="text-xl font-bold text-matcha-700 mb-6">📋 基本情報</h2>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-bark mb-1">会社名</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="例：抹茶ラボ、GREEN LEAF、茶の道..."
                  className="w-full px-4 py-3 rounded-lg border border-cream-dark bg-white text-bark placeholder-bark-light/50 focus:outline-none focus:ring-2 focus:ring-matcha-500 focus:border-transparent transition"
                  maxLength={20}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-bark mb-1">社長の名前</label>
                <input
                  type="text"
                  value={presidentName}
                  onChange={(e) => setPresidentName(e.target.value)}
                  placeholder="例：山田 太郎"
                  className="w-full px-4 py-3 rounded-lg border border-cream-dark bg-white text-bark placeholder-bark-light/50 focus:outline-none focus:ring-2 focus:ring-matcha-500 focus:border-transparent transition"
                  maxLength={20}
                />
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <button
                onClick={() => setStep(2)}
                disabled={!canProceed}
                className="btn-matcha px-8"
              >
                次へ →
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Logo Selection */}
        {step === 2 && (
          <div className="game-card p-8 animate-slide-up">
            <h2 className="text-xl font-bold text-matcha-700 mb-6">🎨 ロゴを選択</h2>

            <div className="grid grid-cols-3 gap-4">
              {LOGO_OPTIONS.map((logo) => (
                <button
                  key={logo.index}
                  onClick={() => setLogoIndex(logo.index)}
                  className={`game-card p-6 text-center cursor-pointer transition-all ${
                    logoIndex === logo.index ? 'game-card-selected bg-matcha-50' : ''
                  }`}
                >
                  <span className="text-4xl block mb-2">{logo.emoji}</span>
                  <span className="text-sm text-bark-light">{logo.name}</span>
                </button>
              ))}
            </div>

            {/* Preview */}
            <div className="mt-6 p-4 bg-matcha-50 rounded-lg text-center">
              <div className="flex items-center justify-center gap-3">
                <span className="text-3xl">{LOGO_OPTIONS[logoIndex].emoji}</span>
                <span className="text-xl font-bold text-matcha-700">{companyName || '会社名'}</span>
              </div>
              <p className="text-xs text-bark-light mt-1">社長: {presidentName || '名前'}</p>
            </div>

            <div className="mt-8 flex justify-between">
              <button onClick={() => setStep(1)} className="btn-outline">← 戻る</button>
              <button onClick={() => setStep(3)} className="btn-matcha px-8">次へ →</button>
            </div>
          </div>
        )}

        {/* Step 3: Initial Capital (Difficulty) */}
        {step === 3 && (
          <div className="game-card p-8 animate-slide-up">
            <h2 className="text-xl font-bold text-matcha-700 mb-2">💰 初期資本金を選択</h2>
            <p className="text-sm text-bark-light mb-6">資本金の額が難易度に直結します。慎重に選びましょう。</p>

            <div className="space-y-4">
              {DIFFICULTY_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => setCapitalIndex(idx)}
                  className={`w-full game-card p-5 text-left cursor-pointer transition-all ${
                    capitalIndex === idx ? 'game-card-selected bg-matcha-50' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-lg">{preset.label}</h3>
                      <p className="text-sm text-bark-light mt-1">{preset.description}</p>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      capitalIndex === idx
                        ? 'border-matcha-500 bg-matcha-500'
                        : 'border-cream-dark'
                    }`}>
                      {capitalIndex === idx && (
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Summary */}
            <div className="mt-6 p-4 bg-matcha-700 text-white rounded-lg">
              <h3 className="font-bold text-center mb-3">📊 スタート概要</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="text-matcha-200">会社名</div>
                <div className="font-medium text-right">{LOGO_OPTIONS[logoIndex].emoji} {companyName}</div>
                <div className="text-matcha-200">社長</div>
                <div className="font-medium text-right">{presidentName}</div>
                <div className="text-matcha-200">初期資本金</div>
                <div className="font-medium text-right">{formatMoney(DIFFICULTY_PRESETS[capitalIndex].capital)}</div>
                <div className="text-matcha-200">難易度</div>
                <div className="font-medium text-right capitalize">{DIFFICULTY_PRESETS[capitalIndex].difficulty}</div>
              </div>
            </div>

            <div className="mt-8 flex justify-between">
              <button onClick={() => setStep(2)} className="btn-outline">← 戻る</button>
              <button
                onClick={handleStart}
                className="btn-matcha px-8 text-lg bg-matcha-500 hover:bg-matcha-400 shadow-lg"
              >
                🚀 創業する！
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
