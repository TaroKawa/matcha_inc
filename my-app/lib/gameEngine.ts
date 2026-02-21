// ============================
// Matcha Inc. — Game Simulation Engine
// ============================

import {
  GameState,
  Store,
  Employee,
  GameEvent,
  WeeklyFinance,
  MenuItem,
  GamePhase,
} from '@/types/game';
import {
  EQUIPMENT_DATA,
  INTERIOR_DATA,
  EMPLOYEE_RESUMES,
  EMPLOYEE_HIDDEN_PERSONALITIES,
} from './gameData';

// --- Utility ---
function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

// --- Customer Satisfaction Calculation ---
export function calculateCustomerSatisfaction(store: Store, state: GameState): number {
  let satisfaction = 50; // base

  // Tea quality from supplier
  const supplier = state.suppliers.find(s => s.id === state.activeSupplier);
  if (supplier) {
    satisfaction += (supplier.quality - 50) * 0.3;
  }

  // Equipment quality
  const eqData = EQUIPMENT_DATA[store.setup.equipment];
  satisfaction += eqData.qualityBonus * 0.5;

  // Interior
  const intData = INTERIOR_DATA[store.setup.interiorTheme];
  satisfaction += intData.satisfactionBonus;

  // Amenities
  if (store.setup.hasWifi) satisfaction += 3;
  if (store.setup.hasBgm) satisfaction += 2;

  // Employee skill average (considering performance multiplier and sabotaging)
  const storeEmployees = state.employees.filter(e => e.assignedStoreId === store.id);
  if (storeEmployees.length > 0) {
    const activeEmployees = storeEmployees.filter(e => !e.isSabotaging);
    if (activeEmployees.length > 0) {
      const avgSkill = activeEmployees.reduce((sum, e) => sum + e.skill * e.performanceMultiplier, 0) / activeEmployees.length;
      const avgMotivation = activeEmployees.reduce((sum, e) => sum + e.motivation, 0) / activeEmployees.length;
      satisfaction += (avgSkill - 50) * 0.2;
      satisfaction += (avgMotivation - 50) * 0.15;
    } else {
      satisfaction -= 15; // all employees sabotaging
    }
    // Penalty for sabotaging employees
    const sabotagingCount = storeEmployees.filter(e => e.isSabotaging).length;
    if (sabotagingCount > 0) {
      satisfaction -= sabotagingCount * 5;
    }
  } else {
    satisfaction -= 20; // no employees = terrible service
  }

  // Menu variety bonus
  if (store.menu.length >= 3) satisfaction += 5;
  if (store.menu.length >= 6) satisfaction += 5;

  // Price perception (avg price vs quality)
  if (store.menu.length > 0) {
    const avgPrice = store.menu.reduce((sum, m) => sum + m.price, 0) / store.menu.length;
    if (avgPrice > 700) satisfaction -= 5;
    if (avgPrice > 900) satisfaction -= 10;
    if (avgPrice < 400) satisfaction += 5;
  }

  return clamp(Math.round(satisfaction), 0, 100);
}

// --- Weekly Customer Count ---
export function calculateWeeklyCustomers(store: Store, state: GameState): number {
  const property = state.properties.find(p => p.id === store.propertyId);
  if (!property) return 0;

  let baseCustomers = property.footTraffic * 3; // base from foot traffic

  // Satisfaction multiplier
  const satMultiplier = store.customerSatisfaction / 50; // 1.0 at 50 satisfaction
  baseCustomers *= satMultiplier;

  // Equipment speed bonus
  const eqData = EQUIPMENT_DATA[store.setup.equipment];
  const speedFactor = 1 + (eqData.speedPenalty / 100);
  baseCustomers *= speedFactor;

  // Seat capacity limit
  const maxDailyFromSeats = store.setup.seatCount * 4 * 7; // 4 turns per seat per day * 7 days
  baseCustomers = Math.min(baseCustomers, maxDailyFromSeats);

  // Employee capacity (each active employee can serve ~50 customers/week)
  const activeEmployees = state.employees.filter(e => e.assignedStoreId === store.id && !e.isSabotaging);
  const maxFromEmployees = activeEmployees.length * 50;
  if (activeEmployees.length > 0) {
    baseCustomers = Math.min(baseCustomers, maxFromEmployees);
  } else {
    baseCustomers = 0; // can't operate without active staff
  }

  // Marketing boost
  const activeCampaigns = state.campaigns.filter(c => c.isActive);
  for (const campaign of activeCampaigns) {
    baseCustomers *= campaign.effectiveness;
  }

  // Random variance ±15%
  const variance = 1 + (Math.random() * 0.3 - 0.15);
  baseCustomers *= variance;

  return Math.max(0, Math.round(baseCustomers));
}

