// ============================
// Matcha Inc. — Static Game Data
// ============================

import {
  Area,
  Property,
  TeaSupplier,
  Employee,
  TeaBase,
  MilkType,
} from '@/types/game';

// --- Areas ---
export const AREAS: Area[] = [
  {
    id: 'shibuya',
    name: '渋谷',
    description: '若者と観光客で賑わう流行の発信地。家賃は高いが集客力は抜群。',
    customerTypes: ['若者', '観光客', 'トレンド好き'],
    footTraffic: 90,
    rentMultiplier: 1.8,
    icon: '🏙️',
  },
  {
    id: 'marunouchi',
    name: '丸の内',
    description: 'ビジネスの中心地。高単価が見込めるが、家賃は最高クラス。',
    customerTypes: ['ビジネスパーソン', 'OL', '経営者'],
    footTraffic: 75,
    rentMultiplier: 2.2,
    icon: '🏢',
  },
  {
    id: 'shimokitazawa',
    name: '下北沢',
    description: 'サブカルと学生の街。家賃は手頃で、個性的な店が好まれる。',
    customerTypes: ['学生', 'アーティスト', 'サブカル好き'],
    footTraffic: 60,
    rentMultiplier: 1.0,
    icon: '🎸',
  },
  {
    id: 'asakusa',
    name: '浅草',
    description: '伝統と観光の街。和テイストが強みになる。家賃は比較的安い。',
    customerTypes: ['観光客', 'シニア', '外国人観光客'],
    footTraffic: 70,
    rentMultiplier: 0.8,
    icon: '⛩️',
  },
];

// --- Properties ---
export const INITIAL_PROPERTIES: Property[] = [
  // Shibuya
  {
    id: 'prop-shibuya-1',
    areaId: 'shibuya',
    name: '渋谷センター街 路面店',
    rent: 450000,
    size: 35,
    maxSeats: 20,
    footTraffic: 95,
    available: true,
  },
  {
    id: 'prop-shibuya-2',
    areaId: 'shibuya',
    name: '渋谷マークシティ B1F',
    rent: 350000,
    size: 25,
    maxSeats: 14,
    footTraffic: 80,
    available: true,
  },
  // Marunouchi
  {
    id: 'prop-marunouchi-1',
    areaId: 'marunouchi',
    name: '丸の内ビル 1F',
    rent: 600000,
    size: 40,
    maxSeats: 24,
    footTraffic: 85,
    available: true,
  },
  {
    id: 'prop-marunouchi-2',
    areaId: 'marunouchi',
    name: '大手町タワー B1F',
    rent: 480000,
    size: 30,
    maxSeats: 18,
    footTraffic: 70,
    available: true,
  },
  // Shimokitazawa
  {
    id: 'prop-shimokita-1',
    areaId: 'shimokitazawa',
    name: '下北沢南口 路面店',
    rent: 200000,
    size: 20,
    maxSeats: 12,
    footTraffic: 65,
    available: true,
  },
  {
    id: 'prop-shimokita-2',
    areaId: 'shimokitazawa',
    name: '下北沢一番街 2F',
    rent: 150000,
    size: 28,
    maxSeats: 16,
    footTraffic: 50,
    available: true,
  },
  // Asakusa
  {
    id: 'prop-asakusa-1',
    areaId: 'asakusa',
    name: '雷門通り 路面店',
    rent: 180000,
    size: 30,
    maxSeats: 18,
    footTraffic: 75,
    available: true,
  },
  {
    id: 'prop-asakusa-2',
    areaId: 'asakusa',
    name: '浅草寺裏 古民家',
    rent: 120000,
    size: 35,
    maxSeats: 20,
    footTraffic: 45,
    available: true,
  },
];

// --- Tea Suppliers ---
export const TEA_SUPPLIERS: TeaSupplier[] = [
  {
    id: 'sup-uji-ceremonial',
    origin: 'uji',
    grade: 'ceremonial',
    name: '宇治 丸久小山園（セレモニアル）',
    costPerKg: 15000,
    quality: 98,
    reliability: 95,
    contracted: false,
  },
  {
    id: 'sup-uji-premium',
    origin: 'uji',
    grade: 'premium',
    name: '宇治 伊藤久右衛門（プレミアム）',
    costPerKg: 8000,
    quality: 85,
    reliability: 90,
    contracted: false,
  },
  {
    id: 'sup-shizuoka-premium',
    origin: 'shizuoka',
    grade: 'premium',
    name: '静岡 深蒸し茶園（プレミアム）',
    costPerKg: 6000,
    quality: 75,
    reliability: 95,
    contracted: false,
  },
  {
    id: 'sup-shizuoka-culinary',
    origin: 'shizuoka',
    grade: 'culinary',
    name: '静岡 大量仕入れ（クリナリー）',
    costPerKg: 3000,
    quality: 55,
    reliability: 98,
    contracted: false,
  },
  {
    id: 'sup-yame-premium',
    origin: 'yame',
    grade: 'premium',
    name: '八女 星野製茶園（プレミアム）',
    costPerKg: 9000,
    quality: 88,
    reliability: 85,
    contracted: false,
  },
  {
    id: 'sup-kagoshima-culinary',
    origin: 'kagoshima',
    grade: 'culinary',
    name: '鹿児島 知覧茶（クリナリー）',
    costPerKg: 2500,
    quality: 50,
    reliability: 92,
    contracted: false,
  },
  {
    id: 'sup-overseas',
    origin: 'overseas',
    grade: 'culinary',
    name: '中国 浙江省（輸入クリナリー）',
    costPerKg: 1500,
    quality: 35,
    reliability: 80,
    contracted: false,
  },
];

