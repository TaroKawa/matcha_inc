// ============================
// Matcha Inc. — Zustand Game Store
// ============================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  GameState,
  Company,
  Store,
  Employee,
  MenuItem,
  StoreSetup,
  MarketingCampaign,
  MarketingChannel,
  Loan,
  Review,
} from '@/types/game';
import {
  INITIAL_PROPERTIES,
  TEA_SUPPLIERS,
  INITIAL_RIVALS,
  EMPLOYEE_NAMES,
  EMPLOYEE_BACKGROUNDS,
  EMPLOYEE_PERSONALITIES,
  MARKETING_CHANNELS,
  EQUIPMENT_DATA,
  INTERIOR_DATA,
} from '@/lib/gameData';
import { advanceWeek, generateRandomEmployee } from '@/lib/gameEngine';

interface GameActions {
  // Init
  initGame: (company: Pick<Company, 'name' | 'presidentName' | 'logoIndex' | 'initialCapital'>) => void;
  resetGame: () => void;
  loadGame: () => boolean;

  // Week progression
  nextWeek: () => void;

  // Store management
  openStore: (propertyId: string, name: string, setup: StoreSetup, menu: MenuItem[]) => void;
  updateStoreMenu: (storeId: string, menu: MenuItem[]) => void;
  addReviewsToStore: (storeId: string, reviews: Review[]) => void;

  // Employee management
  generateApplicants: (count: number) => void;
  hireEmployee: (employeeId: string) => void;
  fireEmployee: (employeeId: string) => void;
  assignEmployee: (employeeId: string, storeId: string | null) => void;

  // Supply chain
  contractSupplier: (supplierId: string) => void;

  // Marketing
  startCampaign: (channel: MarketingChannel) => void;

  // Finance
  takeLoan: (amount: number, interestRate: number, weeks: number) => void;
}

const initialState: GameState = {
  initialized: false,
  currentWeek: 0,
  gamePhase: 'prologue',
  gameOver: false,
  company: {
    name: '',
    presidentName: '',
    logoIndex: 0,
    initialCapital: 0,
    cash: 0,
    brandReputation: 50,
    weeklyRevenue: 0,
    weeklyExpenses: 0,
    totalRevenue: 0,
    totalExpenses: 0,
  },
  stores: [],
  properties: [],
  employees: [],
  applicants: [],
  rivals: [],
  events: [],
  notifications: [],
  campaigns: [],
  suppliers: [],
  activeSupplier: null,
  weeklyFinances: [],
  loans: [],
  weeklyHistory: [],
};

