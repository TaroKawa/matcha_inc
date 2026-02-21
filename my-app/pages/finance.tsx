// ============================
// Matcha Inc. — Finance / Accounting
// ============================

import { useState } from 'react';
import { useRouter } from 'next/router';
import { useGameStore } from '@/store/gameStore';
import { useHydrated } from '@/lib/useHydration';
import Layout from '@/components/Layout';
import { formatMoney } from '@/lib/gameEngine';

export default function FinancePage() {
  const router = useRouter();
  const hydrated = useHydrated();
  const { initialized, company, weeklyFinances, loans, takeLoan } = useGameStore();
  const [loanAmount, setLoanAmount] = useState(1000000);

  if (!hydrated) return null;
  if (!initialized) { router.push('/'); return null; }

  const recentFinances = [...weeklyFinances].reverse().slice(0, 12);
  const totalLoanDebt = loans.reduce((sum, l) => sum + l.weeklyPayment * l.remainingWeeks, 0);

  const loanOptions = [
    { amount: 1000000, rate: 0.05, weeks: 20, label: '100万円（5%・20週）' },
    { amount: 3000000, rate: 0.08, weeks: 30, label: '300万円（8%・30週）' },
    { amount: 5000000, rate: 0.10, weeks: 40, label: '500万円（10%・40週）' },
    { amount: 10000000, rate: 0.15, weeks: 52, label: '1,000万円（15%・52週）' },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-matcha-700">💰 財務・経営戦略</h1>
          <p className="text-bark-light text-sm">数字は嘘をつかない</p>
        </div>

        {/* Financial Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="game-card p-4">
            <p className="text-xs text-bark-light">💰 総資産</p>
            <p className={`text-xl font-bold ${company.cash >= 0 ? 'text-matcha-700' : 'text-red-600'}`}>
              {formatMoney(company.cash)}
            </p>
          </div>
          <div className="game-card p-4">
            <p className="text-xs text-bark-light">📈 累計売上</p>
            <p className="text-xl font-bold text-green-600">{formatMoney(company.totalRevenue)}</p>
          </div>
          <div className="game-card p-4">
            <p className="text-xs text-bark-light">📉 累計支出</p>
            <p className="text-xl font-bold text-red-500">{formatMoney(company.totalExpenses)}</p>
          </div>
          <div className="game-card p-4">
            <p className="text-xs text-bark-light">🏦 借入残高</p>
            <p className="text-xl font-bold text-orange-600">{formatMoney(totalLoanDebt)}</p>
          </div>
        </div>

        {/* P/L Statement */}
        <div className="game-card p-5">
          <h2 className="font-bold text-matcha-700 mb-3">📊 損益計算書（P/L）— 週次</h2>
          {recentFinances.length === 0 ? (
            <p className="text-sm text-bark-light text-center py-4">まだデータがありません</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-cream-dark">
                    <th className="text-left py-2 text-bark-light font-medium">Week</th>
                    <th className="text-right py-2 text-bark-light font-medium">売上</th>
                    <th className="text-right py-2 text-bark-light font-medium">家賃</th>
                    <th className="text-right py-2 text-bark-light font-medium">人件費</th>
                    <th className="text-right py-2 text-bark-light font-medium">仕入</th>
                    <th className="text-right py-2 text-bark-light font-medium">広告</th>
                    <th className="text-right py-2 text-bark-light font-medium">その他</th>
                    <th className="text-right py-2 text-bark-light font-medium">利益</th>
                  </tr>
                </thead>
                <tbody>
                  {recentFinances.map((f) => (
                    <tr key={f.week} className="border-b border-cream-dark/50">
                      <td className="py-2 font-medium">W{f.week}</td>
                      <td className="py-2 text-right text-green-600">{formatMoney(f.breakdown.storeRevenue)}</td>
                      <td className="py-2 text-right text-red-500">{formatMoney(f.breakdown.rent)}</td>
                      <td className="py-2 text-right text-red-500">{formatMoney(f.breakdown.wages)}</td>
                      <td className="py-2 text-right text-red-500">{formatMoney(f.breakdown.supplies)}</td>
                      <td className="py-2 text-right text-red-500">{formatMoney(f.breakdown.marketing)}</td>
                      <td className="py-2 text-right text-red-500">{formatMoney(f.breakdown.other)}</td>
                      <td className={`py-2 text-right font-bold ${f.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatMoney(f.profit)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Active Loans */}
        {loans.length > 0 && (
          <div className="game-card p-5">
            <h2 className="font-bold text-matcha-700 mb-3">🏦 借入一覧</h2>
            <div className="space-y-2">
              {loans.map((loan) => (
                <div key={loan.id} className="bg-cream rounded-lg p-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{formatMoney(loan.amount)}（金利{(loan.interestRate * 100).toFixed(0)}%）</p>
                    <p className="text-xs text-bark-light">週返済: {formatMoney(loan.weeklyPayment)} | 残り{loan.remainingWeeks}週</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-bark-light">残債</p>
                    <p className="font-bold text-orange-600">
                      {formatMoney(loan.weeklyPayment * loan.remainingWeeks)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Take Loan */}
        <div className="game-card p-5">
          <h2 className="font-bold text-matcha-700 mb-3">🏦 銀行融資</h2>
          <p className="text-sm text-bark-light mb-4">事業拡大のための資金調達。ただし返済義務は忘れずに。</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {loanOptions.map((opt, idx) => {
              const totalRepayment = opt.amount * (1 + opt.rate);
              const weeklyPayment = totalRepayment / opt.weeks;
              return (
                <div key={idx} className="game-card p-4">
                  <h3 className="font-bold text-matcha-700 mb-2">{opt.label}</h3>
                  <div className="text-xs space-y-1 mb-3">
                    <p>融資額: {formatMoney(opt.amount)}</p>
                    <p>総返済額: {formatMoney(totalRepayment)}</p>
                    <p>週返済: {formatMoney(weeklyPayment)}</p>
                  </div>
                  <button
                    onClick={() => takeLoan(opt.amount, opt.rate, opt.weeks)}
                    className="btn-matcha w-full text-sm"
                  >
                    💸 融資を受ける
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Layout>
  );
}