// --- Equipment Costs & Stats ---
export const EQUIPMENT_DATA = {
  'chasen': {
    name: '茶筅（手点て）',
    description: '伝統的な茶筅で一杯ずつ丁寧に。最高品質だが提供に時間がかかる。',
    cost: 50000,
    qualityBonus: 25,
    speedPenalty: -30,
    icon: '🍵',
  },
  'electric': {
    name: '電動マドラー',
    description: 'バランスの良い電動式。品質と速度の両立。',
    cost: 150000,
    qualityBonus: 10,
    speedPenalty: 0,
    icon: '⚡',
  },
  'auto-machine': {
    name: '全自動マシン',
    description: '最速の全自動マシン。回転率は最高だが味は平凡。',
    cost: 500000,
    qualityBonus: -5,
    speedPenalty: 30,
    icon: '🤖',
  },
};

export const INTERIOR_DATA = {
  'wa-modern': {
    name: '和モダン',
    description: '木と畳を活かした和モダン空間。浅草や外国人客に好評。',
    cost: 800000,
    satisfactionBonus: 15,
    icon: '🏯',
  },
  'cafe': {
    name: 'カフェ風',
    description: '温かみのあるカフェスタイル。万人受けする安心感。',
    cost: 500000,
    satisfactionBonus: 10,
    icon: '☕',
  },
  'minimal': {
    name: 'ミニマル',
    description: 'シンプルで洗練された空間。コストを抑えつつスタイリッシュ。',
    cost: 300000,
    satisfactionBonus: 5,
    icon: '◻️',
  },
};

// --- Tea Base Names ---
export const TEA_BASE_NAMES: Record<TeaBase, string> = {
  'matcha': '抹茶',
  'hojicha': 'ほうじ茶',
  'genmai': '玄米茶',
  'wa-koucha': '和紅茶',
  'earl-grey': 'アールグレイ',
  'chai': 'チャイ',
};

export const MILK_NAMES: Record<MilkType, string> = {
  'regular': '通常ミルク',
  'oat': 'オーツミルク',
  'almond': 'アーモンドミルク',
  'soy': 'ソイミルク',
};

export const MILK_COSTS: Record<MilkType, number> = {
  'regular': 30,
  'oat': 60,
  'almond': 70,
  'soy': 50,
};

export const TOPPING_NAMES: Record<string, string> = {
  'tapioca': 'タピオカ',
  'shiratama': '白玉',
  'kinako': 'きなこ',
  'kuromitsu': '黒蜜',
  'none': 'なし',
};

export const TOPPING_COSTS: Record<string, number> = {
  'tapioca': 40,
  'shiratama': 50,
  'kinako': 20,
  'kuromitsu': 25,
  'none': 0,
};

export const SWEETNESS_NAMES: Record<string, string> = {
  'none': '無糖',
  'light': '控えめ',
  'normal': '普通',
  'extra': '多め',
};

// --- Marketing Channels ---
export const MARKETING_CHANNELS = {
  'flyer': {
    name: 'チラシ配布',
    description: '周辺エリアにチラシを配布。低コストだが効果は限定的。',
    weeklyCost: 30000,
    duration: 4,
    effectiveness: 1.1,
    icon: '📄',
  },
  'sns': {
    name: 'SNS広告',
    description: 'Instagram・TikTokに広告掲載。若者層に効果的。',
    weeklyCost: 80000,
    duration: 4,
    effectiveness: 1.3,
    icon: '📱',
  },
  'influencer': {
    name: 'インフルエンサー起用',
    description: 'フード系インフルエンサーにPR依頼。高い拡散力。',
    weeklyCost: 200000,
    duration: 2,
    effectiveness: 1.6,
    icon: '🌟',
  },
  'tv': {
    name: 'テレビCM',
    description: '地上波CM。圧倒的なリーチだが超高コスト。',
    weeklyCost: 1000000,
    duration: 4,
    effectiveness: 2.0,
    icon: '📺',
  },
  'billboard': {
    name: 'ビルボード広告',
    description: '駅前の大型看板。ブランド認知度向上。',
    weeklyCost: 300000,
    duration: 8,
    effectiveness: 1.4,
    icon: '🪧',
  },
};

