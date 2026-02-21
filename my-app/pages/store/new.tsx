// ============================
// Matcha Inc. — Store Setup (New Store)
// ============================

import { useState, useRef } from 'react';
import { useRouter } from 'next/router';
import { useGameStore } from '@/store/gameStore';
import { useHydrated } from '@/lib/useHydration';
import Layout from '@/components/Layout';
import {
  AREAS, EQUIPMENT_DATA, INTERIOR_DATA,
  TEA_BASE_NAMES, MILK_NAMES, MILK_COSTS,
  TOPPING_NAMES, TOPPING_COSTS, SWEETNESS_NAMES,
} from '@/lib/gameData';
import { formatMoney, calculateMenuItemCost } from '@/lib/gameEngine';
import {
  InteriorTheme, EquipmentType, TeaBase, MilkType,
  ToppingType, SweetnessLevel, MenuItem,
} from '@/types/game';

export default function NewStorePage() {
  const router = useRouter();
  const hydrated = useHydrated();
  const { propertyId } = router.query;
  const { initialized, properties, company, activeSupplier, suppliers, openStore } = useGameStore();

  const [step, setStep] = useState(1);
  const [storeName, setStoreName] = useState('');
  const [interior, setInterior] = useState<InteriorTheme>('cafe');
  const [equipment, setEquipment] = useState<EquipmentType>('electric');
  const [hasWifi, setHasWifi] = useState(true);
  const [hasBgm, setHasBgm] = useState(true);
  const [seatCount, setSeatCount] = useState(10);
  const [menu, setMenu] = useState<MenuItem[]>([]);

  // Menu builder state
  const [menuTeaBase, setMenuTeaBase] = useState<TeaBase>('matcha');
  const [menuMilk, setMenuMilk] = useState<MilkType>('regular');
  const [menuTopping, setMenuTopping] = useState<ToppingType>('none');
  const [menuSweetness, setMenuSweetness] = useState<SweetnessLevel>('normal');
  const [menuPrice, setMenuPrice] = useState(500);

  if (!hydrated) return null;
  if (!initialized) { router.push('/'); return null; }

  const property = properties.find(p => p.id === propertyId);
  if (!property) {
    return (
      <Layout>
        <div className="game-card p-8 text-center">
          <p className="text-bark-light">物件が見つかりません</p>
          <button onClick={() => router.push('/real-estate')} className="btn-matcha mt-4">物件を探す</button>
        </div>
      </Layout>
    );
  }

  const area = AREAS.find(a => a.id === property.areaId);
  const eqData = EQUIPMENT_DATA[equipment];
  const intData = INTERIOR_DATA[interior];
  const totalSetupCost = eqData.cost + intData.cost;
  const supplierData = suppliers.find(s => s.id === activeSupplier);
  const supplierCost = supplierData ? supplierData.costPerKg : 5000;

  const addMenuItem = () => {
    const itemName = `${TEA_BASE_NAMES[menuTeaBase]}${menuMilk !== 'regular' ? ' ' + MILK_NAMES[menuMilk] : ''}ラテ${menuTopping !== 'none' ? ' +' + TOPPING_NAMES[menuTopping] : ''}`;
    const cost = calculateMenuItemCost({ teaBase: menuTeaBase, milkType: menuMilk, topping: menuTopping }, supplierCost);
    const newItem: MenuItem = {
      id: `menu-${Math.random().toString(36).substring(2, 9)}`,
      name: itemName,
      teaBase: menuTeaBase,
      milkType: menuMilk,
      topping: menuTopping,
      sweetness: menuSweetness,
      price: menuPrice,
      cost,
      popularity: 50,
    };
    setMenu([...menu, newItem]);
  };

  const removeMenuItem = (id: string) => {
    setMenu(menu.filter(m => m.id !== id));
  };

  const handleOpenStore = () => {
    openStore(
      property.id,
      storeName || `${area?.name}店`,
      { interiorTheme: interior, equipment, hasWifi, hasBgm, seatCount },
      menu,
    );
    router.push('/city');
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-matcha-700">🏗️ 店舗セットアップ</h1>
          <p className="text-bark-light text-sm">どんな空間で、どんな一杯を届ける？</p>
        </div>

        {/* Property Info */}
        <div className="game-card p-4 bg-matcha-50">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{area?.icon}</span>
            <div>
              <h3 className="font-bold text-matcha-700">{property.name}</h3>
              <p className="text-xs text-bark-light">
                {area?.name} | 家賃: {formatMoney(property.rent)}/月 | {property.size}㎡ | 最大{property.maxSeats}席
              </p>
            </div>
          </div>
        </div>

        {/* Steps */}
        <div className="flex gap-2 mb-4">
          {['店名・内装', '設備', 'メニュー', '確認'].map((label, i) => (
            <button
              key={i}
              onClick={() => setStep(i + 1)}
              className={`flex-1 py-2 text-sm rounded-lg font-medium transition ${
                step === i + 1 ? 'bg-matcha-500 text-white' : 'bg-cream-dark text-bark-light'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Step 1: Name & Interior */}
        {step === 1 && (
          <div className="game-card p-6 animate-fade-in">
            <h2 className="font-bold text-matcha-700 mb-4">📋 店名と内装</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">店名</label>
                <input
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder={`例：${company.name} ${area?.name}店`}
                  className="w-full px-4 py-3 rounded-lg border border-cream-dark bg-white focus:ring-2 focus:ring-matcha-500 focus:outline-none"
                  maxLength={20}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">内装テーマ</label>
                <div className="grid grid-cols-3 gap-3">
                  {(Object.entries(INTERIOR_DATA) as [InteriorTheme, typeof INTERIOR_DATA['wa-modern']][]).map(([key, data]) => (
                    <button
                      key={key}
                      onClick={() => setInterior(key)}
                      className={`game-card p-4 text-center ${interior === key ? 'game-card-selected bg-matcha-50' : ''}`}
                    >
                      <span className="text-2xl block mb-1">{data.icon}</span>
                      <h4 className="font-bold text-sm">{data.name}</h4>
                      <p className="text-xs text-bark-light mt-1">{data.description}</p>
                      <p className="text-xs font-bold text-matcha-600 mt-2">{formatMoney(data.cost)}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button onClick={() => setStep(2)} className="btn-matcha">次へ →</button>
            </div>
          </div>
        )}

        {/* Step 2: Equipment & Amenities */}
        {step === 2 && (
          <div className="game-card p-6 animate-fade-in">
            <h2 className="font-bold text-matcha-700 mb-4">⚙️ 設備・アメニティ</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">抽出設備</label>
                <div className="grid grid-cols-3 gap-3">
                  {(Object.entries(EQUIPMENT_DATA) as [EquipmentType, typeof EQUIPMENT_DATA['chasen']][]).map(([key, data]) => (
                    <button
                      key={key}
                      onClick={() => setEquipment(key)}
                      className={`game-card p-4 text-center ${equipment === key ? 'game-card-selected bg-matcha-50' : ''}`}
                    >
                      <span className="text-2xl block mb-1">{data.icon}</span>
                      <h4 className="font-bold text-sm">{data.name}</h4>
                      <p className="text-xs text-bark-light mt-1">{data.description}</p>
                      <p className="text-xs font-bold text-matcha-600 mt-2">{formatMoney(data.cost)}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <label className="game-card p-4 flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={hasWifi} onChange={(e) => setHasWifi(e.target.checked)} className="w-5 h-5 accent-matcha-500" />
                  <div>
                    <span className="font-medium">📶 Wi-Fi</span>
                    <p className="text-xs text-bark-light">客の滞在時間UP</p>
                  </div>
                </label>
                <label className="game-card p-4 flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={hasBgm} onChange={(e) => setHasBgm(e.target.checked)} className="w-5 h-5 accent-matcha-500" />
                  <div>
                    <span className="font-medium">🎵 BGM</span>
                    <p className="text-xs text-bark-light">満足度UP</p>
                  </div>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">座席数: {seatCount}席 (最大{property.maxSeats})</label>
                <input
                  type="range"
                  min={4}
                  max={property.maxSeats}
                  value={seatCount}
                  onChange={(e) => setSeatCount(Number(e.target.value))}
                  className="w-full accent-matcha-500"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-between">
              <button onClick={() => setStep(1)} className="btn-outline">← 戻る</button>
              <button onClick={() => setStep(3)} className="btn-matcha">次へ →</button>
            </div>
          </div>
        )}

        {/* Step 3: Menu */}
        {step === 3 && (
          <div className="game-card p-6 animate-fade-in">
            <h2 className="font-bold text-matcha-700 mb-4">🍵 メニュー作成</h2>

            {!activeSupplier && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-yellow-800">⚠️ 茶葉の仕入れ先が未設定です。<button onClick={() => router.push('/supply-chain')} className="underline font-bold">仕入れページ</button>で契約してください。デフォルトの原価で計算します。</p>
              </div>
            )}

            {/* Menu Builder */}
            <div className="bg-cream rounded-lg p-4 mb-4">
              <h3 className="font-bold text-sm mb-3">➕ 新しいメニューを追加</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div>
                  <label className="block text-xs text-bark-light mb-1">ベース茶葉</label>
                  <select value={menuTeaBase} onChange={(e) => setMenuTeaBase(e.target.value as TeaBase)} className="w-full px-2 py-2 rounded border border-cream-dark bg-white text-sm">
                    {Object.entries(TEA_BASE_NAMES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-bark-light mb-1">ミルク</label>
                  <select value={menuMilk} onChange={(e) => setMenuMilk(e.target.value as MilkType)} className="w-full px-2 py-2 rounded border border-cream-dark bg-white text-sm">
                    {Object.entries(MILK_NAMES).map(([k, v]) => <option key={k} value={k}>{v} (+¥{MILK_COSTS[k as MilkType]})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-bark-light mb-1">トッピング</label>
                  <select value={menuTopping} onChange={(e) => setMenuTopping(e.target.value as ToppingType)} className="w-full px-2 py-2 rounded border border-cream-dark bg-white text-sm">
                    {Object.entries(TOPPING_NAMES).map(([k, v]) => <option key={k} value={k}>{v} {TOPPING_COSTS[k] > 0 ? `(+¥${TOPPING_COSTS[k]})` : ''}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-bark-light mb-1">甘さ</label>
                  <select value={menuSweetness} onChange={(e) => setMenuSweetness(e.target.value as SweetnessLevel)} className="w-full px-2 py-2 rounded border border-cream-dark bg-white text-sm">
                    {Object.entries(SWEETNESS_NAMES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex items-end gap-3 mt-3">
                <div className="flex-1">
                  <label className="block text-xs text-bark-light mb-1">販売価格</label>
                  <input
                    type="number"
                    value={menuPrice}
                    onChange={(e) => setMenuPrice(Number(e.target.value))}
                    min={100}
                    max={2000}
                    step={50}
                    className="w-full px-3 py-2 rounded border border-cream-dark bg-white text-sm"
                  />
                </div>
                <div className="text-xs text-bark-light">
                  原価: ¥{calculateMenuItemCost({ teaBase: menuTeaBase, milkType: menuMilk, topping: menuTopping }, supplierCost)}
                </div>
                <button onClick={addMenuItem} className="btn-matcha text-sm">追加</button>
              </div>
            </div>

            {/* Current Menu */}
            <div>
              <h3 className="font-bold text-sm mb-2">📋 現在のメニュー ({menu.length}品)</h3>
              {menu.length === 0 ? (
                <p className="text-sm text-bark-light">メニューを追加してください（最低1品必要です）</p>
              ) : (
                <div className="space-y-2">
                  {menu.map((item) => (
                    <div key={item.id} className="flex items-center justify-between bg-white rounded-lg p-3 border border-cream-dark">
                      <div>
                        <p className="font-medium text-sm">{item.name}</p>
                        <p className="text-xs text-bark-light">原価: ¥{item.cost} | 利益: ¥{item.price - item.cost}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-matcha-700">¥{item.price}</span>
                        <button onClick={() => removeMenuItem(item.id)} className="text-red-500 text-sm">✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-between">
              <button onClick={() => setStep(2)} className="btn-outline">← 戻る</button>
              <button onClick={() => setStep(4)} disabled={menu.length === 0} className="btn-matcha">次へ →</button>
            </div>
          </div>
        )}

        {/* Step 4: Confirm */}
        {step === 4 && (
          <div className="game-card p-6 animate-fade-in">
            <h2 className="font-bold text-matcha-700 mb-4">✅ 出店確認</h2>

            <div className="bg-matcha-700 text-white rounded-lg p-5 mb-4">
              <h3 className="text-lg font-bold mb-3 text-center">{storeName || `${company.name} ${area?.name}店`}</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="text-matcha-200">エリア</div>
                <div className="text-right">{area?.icon} {area?.name}</div>
                <div className="text-matcha-200">物件</div>
                <div className="text-right">{property.name}</div>
                <div className="text-matcha-200">内装</div>
                <div className="text-right">{intData.icon} {intData.name}</div>
                <div className="text-matcha-200">設備</div>
                <div className="text-right">{eqData.icon} {eqData.name}</div>
                <div className="text-matcha-200">座席</div>
                <div className="text-right">{seatCount}席</div>
                <div className="text-matcha-200">メニュー数</div>
                <div className="text-right">{menu.length}品</div>
                <div className="text-matcha-200 border-t border-matcha-500 pt-2">初期費用</div>
                <div className="text-right border-t border-matcha-500 pt-2 font-bold text-yellow-300">
                  {formatMoney(totalSetupCost)}
                </div>
                <div className="text-matcha-200">月額家賃</div>
                <div className="text-right">{formatMoney(property.rent)}</div>
              </div>
            </div>

            <div className="text-center text-sm text-bark-light mb-4">
              残りの資金: {formatMoney(company.cash - totalSetupCost)}
            </div>

            <div className="flex justify-between">
              <button onClick={() => setStep(3)} className="btn-outline">← 戻る</button>
              <button
                onClick={handleOpenStore}
                disabled={company.cash < totalSetupCost}
                className="btn-matcha px-8 text-lg shadow-lg"
              >
                🎉 開店する！
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
