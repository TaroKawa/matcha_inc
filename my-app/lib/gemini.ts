// ============================
// Matcha Inc. — Gemini API Integration
// ============================

import { GoogleGenerativeAI } from '@google/generative-ai';
import { Store, Employee, GameState } from '@/types/game';

const API_KEY = 'AIzaSyDmnoKrQT7b2UEw_nZNOjIuNisutpAN0mc';
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

// --- Generate Customer Reviews ---
export async function generateReviews(
  store: Store,
  state: GameState,
): Promise<{ customerName: string; rating: number; comment: string }[]> {
  try {
    const prompt = `あなたは抹茶ラテ専門店のお客さんです。以下の店舗情報に基づいて、2〜3件のリアルな日本語の顧客レビューをJSON配列で生成してください。

店舗情報:
- 店名: ${store.name}
- エリア: ${store.areaId}
- 内装: ${store.setup.interiorTheme}
- 設備: ${store.setup.equipment}
- WiFi: ${store.setup.hasWifi ? 'あり' : 'なし'}
- 客数/週: ${store.weeklyCustomers}
- 顧客満足度: ${store.customerSatisfaction}/100
- メニュー数: ${store.menu.length}
- 平均価格: ${store.menu.length > 0 ? Math.round(store.menu.reduce((s, m) => s + m.price, 0) / store.menu.length) : 0}円

満足度が${store.customerSatisfaction}点なので、レビューの星の平均もそれに合わせてください。
満足度が低い場合は辛口レビューも含めてください。
「ヘルシーなメニューが欲しい」と言うけど実際は甘いものを買うような、リアルな矛盾も時々入れてください。

JSON形式（配列）で返してください。余計なテキストは不要です:
[{"customerName": "名前", "rating": 1-5の数字, "comment": "レビュー文"}]`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return [];
  } catch (error) {
    console.error('Gemini review generation failed:', error);
    return getFallbackReviews(store.customerSatisfaction);
  }
}

// --- Generate Employee Profile ---
export async function generateEmployeeProfile(): Promise<{
  name: string;
  age: number;
  background: string;
  personality: string;
  hourlyWage: number;
}> {
  try {
    const prompt = `あなたは抹茶ラテ専門店の求人に応募してきた人物を生成するAIです。
リアルな日本人の応募者プロフィールを1件、JSON形式で生成してください。

個性的でユニークな経歴・性格を含めてください。長所と短所の両方を含めること。

JSON形式で返してください。余計なテキストは不要:
{"name": "姓 名", "age": 18-55の数字, "background": "経歴（50文字以内）", "personality": "性格の特徴（30文字以内）", "hourlyWage": 1000-2000の数字}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error('No JSON found');
  } catch (error) {
    console.error('Gemini employee generation failed:', error);
    return {
      name: '田中 太郎',
      age: 25,
      background: '元カフェバイト、接客経験2年',
      personality: '真面目だがたまにうっかりミスをする',
      hourlyWage: 1200,
    };
  }
}

// --- Generate Game Event ---
export async function generateGameEvent(
  state: GameState,
): Promise<{ title: string; description: string; type: string; effect: { cash?: number; reputation?: number } }> {
  try {
    const prompt = `あなたは抹茶ラテ経営シミュレーションゲームのイベントジェネレーターです。

現在の状況:
- Week ${state.currentWeek}
- 資金: ¥${state.company.cash.toLocaleString()}
- 店舗数: ${state.stores.filter(s => s.isOpen).length}
- ブランド評判: ${state.company.brandReputation}/100

上記の状況に合った、リアルで面白い経営イベントを1つJSON形式で生成してください。
良いイベント（opportunity）と悪いイベント（crisis）の両方の可能性があります。

JSON形式で返してください:
{"title": "絵文字付きタイトル", "description": "説明（100文字以内）", "type": "opportunity|crisis|neutral", "effect": {"cash": 数値（任意）, "reputation": 数値（任意）}}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error('No JSON found');
  } catch {
    return {
      title: '📰 業界ニュース',
      description: '抹茶市場が安定して成長中。特に大きな変動はなし。',
      type: 'neutral',
      effect: {},
    };
  }
}

// --- Fallback Reviews ---
function getFallbackReviews(satisfaction: number) {
  if (satisfaction >= 70) {
    return [
      { customerName: '山田 花子', rating: 5, comment: '抹茶の味が本格的！毎日通いたい。' },
      { customerName: '鈴木 太郎', rating: 4, comment: 'オーツミルクラテが最高。少し高いけど価値あり。' },
    ];
  } else if (satisfaction >= 40) {
    return [
      { customerName: '佐藤 美咲', rating: 3, comment: 'まあまあかな。もう少し味に工夫が欲しい。' },
      { customerName: '田中 健', rating: 3, comment: '普通の抹茶ラテ。特別感は薄い。' },
    ];
  } else {
    return [
      { customerName: '高橋 一郎', rating: 2, comment: '高いわりに量が少ない。隣の店のほうがコスパ良い。' },
      { customerName: '伊藤 美月', rating: 1, comment: '待ち時間が長すぎる。もう来ない。' },
    ];
  }
}
