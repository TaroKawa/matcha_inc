// ============================
// Matcha Inc. — HR / Employee Management
// ============================

import { useRouter } from 'next/router';
import { useGameStore } from '@/store/gameStore';
import { useHydrated } from '@/lib/useHydration';
import Layout from '@/components/Layout';
import { formatMoney } from '@/lib/gameEngine';
import { AREAS } from '@/lib/gameData';

export default function HRPage() {
  const router = useRouter();
  const hydrated = useHydrated();
  const {
    initialized, employees, applicants, stores,
    hireEmployee, fireEmployee, assignEmployee, generateApplicants,
  } = useGameStore();

  if (!hydrated) return null;
  if (!initialized) { router.push('/'); return null; }

  const openStores = stores.filter(s => s.isOpen);

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-matcha-700">👥 人事管理</h1>
          <p className="text-bark-light text-sm">人が会社を作る。でも人が会社を壊しもする。</p>
        </div>

        {/* Current Employees */}
        <div className="game-card p-5">
          <h2 className="font-bold text-matcha-700 mb-3">📋 現在の従業員 ({employees.length}人)</h2>
          {employees.length === 0 ? (
            <p className="text-sm text-bark-light text-center py-4">まだ従業員がいません。下の応募者リストから採用しましょう。</p>
          ) : (
            <div className="space-y-3">
              {employees.map((emp) => {
                const assignedStore = stores.find(s => s.id === emp.assignedStoreId);
                const area = assignedStore ? AREAS.find(a => a.id === assignedStore.areaId) : null;
                return (
                  <div key={emp.id} className="bg-cream rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-bold">
                          {emp.role === 'manager' ? '👔' : '🍵'} {emp.name}
                          <span className="text-xs font-normal text-bark-light ml-2">
                            {emp.age}歳 / {emp.role === 'manager' ? 'マネージャー' : 'バリスタ'}
                          </span>
                        </h3>
                        <p className="text-xs text-bark-light">{emp.background} — {emp.personality}</p>
                      </div>
                      <div className="text-right text-xs">
                        <p>時給: ¥{emp.hourlyWage}</p>
                        <p>勤続: {emp.weeksEmployed}週</p>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-4 gap-2 text-xs mb-3">
                      <div>
                        <p className="text-bark-light">スキル</p>
                        <div className="progress-bar mt-1">
                          <div className="progress-bar-fill bg-blue-500" style={{ width: `${emp.skill}%` }} />
                        </div>
                        <p className="font-bold text-center">{emp.skill}</p>
                      </div>
                      <div>
                        <p className="text-bark-light">スピード</p>
                        <div className="progress-bar mt-1">
                          <div className="progress-bar-fill bg-green-500" style={{ width: `${emp.speed}%` }} />
                        </div>
                        <p className="font-bold text-center">{emp.speed}</p>
                      </div>
                      <div>
                        <p className="text-bark-light">やる気</p>
                        <div className="progress-bar mt-1">
                          <div className="progress-bar-fill bg-yellow-500" style={{ width: `${emp.motivation}%` }} />
                        </div>
                        <p className="font-bold text-center">{emp.motivation}</p>
                      </div>
                      <div>
                        <p className="text-bark-light">疲労</p>
                        <div className="progress-bar mt-1">
                          <div className="progress-bar-fill bg-red-500" style={{ width: `${emp.fatigue}%` }} />
                        </div>
                        <p className="font-bold text-center">{emp.fatigue}</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <select
                        value={emp.assignedStoreId || ''}
                        onChange={(e) => assignEmployee(emp.id, e.target.value || null)}
                        className="text-sm px-2 py-1.5 rounded border border-cream-dark bg-white flex-1"
                      >
                        <option value="">未配属</option>
                        {openStores.map(s => {
                          const a = AREAS.find(ar => ar.id === s.areaId);
                          return <option key={s.id} value={s.id}>{s.name} ({a?.name})</option>;
                        })}
                      </select>
                      <button
                        onClick={() => fireEmployee(emp.id)}
                        className="text-xs text-red-500 border border-red-300 rounded px-2 py-1.5 hover:bg-red-50"
                      >
                        解雇
                      </button>
                    </div>
                    {!emp.assignedStoreId && (
                      <p className="text-xs text-yellow-600 mt-1">⚠️ 店舗に配属してください</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Applicants */}
        <div className="game-card p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-matcha-700">📝 応募者リスト ({applicants.length}人)</h2>
            <button onClick={() => generateApplicants(3)} className="btn-outline text-sm">
              🔄 新しい応募者を探す
            </button>
          </div>

          {applicants.length === 0 ? (
            <p className="text-sm text-bark-light text-center py-4">応募者がいません。「新しい応募者を探す」をクリックしてください。</p>
          ) : (
            <div className="space-y-3">
              {applicants.map((app) => (
                <div key={app.id} className="bg-white rounded-lg p-4 border border-cream-dark">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-bold">
                        {app.role === 'manager' ? '👔' : '🍵'} {app.name}
                        <span className="text-xs font-normal text-bark-light ml-2">
                          {app.age}歳 / {app.role === 'manager' ? 'マネージャー' : 'バリスタ'}
                        </span>
                      </h3>
                      <p className="text-xs text-bark-light mt-1">📄 {app.background}</p>
                      <p className="text-xs text-bark-light">💭 {app.personality}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-matcha-700">¥{app.hourlyWage}/h</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                    <div className="flex items-center gap-1">
                      <span className="text-bark-light">スキル:</span>
                      <div className="progress-bar flex-1">
                        <div className="progress-bar-fill bg-blue-500" style={{ width: `${app.skill}%` }} />
                      </div>
                      <span className="font-bold">{app.skill}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-bark-light">スピード:</span>
                      <div className="progress-bar flex-1">
                        <div className="progress-bar-fill bg-green-500" style={{ width: `${app.speed}%` }} />
                      </div>
                      <span className="font-bold">{app.speed}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => hireEmployee(app.id)}
                    className="btn-matcha w-full text-sm"
                  >
                    ✅ 採用する（週給: ¥{(app.hourlyWage * 40).toLocaleString()}）
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
