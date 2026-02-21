// ============================
// Matcha Inc. — Property Detail Modal
// ============================

import { Property, Store } from '@/types/game';
import { AREAS } from '@/lib/gameData';
import { formatMoney } from '@/lib/gameEngine';
import { useGameStore } from '@/store/gameStore';
import { useRouter } from 'next/router';

interface PropertyModalProps {
  property: Property;
  store?: Store;
  onClose: () => void;
}

export default function PropertyModal({ property, store, onClose }: PropertyModalProps) {
  const router = useRouter();
  const { company } = useGameStore();
  const area = AREAS.find(a => a.id === property.areaId);
  const isOccupied = !!store;
  const isAvailable = property.available && !store;
  const canAfford = company.cash >= property.rent * 3;

  const handleSetupStore = () => {
    onClose();
    router.push(`/store/new?propertyId=${property.id}`);
  };

  const handleManageStore = () => {
    if (store) {
      onClose();
      router.push(`/store/${store.id}`);
    }
  };

  return (
    <div className="modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-matcha-700 text-white p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{area?.icon || '🏢'}</span>
              <div>
                <h2 className="text-lg font-bold">{property.name}</h2>
                <p className="text-matcha-200 text-sm">{area?.name}エリア</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          {/* Status Badge */}
          <div className="mb-4">
            {isAvailable && (
              <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-bold">
                📋 テナント募集中
              </span>
            )}
            {isOccupied && (
              <span className="inline-flex items-center gap-1 bg-matcha-100 text-matcha-700 px-3 py-1 rounded-full text-sm font-bold">
                🏪 {store!.name}が営業中
              </span>
            )}
            {!isAvailable && !isOccupied && (
              <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm font-bold">
                🔒 利用不可
              </span>
            )}
          </div>

          {/* Property Details */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="bg-cream rounded-lg p-3">
              <p className="text-xs text-bark-light">💰 家賃/月</p>
              <p className="font-bold text-matcha-700">{formatMoney(property.rent)}</p>
            </div>
            <div className="bg-cream rounded-lg p-3">
              <p className="text-xs text-bark-light">📐 広さ</p>
              <p className="font-bold">{property.size}㎡</p>
            </div>
            <div className="bg-cream rounded-lg p-3">
              <p className="text-xs text-bark-light">🪑 最大座席数</p>
              <p className="font-bold">{property.maxSeats}席</p>
            </div>
            <div className="bg-cream rounded-lg p-3">
              <p className="text-xs text-bark-light">👥 人通り</p>
              <div className="flex items-center gap-1">
                <div className="progress-bar flex-1">
                  <div
                    className="progress-bar-fill bg-matcha-500"
                    style={{ width: `${property.footTraffic}%` }}
                  />
                </div>
                <span className="text-xs font-bold">{property.footTraffic}</span>
              </div>
            </div>
          </div>

          {/* Area Description */}
          <div className="bg-matcha-50 rounded-lg p-3 mb-5">
            <p className="text-xs text-matcha-700 font-bold mb-1">📍 {area?.name}エリアの特徴</p>
            <p className="text-xs text-bark-light">{area?.description}</p>
            <div className="flex flex-wrap gap-1 mt-2">
              {area?.customerTypes.map((ct) => (
                <span key={ct} className="text-[10px] bg-matcha-100 text-matcha-700 px-1.5 py-0.5 rounded">
                  {ct}
                </span>
              ))}
            </div>
          </div>

          {/* Store Info (if occupied) */}
          {isOccupied && store && (
            <div className="bg-cream rounded-lg p-3 mb-5">
              <p className="text-xs text-bark-light font-bold mb-2">📊 店舗情報</p>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div>
                  <p className="text-bark-light">客数/週</p>
                  <p className="font-bold text-matcha-700">{store.weeklyCustomers}</p>
                </div>
                <div>
                  <p className="text-bark-light">売上/週</p>
                  <p className="font-bold text-matcha-700">{formatMoney(store.weeklyRevenue)}</p>
                </div>
                <div>
                  <p className="text-bark-light">満足度</p>
                  <p className={`font-bold ${store.customerSatisfaction >= 60 ? 'text-green-600' : store.customerSatisfaction >= 40 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {store.customerSatisfaction}%
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-2">
            {isAvailable && (
              <>
                <button
                  onClick={handleSetupStore}
                  disabled={!canAfford}
                  className={`w-full py-3 rounded-xl font-bold text-white transition ${
                    canAfford 
                      ? 'bg-matcha-500 hover:bg-matcha-600 shadow-lg' 
                      : 'bg-gray-400 cursor-not-allowed'
                  }`}
                >
                  {canAfford ? '🏗️ この物件で出店する' : '💸 資金不足'}
                </button>
                {!canAfford && (
                  <p className="text-xs text-red-500 text-center">
                    最低{formatMoney(property.rent * 3)}必要（家賃3ヶ月分）
                  </p>
                )}
              </>
            )}
            {isOccupied && (
              <button
                onClick={handleManageStore}
                className="w-full py-3 rounded-xl font-bold text-white bg-matcha-500 hover:bg-matcha-600 shadow-lg transition"
              >
                🏪 店舗を管理する
              </button>
            )}
            <button
              onClick={onClose}
              className="w-full py-2 rounded-xl font-medium text-bark-light hover:bg-cream transition"
            >
              閉じる
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
