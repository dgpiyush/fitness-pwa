import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very-active';
export type Gender = 'male' | 'female';

export interface UserProfile {
  name: string;
  gender: Gender;
  weight: number; // kg
  height: number; // cm
  age: number;
  activityLevel: ActivityLevel;
}

export interface UserGoals {
  weightLossGoal: number; // kg
  timelineWeeks: number;
}

export interface DayRecord {
  calories: number;
  protein: number;
  steps: number;
  workout: boolean;
  sleep: boolean;
  core: boolean;
  customFields: Record<string, string | boolean | number>;
}

interface AppState {
  isOnboarded: boolean;
  profile: UserProfile | null;
  goals: UserGoals | null;
  targets: {
    tdee: number;
    dailyCalories: number;
    protein: number;
  } | null;
  history: Record<string, DayRecord>; // ISO date string "YYYY-MM-DD" as key
  customKeys: Array<{ id: string; name: string; type: 'boolean' | 'number' | 'text' }>;
  googleEmail: string | null;
  googleToken: string | null;
  googleTokenExpiry: number;
  
  // Actions
  completeOnboarding: (profile: UserProfile, goals: UserGoals) => void;
  updateDayRecord: (dateStr: string, updates: Partial<DayRecord>) => void;
  addCustomKey: (name: string, type: 'boolean' | 'number' | 'text') => void;
  removeCustomKey: (id: string) => void;
  setGoogleAuth: (email: string | null, token: string | null, expiry: number) => void;
  resetApp: () => void;
}

// Logic Engine Calculations
const calculateTargets = (profile: UserProfile, goals: UserGoals) => {
  // Mifflin-St Jeor
  const bmrBase = (10 * profile.weight) + (6.25 * profile.height) - (5 * profile.age);
  const bmr = profile.gender === 'male' ? bmrBase + 5 : bmrBase - 161;
  
  const activityMultipliers: Record<ActivityLevel, number> = {
    'sedentary': 1.2,
    'light': 1.375,
    'moderate': 1.55,
    'active': 1.725,
    'very-active': 1.9
  };
  
  const tdee = Math.round(bmr * activityMultipliers[profile.activityLevel]);

  // Calculate deficit required for goal timeline
  // 1 kg body fat = ~7700 kcal
  const totalDeficit = goals.weightLossGoal * 7700;
  const days = goals.timelineWeeks * 7;
  let rawDailyDeficit = Math.round(totalDeficit / days);
  
  // Clamp deficit between 200 and 1000 for safety, but user wants 500-750 based
  rawDailyDeficit = Math.max(200, Math.min(rawDailyDeficit, 1000));
  
  const dailyCalories = tdee - rawDailyDeficit;
  const protein = Math.round(profile.weight * 1.8);
  
  return { tdee, dailyCalories, protein };
};

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      isOnboarded: false,
      profile: null,
      goals: null,
      targets: null,
      history: {},
      customKeys: [],
      googleEmail: null,
      googleToken: null,
      googleTokenExpiry: 0,

      completeOnboarding: (profile, goals) => {
        const targets = calculateTargets(profile, goals);
        set({ isOnboarded: true, profile, goals, targets });
      },

      updateDayRecord: (dateStr, updates) => set((state) => {
        const currentData = state.history[dateStr] || {
          calories: 0,
          protein: 0,
          steps: 0,
          workout: false,
          sleep: false,
          core: false,
          customFields: {}
        };
        
        let customFields = currentData.customFields;
        if (updates.customFields) {
           customFields = { ...currentData.customFields, ...updates.customFields };
        }
        
        return {
          history: {
            ...state.history,
            [dateStr]: { ...currentData, ...updates, customFields }
          }
        };
      }),

      addCustomKey: (name, type) => set((state) => ({
        customKeys: [...state.customKeys, { id: Date.now().toString(), name, type }]
      })),

      removeCustomKey: (id) => set((state) => ({
        customKeys: state.customKeys.filter(k => k.id !== id)
      })),
      
      setGoogleAuth: (email, token, expiry) => set((state) => ({ 
        googleEmail: email !== undefined ? email : state.googleEmail,
        googleToken: token, 
        googleTokenExpiry: expiry 
      })),
      
      resetApp: () => set({
        isOnboarded: false,
        profile: null,
        goals: null,
        targets: null,
        history: {},
        customKeys: [],
        googleEmail: null,
        googleToken: null,
        googleTokenExpiry: 0
      })
    }),
    {
      name: 'matrix-fitness-storage',
      // only persist selected fields if desired, but we want 100% offline so default is fine
    }
  )
);
