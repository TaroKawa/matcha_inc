// ============================
// Matcha Inc. — Gemini API Integration
// ============================

import { GoogleGenerativeAI } from '@google/generative-ai';
import { Store, Employee, GameState, ConversationMessage } from '@/types/game';

const API_KEY = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });

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

// --- Generate Full Applicant Profile (with hidden personality & resume) ---
export async function generateFullApplicantProfile(existingNames: string[] = []): Promise<{
  name: string;
  age: number;
  background: string;
  personality: string;
  hiddenPersonality: string;
  resume: string;
  role: 'barista' | 'manager';
  skill: number;
  speed: number;
  motivation: number;
  hourlyWage: number;
}> {
  try {
    const prompt = `あなたは抹茶ラテ専門店の求人に応募してきた人物を生成するAIです。
リアルな日本人の応募者プロフィールを1件生成してください。
多様性を重視し、優秀な人材だけでなく、問題を抱えた人材や変わった人材も一定確率で混ぜてください。

既存の名前リスト（これらは絶対に使わないでください）:
${existingNames.join(', ')}

重要なルール:
1. "name": 日本人のフルネーム。既存の名前リストと重複しないユニークな名前にしてください。
2. "hiddenPersonality": プレイヤーには見えない内面性格。どういう対応で伸びるか/潰れるか、サボり癖や問題行動の傾向などを含めてください。「優秀だが協調性皆無」「自信過剰で指示を聞かない」「メンタルが弱すぎてすぐ辞める」「実はスパイ」など、バリエーション豊かにしてください。
3. "resume": 履歴書内容。150文字程度。
   - まともな履歴書だけでなく、以下のような「やばい」履歴書も20%程度の確率で混ぜてください：
     - 質問に対して答えになっていない
     - 自分語りが激しい / ポエム調
     - 「修行させてください」など熱意が空回りしている
     - 誤字脱字が多い / タメ口
     - 具体性が全くない
   - 逆に、非常に優秀だが時給が高いパターンもありです。
4. "personality": 表面的な性格（20文字以内）。
5. skill, speed, motivation: 隠しパーソナリティと矛盾しないように。
   - やばい人は能力が極端に低いか、逆に能力だけは高い（扱いにくい）など。

JSON形式で返してください。余計なテキストは不要:
{"name": "姓 名", "age": 18-65の数字, "background": "経歴（50文字以内）", "personality": "表面的な性格（20文字以内）", "hiddenPersonality": "隠しパーソナリティ（80文字以内）", "resume": "履歴書内容（150文字程度）", "role": "barista or manager", "skill": 10-90の数字, "speed": 10-90の数字, "motivation": 10-90の数字, "hourlyWage": 900-3000の数字}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        name: parsed.name || '田中 太郎',
        age: parsed.age || 25,
        background: parsed.background || '元カフェバイト',
        personality: parsed.personality || '明るく真面目',
        hiddenPersonality: parsed.hiddenPersonality || '褒められると伸びるが、怒られると萎縮する',
        resume: parsed.resume || '前職ではカフェで2年間働き、接客の基礎を学びました。',
        role: parsed.role === 'manager' ? 'manager' : 'barista',
        skill: Math.min(80, Math.max(20, parsed.skill || 50)),
        speed: Math.min(90, Math.max(30, parsed.speed || 60)),
        motivation: Math.min(90, Math.max(50, parsed.motivation || 70)),
        hourlyWage: Math.min(2000, Math.max(1000, parsed.hourlyWage || 1200)),
      };
    }
    throw new Error('No JSON found');
  } catch (error) {
    console.error('Gemini applicant generation failed:', error);
    return {
      name: '田中 太郎',
      age: 25,
      background: '元カフェバイト、接客経験2年',
      personality: '真面目だがマイペース',
      hiddenPersonality: '褒められると素直に伸びるタイプ。厳しく叱られると萎縮して逆効果になる。',
      resume: '前職では大手カフェチェーンで2年間バリスタとして勤務。ラテアートの技術を独学で学び、お客様から好評をいただいていました。趣味はカフェ巡りと写真撮影。「いつかは自分の理想のドリンクを作りたい」が口癖です。休日はよく寝ていますが、好きなことには集中力を発揮します。',
      role: 'barista',
      skill: 50,
      speed: 60,
      motivation: 70,
      hourlyWage: 1200,
    };
  }
}

// --- Conduct Interview (AI responds as applicant) ---
export async function conductInterview(
  employee: Employee,
  playerMessage: string,
  conversationHistory: ConversationMessage[],
): Promise<{
  response: string;
  motivationDelta: number;
}> {
  try {
    const historyText = conversationHistory.map(m =>
      `${m.role === 'player' ? '面接官' : employee.name}: ${m.content}`
    ).join('\n');

    const prompt = `あなたは抹茶ラテ専門店の面接を受けている応募者「${employee.name}」です。
以下のキャラクター設定に従って、面接官の質問に答えてください。

【キャラクター設定】
- 名前: ${employee.name}（${employee.age}歳）
- 経歴: ${employee.background}
- 表面的な性格: ${employee.personality}
- 内面の性格（面接の受け答えに反映）: ${employee.hiddenPersonality}
- 希望時給: ¥${employee.hourlyWage}
- 志望動機のヒント: ${employee.resume}

【重要なルール】
1. キャラクターの内面性格を反映した受け答えをしてください
2. 表面的には分からないが、よく聞くと性格が見え隠れするような応答をしてください
3. 面接官が圧迫的/威圧的な態度なら、内面性格によっては萎縮したり反発したりしてください
4. 面接官が丁寧/優しい態度なら、内面性格によっては打ち解けたり調子に乗ったりしてください
5. 回答は100文字以内で、自然な口語体でお願いします
6. "motivationDelta"は面接官の態度による入社後のやる気変化です（-15〜+15）。面接官の態度がこの人の性格に合っていれば+、合っていなければ-で返してください

これまでの会話:
${historyText}

面接官: ${playerMessage}

JSON形式で返してください:
{"response": "応答テキスト", "motivationDelta": 数値}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        response: parsed.response || 'はい、よろしくお願いします。',
        motivationDelta: Math.min(15, Math.max(-15, parsed.motivationDelta || 0)),
      };
    }
    throw new Error('No JSON found');
  } catch (error) {
    console.error('Gemini interview failed:', error);
    return {
      response: 'はい、精一杯頑張りたいと思います。よろしくお願いします。',
      motivationDelta: 0,
    };
  }
}