// --- Logo Options ---
export const LOGO_OPTIONS = [
  { index: 0, emoji: '🍵', name: '茶碗' },
  { index: 1, emoji: '🌿', name: '茶葉' },
  { index: 2, emoji: '🎋', name: '竹' },
  { index: 3, emoji: '🏯', name: '城' },
  { index: 4, emoji: '☯️', name: '陰陽' },
  { index: 5, emoji: '🐉', name: '龍' },
];

// --- Difficulty Presets ---
export const DIFFICULTY_PRESETS = [
  {
    capital: 5000000,
    label: '💰 500万円（ハード）',
    description: '物件も茶葉も妥協が必要。真の経営者への挑戦。',
    difficulty: 'hard' as const,
  },
  {
    capital: 10000000,
    label: '💰 1,000万円（ノーマル）',
    description: 'バランスの取れたスタート。堅実な経営が求められる。',
    difficulty: 'normal' as const,
  },
  {
    capital: 20000000,
    label: '💰 2,000万円（イージー）',
    description: '余裕を持って始められる。初心者におすすめ。',
    difficulty: 'easy' as const,
  },
];


// --- Sample Employee Names ---
export const EMPLOYEE_NAMES = [
  '鈴木 花', '田中 健', '佐藤 美月', '山田 太郎', '高橋 あゆみ',
  '伊藤 翔', '渡辺 さくら', '中村 大輔', '小林 琴美', '加藤 雄介',
  '吉田 真央', '山本 拓海', '松本 ひなた', '井上 慶太', '木村 杏',
  '林 健太郎', '清水 由衣', '山口 蓮', '森 咲良', '池田 航',
];

export const EMPLOYEE_BACKGROUNDS = [
  '元コンビニ店員', '元カフェバイト', '元居酒屋店長', '元IT企業OL',
  '茶道部出身の大学生', '元バリスタ（スタバ3年）', 'フリーター',
  '元料理人', '主婦（復職）', '留学帰りの大学院生',
  '元アパレル店員', '元ホテルマン', '元保育士', '飲食業界10年のベテラン',
];

export const EMPLOYEE_PERSONALITIES = [
  '真面目だが要領が悪い', 'スキル高いがプライドも高い', '明るいが遅刻癖がある',
  '寡黙だが仕事は正確', '接客上手だがサボり癖あり', 'やる気満々だが空回りしがち',
  '安定感抜群のベテラン', 'コミュ力お化けだが雑', '完璧主義で周りと衝突しがち',
  'マイペースだが仕事は丁寧',
];

export const EMPLOYEE_RESUMES = [
  'カフェでの経験を活かし、お客様に最高の一杯を提供したいです。ラテアートも練習中です。',
  '体力には自信があります！どんなに忙しくても笑顔で頑張ります。よろしくお願いします！',
  '以前は居酒屋で働いていました。大きな声での挨拶が得意です。抹茶については勉強中です。',
  '静かな環境で黙々と作業するのが好きです。接客は少し苦手ですが、ドリンク作りは完璧を目指します。',
  '将来自分のお店を持ちたいので、経営のノウハウを学びたいです。給料分以上は働きます。',
  '（履歴書が汚れている）えっと、やる気はあります。たぶん。シフトはいっぱい入れてください。',
  '自分、マジで抹茶好きなんで。最強の抹茶ラテ作れる自信しかないっす。採用しないと損っすよ。',
  '特にやりたいことはないですが、家から近いので応募しました。なるべく楽な仕事がいいです。',
  '前職では店長を任されていました。売上管理からスタッフ教育まで一通りできます。即戦力になれます。',
  '抹茶の魅力を世界に広めたいという貴社のビジョンに共感しました。英語での接客も可能です。',
  '質問１：志望動機は？　回答：お金が必要だからです。　質問２：長所は？　回答：寝ないでゲームできます。',
  '（白紙に近い）...よろしくお願いします。',
];

export const EMPLOYEE_HIDDEN_PERSONALITIES = [
  '褒められると伸びるが、叱られるとすぐに辞めたくなるタイプ。',
  '一見真面目だが、見ていないところで手を抜くのが上手い。',
  'プレッシャーに弱く、忙しくなるとミスを連発する。優しくフォローが必要。',
  'プライドが高く、年下からの指示には従わない傾向がある。',
  '単純作業は得意だが、臨機応変な対応が苦手。パニックになりやすい。',
  '実は非常に優秀だが、自分に自信がなくアピールが下手なだけ。',
  '給料分しか働かない主義。残業は絶対にお断り。',
  'チームのムードメーカーになれるが、お喋りに夢中で手が止まることも。',
  '上昇志向が強く、いずれ独立してライバル店を出すつもりでいる。',
  'メンタルが鋼のように強く、どんなクレームも笑顔で受け流せる。',
  '注意されると逆ギレするタイプ。扱いが非常に難しい。',
  '指示待ち人間。言われたこと以外は絶対にやらない。',
];
