// ============================
// Matcha Inc. — Game Type Definitions
// ============================

// --- Company ---
export interface Company {
  name: string;
  presidentName: string;
  logoIndex: number;
  initialCapital: number;
  cash: number;
  brandReputation: number; // 0-100
  weeklyRevenue: number;
  weeklyExpenses: number;
  totalRevenue: number;
  totalExpenses: number;
}

// --- Store ---
export type AreaId = 'shibuya' | 'marunouchi' | 'shimokitazawa' | 'asakusa';

export interface Area {
  id: AreaId;
  name: string;
  description: string;
  customerTypes: string[];
  footTraffic: number; // 1-100
  rentMultiplier: number;
  icon: string;
}

export interface Property {
  id: string;
  areaId: AreaId;
  name: string;
  rent: number; // monthly
  size: number; // sqm
  maxSeats: number;
  footTraffic: number;
  available: boolean;
}

export type InteriorTheme = 'wa-modern' | 'cafe' | 'minimal';
export type EquipmentType = 'chasen' | 'electric' | 'auto-machine';
export type TeaBase = 'matcha' | 'hojicha' | 'genmai' | 'wa-koucha' | 'earl-grey' | 'chai';
export type MilkType = 'regular' | 'oat' | 'almond' | 'soy';
export type ToppingType = 'tapioca' | 'shiratama' | 'kinako' | 'kuromitsu' | 'none';
export type SweetnessLevel = 'none' | 'light' | 'normal' | 'extra';

export interface MenuItem {
  id: string;
  name: string;
  teaBase: TeaBase;
  milkType: MilkType;
  topping: ToppingType;
  sweetness: SweetnessLevel;
  price: number;
  cost: number; // cost to make
  popularity: number; // 0-100, calculated
}

export interface StoreSetup {
  interiorTheme: InteriorTheme;
  equipment: EquipmentType;
  hasWifi: boolean;
  hasBgm: boolean;
  seatCount: number;
}

export interface Store {
  id: string;
  name: string;
  propertyId: string;
  areaId: AreaId;
  setup: StoreSetup;
  menu: MenuItem[];
  employees: string[]; // employee IDs
  weeklyCustomers: number;
  weeklyRevenue: number;
  weeklyExpenses: number;
  customerSatisfaction: number; // 0-100
  reviews: Review[];
  isOpen: boolean;
  openedWeek: number;
}

// --- Employees ---
export type EmployeeRole = 'barista' | 'manager';
export type HiringStatus = 'new' | 'resume_viewed' | 'interviewing' | 'interviewed' | 'hired' | 'rejected';

export interface ConversationMessage {
  role: 'player' | 'employee';
  content: string;
}

export interface Employee {
  id: string;
  name: string;
  age: number;
  background: string;
  personality: string; // 表面的な性格（表示用）
  hiddenPersonality: string; // Gemini生成の隠しパーソナリティ（プレイヤーには非表示）
  resume: string; // Gemini生成の履歴書（今後の活躍ぶりのヒント含む）
  role: EmployeeRole;
  skill: number; // 1-100
  speed: number; // 1-100
  motivation: number; // 0-100
  fatigue: number; // 0-100
  hourlyWage: number;
  assignedStoreId: string | null;
  weeksEmployed: number;
  // 採用フロー
  hiringStatus: HiringStatus;
  interviewMotivationBonus: number; // 面接でのやり取りによるモチベーション補正
  interviewConversation: ConversationMessage[]; // 面接の会話履歴
  // 雇用後
  isSabotaging: boolean; // サボり中かどうか
  performanceMultiplier: number; // パフォーマンス倍率（やる気に基づく）
  talkHistory: ConversationMessage[]; // 声かけの会話履歴
}

// --- Reviews ---
export interface Review {
  id: string;
  storeId: string;
  customerName: string;
  rating: number; // 1-5
  comment: string;
  week: number;
}

// --- Events ---
export type EventType = 'opportunity' | 'crisis' | 'neutral';

export interface GameEvent {
  id: string;
  type: EventType;
  title: string;
  description: string;
  week: number;
  resolved: boolean;
  effect?: {
    cash?: number;
    reputation?: number;
    customerSatisfaction?: number;
  };
}

// --- Marketing ---
export type MarketingChannel = 'flyer' | 'sns' | 'influencer' | 'tv' | 'billboard';

export interface MarketingCampaign {
  id: string;
  channel: MarketingChannel;
  cost: number;
  duration: number; // weeks
  remainingWeeks: number;
  effectiveness: number; // multiplier
  isActive: boolean;
}

// --- Supply Chain ---
export type TeaOrigin = 'uji' | 'shizuoka' | 'yame' | 'kagoshima' | 'overseas';
export type TeaGrade = 'ceremonial' | 'premium' | 'culinary';

export interface TeaSupplier {
  id: string;
  origin: TeaOrigin;
  grade: TeaGrade;
  name: string;
  costPerKg: number;
  quality: number; // 1-100
  reliability: number; // 1-100
  contracted: boolean;
}

// --- Finance ---
export interface WeeklyFinance {
  week: number;
  revenue: number;
  expenses: number;
  profit: number;
  breakdown: {
    storeRevenue: number;
    rent: number;
    wages: number;
    supplies: number;
    marketing: number;
    other: number;
  };
}

export interface Loan {
  id: string;
  amount: number;
  interestRate: number;
  remainingWeeks: number;
  weeklyPayment: number;
}

// --- Game State ---
export type GamePhase = 'prologue' | 'chapter1' | 'chapter2' | 'chapter3' | 'epilogue';

export interface GameState {
  // Meta
  initialized: boolean;
  currentWeek: number;
  gamePhase: GamePhase;
  gameOver: boolean;
  gameOverReason?: string;

  // Company
  company: Company;

  // Stores
  stores: Store[];
  properties: Property[];

  // People
  employees: Employee[];
  applicants: Employee[]; // available to hire

  // Events
  events: GameEvent[];
  notifications: GameEvent[];

  // Marketing
  campaigns: MarketingCampaign[];

  // Supply
  suppliers: TeaSupplier[];
  activeSupplier: string | null; // supplier ID

  // Finance
  weeklyFinances: WeeklyFinance[];
  loans: Loan[];

  // History
  weeklyHistory: {
    week: number;
    cash: number;
    revenue: number;
    expenses: number;
    totalStores: number;
    totalEmployees: number;
  }[];
}
