import { useState } from 'react';
import { type UserProfile, type UserGoals, useStore } from '../store/useStore';
import { Activity, User, Target, ChevronRight, Check } from 'lucide-react';
import { cn } from '../lib/utils';

export function Onboarding() {
  const completeOnboarding = useStore(state => state.completeOnboarding);
  
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState<Partial<UserProfile>>({
    gender: 'male',
    activityLevel: 'moderate'
  });
  const [goals, setGoals] = useState<Partial<UserGoals>>({
    weightLossGoal: 5,
    timelineWeeks: 10
  });

  const handleNext = () => setStep(s => s + 1);
  
  const handleFinish = () => {
    if (
      profile.name && profile.gender && profile.weight && 
      profile.height && profile.age && profile.activityLevel &&
      goals.weightLossGoal && goals.timelineWeeks
    ) {
      completeOnboarding(profile as UserProfile, goals as UserGoals);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl p-8 shadow-xl relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-400" />
        
        <div className="flex items-center gap-3 mb-8">
          <div className={cn(
             "p-3 rounded-xl transition-colors",
             step === 1 ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
          )}>
            <User size={24} />
          </div>
          <div className={cn(
             "h-1 flex-1 rounded-full transition-colors",
             step >= 2 ? "bg-primary/50" : "bg-muted"
          )} />
          <div className={cn(
             "p-3 rounded-xl transition-colors",
             step === 2 ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
          )}>
            <Activity size={24} />
          </div>
          <div className={cn(
             "h-1 flex-1 rounded-full transition-colors",
             step >= 3 ? "bg-primary/50" : "bg-muted"
          )} />
          <div className={cn(
             "p-3 rounded-xl transition-colors",
             step === 3 ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
          )}>
            <Target size={24} />
          </div>
        </div>

        <div className="space-y-6">
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-2xl font-bold mb-2">Initialize Protocol</h2>
              <p className="text-muted-foreground mb-6">Enter your basic parameters to calibrate the system.</p>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Operator Name</label>
                  <input 
                    type="text"
                    value={profile.name || ''}
                    onChange={e => setProfile({...profile, name: e.target.value})}
                    className="w-full bg-input border border-border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium"
                    placeholder="Neo"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                     <label className="text-sm font-medium mb-1.5 block">Age</label>
                     <input 
                       type="number"
                       value={profile.age || ''}
                       onChange={e => setProfile({...profile, age: Number(e.target.value)})}
                       className="w-full bg-input border border-border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                       placeholder="Years"
                     />
                  </div>
                  <div>
                     <label className="text-sm font-medium mb-1.5 block">Gender</label>
                     <select 
                       value={profile.gender}
                       onChange={e => setProfile({...profile, gender: e.target.value as 'male' | 'female'})}
                       className="w-full bg-input border border-border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all appearance-none"
                     >
                       <option value="male">Male</option>
                       <option value="female">Female</option>
                     </select>
                  </div>
                </div>
                
                <button 
                  onClick={handleNext}
                  disabled={!profile.name || !profile.age}
                  className="w-full mt-6 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-2xl font-bold mb-2">Metrics Calibration</h2>
              <p className="text-muted-foreground mb-6">Physical parameters are required for thermal engine math.</p>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Weight (kg)</label>
                    <input 
                      type="number"
                      value={profile.weight || ''}
                      onChange={e => setProfile({...profile, weight: Number(e.target.value)})}
                      className="w-full bg-input border border-border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Height (cm)</label>
                    <input 
                      type="number"
                      value={profile.height || ''}
                      onChange={e => setProfile({...profile, height: Number(e.target.value)})}
                      className="w-full bg-input border border-border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    />
                  </div>
                </div>

                <div>
                   <label className="text-sm font-medium mb-1.5 block">Activity Level</label>
                   <select 
                     value={profile.activityLevel}
                     onChange={e => setProfile({...profile, activityLevel: e.target.value as any})}
                     className="w-full bg-input border border-border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all appearance-none"
                   >
                     <option value="sedentary">Sedentary (Desk Job)</option>
                     <option value="light">Light (1-3 days/wk)</option>
                     <option value="moderate">Moderate (3-5 days/wk)</option>
                     <option value="active">Active (6-7 days/wk)</option>
                     <option value="very-active">Very Active (Atlas)</option>
                   </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button 
                    onClick={() => setStep(1)}
                    className="flex-1 bg-muted hover:bg-muted/80 text-foreground font-semibold py-3.5 rounded-xl transition-all"
                  >
                    Back
                  </button>
                  <button 
                    onClick={handleNext}
                    disabled={!profile.weight || !profile.height}
                    className="flex-[2] bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Continue <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-2xl font-bold mb-2">Target Acquisition</h2>
              <p className="text-muted-foreground mb-6">Set your parameters to calculate the optimal matrix path.</p>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Target Weight Loss (kg)</label>
                  <div className="relative">
                    <input 
                      type="number"
                      value={goals.weightLossGoal || ''}
                      onChange={e => setGoals({...goals, weightLossGoal: Number(e.target.value)})}
                      className="w-full bg-input border border-border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-xl font-semibold text-primary"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Timeline (Weeks)</label>
                  <div className="flex items-center gap-4">
                    <input 
                      type="range"
                      min="4"
                      max="52"
                      value={goals.timelineWeeks || 10}
                      onChange={e => setGoals({...goals, timelineWeeks: Number(e.target.value)})}
                      className="flex-1 accent-primary"
                    />
                    <span className="bg-input border border-border w-16 text-center py-2 rounded-lg font-bold">
                      {goals.timelineWeeks}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 text-right">
                    ~{(goals.weightLossGoal! / goals.timelineWeeks!).toFixed(2)} kg / week
                  </p>
                </div>

                <div className="flex gap-3 pt-6">
                  <button 
                    onClick={() => setStep(2)}
                    className="flex-1 bg-muted hover:bg-muted/80 text-foreground font-semibold py-3.5 rounded-xl transition-all"
                  >
                    Back
                  </button>
                  <button 
                    onClick={handleFinish}
                    className="flex-[2] bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] shadow-primary/30"
                  >
                    Boot Matrix <Check size={18} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