export const useGameStore = create<GameState & GameActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      initGame: (company) => {
        const rivals = INITIAL_RIVALS.map((r, i) => ({
          ...r,
          id: `rival-${i}`,
        }));

        // Generate initial applicants
        const applicants = Array.from({ length: 5 }, () =>
          generateRandomEmployee(EMPLOYEE_NAMES, EMPLOYEE_BACKGROUNDS, EMPLOYEE_PERSONALITIES)
        );

        set({
          initialized: true,
          currentWeek: 1,
          gamePhase: 'prologue',
          gameOver: false,
          company: {
            ...company,
            cash: company.initialCapital,
            brandReputation: 50,
            weeklyRevenue: 0,
            weeklyExpenses: 0,
            totalRevenue: 0,
            totalExpenses: 0,
          },
          stores: [],
          properties: [...INITIAL_PROPERTIES],
          employees: [],
          applicants,
          rivals,
          events: [{
            id: 'event-start',
            type: 'neutral',
            title: '🍵 あなたの抹茶帝国が始まる',
            description: `${company.name}が設立されました。まずは物件を見つけて、最初の1店舗をオープンしましょう！`,
            week: 1,
            resolved: false,
          }],
          notifications: [{
            id: 'event-start',
            type: 'neutral',
            title: '🍵 あなたの抹茶帝国が始まる',
            description: `${company.name}が設立されました。まずは物件を見つけて、最初の1店舗をオープンしましょう！`,
            week: 1,
            resolved: false,
          }],
          campaigns: [],
          suppliers: TEA_SUPPLIERS.map(s => ({ ...s })),
          activeSupplier: null,
          weeklyFinances: [],
          loans: [],
          weeklyHistory: [{
            week: 1,
            cash: company.initialCapital,
            revenue: 0,
            expenses: 0,
            totalStores: 0,
            totalEmployees: 0,
          }],
        });
      },

      resetGame: () => {
        set(initialState);
      },

      loadGame: () => {
        return get().initialized;
      },

      nextWeek: () => {
        const state = get();
        const newState = advanceWeek(state);
        set(newState);
      },

      openStore: (propertyId, name, setup, menu) => {
        const state = get();
        const property = state.properties.find(p => p.id === propertyId);
        if (!property) return;

        // Calculate setup costs
        const eqCost = EQUIPMENT_DATA[setup.equipment]?.cost || 0;
        const intCost = INTERIOR_DATA[setup.interiorTheme]?.cost || 0;
        const totalSetupCost = eqCost + intCost;

        const newStore: Store = {
          id: `store-${Date.now()}`,
          name,
          propertyId,
          areaId: property.areaId,
          setup,
          menu,
          employees: [],
          weeklyCustomers: 0,
          weeklyRevenue: 0,
          weeklyExpenses: 0,
          customerSatisfaction: 50,
          reviews: [],
          isOpen: true,
          openedWeek: state.currentWeek,
        };

        set({
          stores: [...state.stores, newStore],
          properties: state.properties.map(p =>
            p.id === propertyId ? { ...p, available: false } : p
          ),
          company: {
            ...state.company,
            cash: state.company.cash - totalSetupCost,
          },
        });
      },

      updateStoreMenu: (storeId, menu) => {
        set({
          stores: get().stores.map(s =>
            s.id === storeId ? { ...s, menu } : s
          ),
        });
      },

      addReviewsToStore: (storeId, reviews) => {
        set({
          stores: get().stores.map(s =>
            s.id === storeId ? { ...s, reviews: [...s.reviews, ...reviews] } : s
          ),
        });
      },

      generateApplicants: (count) => {
        const newApplicants = Array.from({ length: count }, () =>
          generateRandomEmployee(EMPLOYEE_NAMES, EMPLOYEE_BACKGROUNDS, EMPLOYEE_PERSONALITIES)
        );
        set({
          applicants: [...get().applicants, ...newApplicants],
        });
      },

      hireEmployee: (employeeId) => {
        const state = get();
        const applicant = state.applicants.find(a => a.id === employeeId);
        if (!applicant) return;
        set({
          employees: [...state.employees, applicant],
          applicants: state.applicants.filter(a => a.id !== employeeId),
        });
      },

      fireEmployee: (employeeId) => {
        set({
          employees: get().employees.filter(e => e.id !== employeeId),
        });
      },

      assignEmployee: (employeeId, storeId) => {
        set({
          employees: get().employees.map(e =>
            e.id === employeeId ? { ...e, assignedStoreId: storeId } : e
          ),
        });
      },

      contractSupplier: (supplierId) => {
        set({
          suppliers: get().suppliers.map(s => ({
            ...s,
            contracted: s.id === supplierId,
          })),
          activeSupplier: supplierId,
        });
      },

      startCampaign: (channel) => {
        const state = get();
        const channelData = MARKETING_CHANNELS[channel];
        const totalCost = channelData.weeklyCost * channelData.duration;

        if (state.company.cash < totalCost) return;

        const campaign: MarketingCampaign = {
          id: `campaign-${Date.now()}`,
          channel,
          cost: totalCost,
          duration: channelData.duration,
          remainingWeeks: channelData.duration,
          effectiveness: channelData.effectiveness,
          isActive: true,
        };

        set({
          campaigns: [...state.campaigns, campaign],
          company: {
            ...state.company,
            cash: state.company.cash - totalCost,
          },
        });
      },

      takeLoan: (amount, interestRate, weeks) => {
        const state = get();
        const totalRepayment = amount * (1 + interestRate);
        const weeklyPayment = totalRepayment / weeks;

        const loan: Loan = {
          id: `loan-${Date.now()}`,
          amount,
          interestRate,
          remainingWeeks: weeks,
          weeklyPayment,
        };

        set({
          loans: [...state.loans, loan],
          company: {
            ...state.company,
            cash: state.company.cash + amount,
          },
        });
      },
    }),
    {
      name: 'matcha-inc-save',
    }
  )
);
