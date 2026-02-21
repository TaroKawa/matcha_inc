// ============================
// Matcha Inc. — Real Estate / Property Search
// ============================

import { useState } from 'react';
import { useRouter } from 'next/router';
import { useGameStore } from '@/store/gameStore';
import { useHydrated } from '@/lib/useHydration';
import Layout from '@/components/Layout';
import { AREAS } from '@/lib/gameData';
import { formatMoney } from '@/lib/gameEngine';
import { AreaId } from '@/types/game';

export default function RealEstatePage() {
  const router = useRouter();
  const hydrated = useHydrated();
  const { initialized, properties, company } = useGameStore();
  const [selectedArea, setSelectedArea] = useState<AreaId | null>(null);

  if (!hydrated) return null;
  if (!initialized) { router.push('/'); return null; }

  const availableProperties = properties.filter(p => p.available);
  const filteredProperties = selectedArea
    ? availableProperties.filter(p => p.areaId === selectedArea)
    : availableProperties;

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-matcha-700">🏠 物件探し・出店</h1>
          <p className="text-bark-light text-sm">立地が9割。東京のどこに旗を立てる？</p>
        </div>

        {/* Area Map */}
        <div className="game-card p-6">
          <h2 className="font-bold text-matcha-700 mb-4">📍 エリア選択</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {AREAS.map((area) => {
              const areaProps = availableProperties.filter(p => p.areaId === area.id);
              const isSelected = selectedArea === area.id;
              return (
                <button
                  key={area.id}
                  onClick={() => setSelectedArea(isSelected ? null : area.id)}
                  className={`game-card p-4 text-center cursor-pointer transition-all ${
                    isSelected ? 'game-card-selected bg-matcha-50' : ''
                  }`}
                >
                  <span className="text-3xl block mb-2">{area.icon}</span>
                  <h3 className="font-bold text-matcha-700">{area.name}</h3>
                  <p className="text-xs text-bark-light mt-1 line-clamp-2">{area.description}</p>
                  <div className="mt-2 flex flex-wrap gap-1 justify-center">
                    {area.customerTypes.map((ct) => (
                      <span key={ct} className="text-xs bg-matcha-100 text-matcha-700 px-1.5 py-0.5 rounded">
                        {ct}
                      </span>
                    ))}
                  </div>
                  <div className="mt-2 text-xs text-bark-light">
                    <span>人通り: {area.footTraffic}</span>
                    <span className="ml-2">物件: {areaProps.length}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Properties List */}
        <div>
          <h2 className="font-bold text-matcha-700 mb-3 text-lg">
            🏢 物件一覧
            {selectedArea && ` — ${AREAS.find(a => a.id === selectedArea)?.name}`}
            <span className="text-sm font-normal text-bark-light ml-2">
              ({filteredProperties.length}件)
            </span>
          </h2>

          {filteredProperties.length === 0 ? (
            <div className="game-card p-8 text-center">
              <p className="text-bark-light">このエリアには空き物件がありません</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredProperties.map((prop) => {
                const area = AREAS.find(a => a.id === prop.areaId);
                const canAfford = company.cash >= prop.rent * 3; // need at least 3 months rent
                return (
                  <div key={prop.id} className="game-card p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-matcha-700">{prop.name}</h3>
                        <p className="text-xs text-bark-light">{area?.icon} {area?.name}エリア</p>
                      </div>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">空き</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                      <div>
                        <p className="text-xs text-bark-light">家賃/月</p>
                        <p className="font-bold text-matcha-700">{formatMoney(prop.rent)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-bark-light">広さ</p>
                        <p className="font-bold">{prop.size}㎡</p>
                      </div>
                      <div>
                        <p className="text-xs text-bark-light">最大座席数</p>
                        <p className="font-bold">{prop.maxSeats}席</p>
                      </div>
                      <div>
                        <p className="text-xs text-bark-light">人通り</p>
                        <div className="flex items-center gap-1">
                          <div className="progress-bar flex-1">
                            <div
                              className="progress-bar-fill bg-matcha-500"
                              style={{ width: `${prop.footTraffic}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold">{prop.footTraffic}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => router.push(`/store/new?propertyId=${prop.id}`)}
                      disabled={!canAfford}
                      className={`w-full ${canAfford ? 'btn-matcha' : 'btn-matcha opacity-50 cursor-not-allowed'}`}
                    >
                      {canAfford ? '🏗️ この物件で出店する' : '💸 資金不足'}
                    </button>
                    {!canAfford && (
                      <p className="text-xs text-red-500 mt-1 text-center">
                        最低{formatMoney(prop.rent * 3)}必要（家賃3ヶ月分）
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