// --- Talk to Employee (post-hire interaction) ---
export async function talkToEmployee(
  employee: Employee,
  playerMessage: string,
  context: {
    storeName: string;
    isSabotaging: boolean;
    motivation: number;
    fatigue: number;
    weeksEmployed: number;
  },
): Promise<{
  response: string;
  motivationDelta: number;
}> {
  try {
    const statusText = context.isSabotaging
      ? 'サボっている最中に声をかけられた'
      : context.fatigue > 70
      ? '疲れが溜まっている状態'
      : context.motivation < 40
      ? 'やる気が低下している状態'
      : '通常の勤務中';

    const prompt = `あなたは抹茶ラテ専門店「${context.storeName}」で働く従業員「${employee.name}」です。
社長から声をかけられました。以下の設定に従って返答してください。

【キャラクター設定】
- 名前: ${employee.name}（${employee.age}歳）
- 経歴: ${employee.background}
- 内面の性格: ${employee.hiddenPersonality}
- 現在のやる気: ${context.motivation}/100
- 現在の疲労度: ${context.fatigue}/100
- 勤続: ${context.weeksEmployed}週
- 現在の状態: ${statusText}

【重要なルール】
1. 現在の状態と内面性格を考慮した返答をしてください
2. サボっている時に厳しく叱られたら、内面性格次第で反省するか反発するかが変わります
3. 優しく声をかけられたら、内面性格次第でやる気が出るか甘えるかが変わります
4. 「頑張ってるね」「大丈夫？」のような声かけと「サボるな！」「何やってるんだ！」のような声かけで反応を変えてください
5. 回答は80文字以内で、自然な口語体で
6. "motivationDelta"はこの声かけによるやる気の変化です（-20〜+20）

社長の発言: ${playerMessage}

JSON形式で返してください:
{"response": "返答テキスト", "motivationDelta": 数値}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        response: parsed.response || 'はい、ありがとうございます。',
        motivationDelta: Math.min(20, Math.max(-20, parsed.motivationDelta || 0)),
      };
    }
    throw new Error('No JSON found');
  } catch (error) {
    console.error('Gemini talk failed:', error);
    return {
      response: 'は、はい...わかりました。',
      motivationDelta: 0,
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