// --- Weekly Revenue for a Store ---
export function calculateStoreRevenue(store: Store): number {
  if (store.menu.length === 0 || store.weeklyCustomers === 0) return 0;

  // Each customer buys 1 item randomly
  let revenue = 0;
  for (let i = 0; i < store.weeklyCustomers; i++) {
    const item = store.menu[Math.floor(Math.random() * store.menu.length)];
    revenue += item.price;
  }
  return revenue;
}

// --- Weekly Expenses for a Store ---
export function calculateStoreExpenses(store: Store, state: GameState): {
  rent: number;
  wages: number;
  supplies: number;
  total: number;
} {
  const property = state.properties.find(p => p.id === store.propertyId);
  const rent = property ? property.rent / 4 : 0; // monthly rent / 4 weeks

  const storeEmployees = state.employees.filter(e => e.assignedStoreId === store.id);
  const wages = storeEmployees.reduce((sum, e) => sum + e.hourlyWage * 40, 0); // 40 hours/week

  // Supply cost based on customers served
  let supplyCostPerCup = 100; // base
  const supplier = state.suppliers.find(s => s.id === state.activeSupplier);
  if (supplier) {
    supplyCostPerCup = supplier.costPerKg / 50; // ~50 cups per kg
  }
  // Add milk and topping costs
  const avgMenuCost = store.menu.length > 0
    ? store.menu.reduce((sum, m) => sum + m.cost, 0) / store.menu.length
    : 100;
  const supplies = store.weeklyCustomers * avgMenuCost;

  return {
    rent,
    wages,
    supplies,
    total: rent + wages + supplies,
  };
}

// --- Determine if employee is sabotaging this week ---
function checkEmployeeSabotage(emp: Employee): boolean {
  // Low motivation = higher chance of sabotaging
  if (emp.motivation <= 20) return Math.random() < 0.6;
  if (emp.motivation <= 40) return Math.random() < 0.3;
  if (emp.motivation <= 60) return Math.random() < 0.1;
  return false; // High motivation = no sabotage
}

// --- Calculate performance multiplier based on motivation ---
function calcPerformanceMultiplier(motivation: number): number {
  if (motivation >= 80) return 1.3;
  if (motivation >= 60) return 1.1;
  if (motivation >= 40) return 1.0;
  if (motivation >= 20) return 0.8;
  return 0.6;
}

// --- Advance Week ---
export function advanceWeek(state: GameState): GameState {
  const newState = { ...state };
  newState.currentWeek += 1;
  const week = newState.currentWeek;

  // Update game phase
  newState.gamePhase = getGamePhase(week);

  // Update employees first (sabotage check, performance)
  newState.employees = newState.employees.map(emp => {
    const updated = { ...emp };
    if (updated.assignedStoreId) {
      updated.weeksEmployed += 1;
      // Fatigue increases, motivation decreases slightly
      updated.fatigue = clamp(updated.fatigue + randomBetween(2, 8), 0, 100);
      updated.motivation = clamp(updated.motivation - randomBetween(1, 5), 0, 100);
      // Skill slowly improves
      updated.skill = clamp(updated.skill + randomBetween(0, 2), 0, 100);
      // Check sabotage
      updated.isSabotaging = checkEmployeeSabotage(updated);
      // Update performance multiplier
      updated.performanceMultiplier = calcPerformanceMultiplier(updated.motivation);
    } else {
      updated.isSabotaging = false;
      updated.performanceMultiplier = 1.0;
    }
    return updated;
  });

  // Update each store
  let totalRevenue = 0;
  let totalExpenses = 0;

  const updatedStores = newState.stores.map(store => {
    if (!store.isOpen) return store;

    const updatedStore = { ...store };

    // Calculate satisfaction
    updatedStore.customerSatisfaction = calculateCustomerSatisfaction(updatedStore, newState);

    // Calculate customers
    updatedStore.weeklyCustomers = calculateWeeklyCustomers(updatedStore, newState);

    // Calculate revenue
    updatedStore.weeklyRevenue = calculateStoreRevenue(updatedStore);

    // Calculate expenses
    const expenses = calculateStoreExpenses(updatedStore, newState);
    updatedStore.weeklyExpenses = expenses.total;

    totalRevenue += updatedStore.weeklyRevenue;
    totalExpenses += expenses.total;

    return updatedStore;
  });

  newState.stores = updatedStores;

  // Marketing expenses
  let marketingCost = 0;
  newState.campaigns = newState.campaigns.map(campaign => {
    if (!campaign.isActive) return campaign;
    const updated = { ...campaign };
    updated.remainingWeeks -= 1;
    if (updated.remainingWeeks <= 0) {
      updated.isActive = false;
    }
    marketingCost += campaign.cost / campaign.duration;
    return updated;
  });
  totalExpenses += marketingCost;

  // Loan payments
  let loanPayments = 0;
  newState.loans = newState.loans.map(loan => {
    const updated = { ...loan };
    updated.remainingWeeks -= 1;
    loanPayments += loan.weeklyPayment;
    return updated;
  }).filter(loan => loan.remainingWeeks > 0);
  totalExpenses += loanPayments;

  // Update company finances
  newState.company = {
    ...newState.company,
    weeklyRevenue: totalRevenue,
    weeklyExpenses: totalExpenses,
    totalRevenue: newState.company.totalRevenue + totalRevenue,
    totalExpenses: newState.company.totalExpenses + totalExpenses,
    cash: newState.company.cash + totalRevenue - totalExpenses,
  };

  // Update brand reputation based on avg satisfaction
  const openStores = newState.stores.filter(s => s.isOpen);
  if (openStores.length > 0) {
    const avgSatisfaction = openStores.reduce((sum, s) => sum + s.customerSatisfaction, 0) / openStores.length;
    const reputationDelta = (avgSatisfaction - 50) * 0.05;
    newState.company.brandReputation = clamp(
      newState.company.brandReputation + reputationDelta,
      0, 100
    );
  }

  // Generate events
  const newEvents = generateWeeklyEvents(newState);
  newState.events = [...newState.events, ...newEvents];
  newState.notifications = newEvents;

  // Add sabotage notifications
  const sabotagingEmps = newState.employees.filter(e => e.isSabotaging && e.assignedStoreId);
  for (const emp of sabotagingEmps) {
    const store = newState.stores.find(s => s.id === emp.assignedStoreId);
    newState.notifications.push({
      id: `sabotage-${week}-${emp.id}`,
      type: 'crisis',
      title: `😴 ${emp.name}がサボっています`,
      description: `${store?.name || ''}で${emp.name}がサボっているようです。声をかけてみましょう。`,
      week,
      resolved: false,
    });
  }

  // Apply event effects
  for (const event of newEvents) {
    if (event.effect) {
      if (event.effect.cash) {
        newState.company.cash += event.effect.cash;
      }
      if (event.effect.reputation) {
        newState.company.brandReputation = clamp(
          newState.company.brandReputation + event.effect.reputation, 0, 100
        );
      }
    }
  }

  // Record weekly finance
  const weeklyFinance: WeeklyFinance = {
    week,
    revenue: totalRevenue,
    expenses: totalExpenses,
    profit: totalRevenue - totalExpenses,
    breakdown: {
      storeRevenue: totalRevenue,
      rent: newState.stores.reduce((sum, s) => {
        const prop = newState.properties.find(p => p.id === s.propertyId);
        return sum + (prop ? prop.rent / 4 : 0);
      }, 0),
      wages: newState.employees.filter(e => e.assignedStoreId).reduce((sum, e) => sum + e.hourlyWage * 40, 0),
      supplies: newState.stores.reduce((sum, s) => {
        const supplier = newState.suppliers.find(sup => sup.id === newState.activeSupplier);
        const costPerCup = supplier ? supplier.costPerKg / 50 : 100;
        return sum + s.weeklyCustomers * costPerCup;
      }, 0),
      marketing: marketingCost,
      other: loanPayments,
    },
  };
  newState.weeklyFinances = [...newState.weeklyFinances, weeklyFinance];

  // Record history
  newState.weeklyHistory = [...newState.weeklyHistory, {
    week,
    cash: newState.company.cash,
    revenue: totalRevenue,
    expenses: totalExpenses,
    totalStores: newState.stores.filter(s => s.isOpen).length,
    totalEmployees: newState.employees.filter(e => e.assignedStoreId).length,
  }];

  // Check game over
  if (newState.company.cash < -1000000) {
    newState.gameOver = true;
    newState.gameOverReason = '資金がマイナス100万円を超えました。会社は破産しました...';
  }

  return newState;
}

// --- Game Phase ---
function getGamePhase(week: number): GamePhase {
  if (week <= 4) return 'prologue';
  if (week <= 20) return 'chapter1';
  if (week <= 40) return 'chapter2';
  if (week <= 60) return 'chapter3';
  return 'epilogue';
}

export const PHASE_NAMES: Record<GamePhase, string> = {
  prologue: '序章：夢の一杯',
  chapter1: '第1章：生存競争',
  chapter2: '第2章：拡大の誘惑',
  chapter3: '第3章：帝国か、破滅か',
  epilogue: '終章：抹茶の覇者',
};

// --- Random Events ---
function generateWeeklyEvents(state: GameState): GameEvent[] {
  const events: GameEvent[] = [];
  const week = state.currentWeek;

  // Random chance for events (30% per week)
  if (Math.random() > 0.3) return events;

  const possibleEvents = [
    {
      type: 'opportunity' as const,
      title: '🍵 抹茶ブーム到来！',
      description: 'SNSで抹茶ラテがバズり始めた！今週の来客数が20%増加。',
      effect: { reputation: 5 },
    },
    {
      type: 'crisis' as const,
      title: '⚠️ 食品衛生の噂...',
      description: '「〇〇の抹茶は品質が悪い」という噂がSNSで広がっている。評判が下がる恐れ。',
      effect: { reputation: -10 },
    },
    {
      type: 'opportunity' as const,
      title: '📺 テレビ取材の依頼！',
      description: '地元テレビ局から取材の依頼が！ブランド認知度がアップ。',
      effect: { reputation: 8 },
    },
    {
      type: 'neutral' as const,
      title: '🌧️ 梅雨入り',
      description: '長雨で客足が鈍る。しかしテイクアウト需要は変わらず。',
      effect: {},
    },
    {
      type: 'crisis' as const,
      title: '💸 茶葉の価格高騰',
      description: '不作の影響で茶葉の仕入れ価格が上昇。今週の仕入れコストが増加。',
      effect: { cash: -50000 },
    },
    {
      type: 'opportunity' as const,
      title: '🎌 外国人観光客の急増',
      description: '円安の影響で外国人観光客が増加。特に浅草エリアの来客が好調。',
      effect: { reputation: 3 },
    },
    {
      type: 'neutral' as const,
      title: '📱 SNSでバズった！',
      description: 'お客様の投稿が話題に。「ここの抹茶ラテが人生で一番美味しい」',
      effect: { reputation: 5 },
    },
    {
      type: 'crisis' as const,
      title: '🏗️ 近隣工事の影響',
      description: '店舗近くで大規模工事が開始。騒音で客足に影響が。',
      effect: { reputation: -3 },
    },
  ];

  // Pick a random event
  const selected = possibleEvents[Math.floor(Math.random() * possibleEvents.length)];
  events.push({
    id: `event-${week}-${generateId()}`,
    ...selected,
    week,
    resolved: false,
  });

  return events;
}

// --- Generate Random Employee (with new fields) ---
export function generateRandomEmployee(
  names: string[],
  backgrounds: string[],
  personalities: string[],
): Employee {
  return {
    id: `emp-${generateId()}`,
    name: names[Math.floor(Math.random() * names.length)],
    age: randomBetween(18, 55),
    background: backgrounds[Math.floor(Math.random() * backgrounds.length)],
    personality: personalities[Math.floor(Math.random() * personalities.length)],
    hiddenPersonality: EMPLOYEE_HIDDEN_PERSONALITIES[Math.floor(Math.random() * EMPLOYEE_HIDDEN_PERSONALITIES.length)],
    resume: EMPLOYEE_RESUMES[Math.floor(Math.random() * EMPLOYEE_RESUMES.length)],
    role: Math.random() > 0.8 ? 'manager' : 'barista',
    skill: randomBetween(20, 80),
    speed: randomBetween(30, 90),
    motivation: randomBetween(50, 90),
    fatigue: randomBetween(0, 20),
    hourlyWage: randomBetween(1000, 2000),
    assignedStoreId: null,
    weeksEmployed: 0,
    hiringStatus: 'new',
    interviewMotivationBonus: 0,
    interviewConversation: [],
    isSabotaging: false,
    performanceMultiplier: 1.0,
    talkHistory: [],
  };
}

// --- Calculate Menu Item Cost ---
export function calculateMenuItemCost(
  item: Pick<MenuItem, 'teaBase' | 'milkType' | 'topping'>,
  supplierCostPerKg: number,
): number {
  const teaCost = supplierCostPerKg / 50; // ~50 cups per kg
  const milkCost = { regular: 30, oat: 60, almond: 70, soy: 50 }[item.milkType];
  const toppingCost = { tapioca: 40, shiratama: 50, kinako: 20, kuromitsu: 25, none: 0 }[item.topping];
  return Math.round(teaCost + milkCost + toppingCost);
}

// --- Format Currency ---
export function formatMoney(amount: number): string {
  if (Math.abs(amount) >= 100000000) {
    return `¥${(amount / 100000000).toFixed(1)}億`;
  }
  if (Math.abs(amount) >= 10000) {
    return `¥${(amount / 10000).toFixed(0)}万`;
  }
  return `¥${amount.toLocaleString()}`;
}
