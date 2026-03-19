import { useState } from 'react';
import { useStore, type DayRecord } from '../store/useStore';
import { 
  Dumbbell, Moon, Crosshair, Settings, ChevronLeft, 
  ChevronRight, Plus, Trash2, X, Activity, Flame, Cloud, RefreshCw, Download
} from 'lucide-react';
import { useGoogleDrive } from '../hooks/useGoogleDrive';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { format, getDaysInMonth, startOfMonth, addDays, isSameDay } from 'date-fns';
import { cn } from '../lib/utils';

export function Dashboard() {
  const { profile, targets, history, updateDayRecord, customKeys, addCustomKey, removeCustomKey } = useStore();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [newCustomKeyName, setNewCustomKeyName] = useState('');
  const [newCustomKeyType, setNewCustomKeyType] = useState<'boolean' | 'number' | 'text'>('boolean');
  
  const { uploadToDrive, downloadFromDrive, connect, disconnect, isSyncing, googleEmail } = useGoogleDrive();
  const { isInstallable, promptInstall } = usePWAInstall();

  const daysInMonth = getDaysInMonth(currentDate);
  const monthStart = startOfMonth(currentDate);
  
  const days = Array.from({ length: daysInMonth }).map((_, i) => addDays(monthStart, i));

  const getDayData = (date: Date): DayRecord | undefined => {
    return history[format(date, 'yyyy-MM-dd')];
  };

  const handleUpdateRecord = (date: Date, updates: Partial<DayRecord>) => {
    updateDayRecord(format(date, 'yyyy-MM-dd'), updates);
  };

  const handleUpdateCustomField = (date: Date, keyId: string, value: string | boolean | number) => {
    const data = getDayData(date);
    handleUpdateRecord(date, {
      customFields: {
        ...(data?.customFields || {}),
        [keyId]: value
      }
    });
  };

  // BMI Math
  const heightInM = (profile?.height || 0) / 100;
  const bmi = profile ? (profile.weight / (heightInM * heightInM)).toFixed(1) : 0;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col max-w-2xl mx-auto shadow-2xl relative">
      {/* Header stats */}
      <header className="px-5 py-6 bg-card border-b border-border z-10 sticky top-0 backdrop-blur-md bg-opacity-90">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-primary">The Matrix</h1>
            <p className="text-muted-foreground text-sm font-medium">Operator: {profile?.name}</p>
          </div>
          <div className="flex items-center gap-2">
            {isInstallable && (
              <button 
                onClick={promptInstall}
                className="p-2.5 rounded-full bg-primary/20 hover:bg-primary/30 text-primary transition-all focus:outline-none focus:ring-2 focus:ring-primary/50 animate-pulse-slow"
                title="Install App"
              >
                <Download size={20} />
              </button>
            )}
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="p-2.5 rounded-full bg-muted/50 hover:bg-muted text-muted-foreground transition-all focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <Settings size={20} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3 text-center">
          <div className="bg-muted/40 p-3 rounded-2xl flex flex-col items-center justify-center border border-border/50">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">BMI</span>
            <span className="font-mono text-lg font-bold text-foreground">{bmi}</span>
          </div>
          <div className="bg-muted/40 p-3 rounded-2xl flex flex-col items-center justify-center border border-border/50" title="Total Daily Energy Expenditure">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1 flex items-center gap-1"><Activity size={10}/> TDEE</span>
            <span className="font-mono text-lg font-bold text-foreground">{targets?.tdee}</span>
          </div>
          <div className="bg-primary/10 p-3 rounded-2xl flex flex-col items-center justify-center border border-primary/20" title="Target Daily Calories">
            <span className="text-[10px] uppercase font-bold text-primary tracking-wider mb-1 flex items-center gap-1"><Flame size={10}/> TARGET</span>
            <span className="font-mono text-lg font-bold text-primary">{targets?.dailyCalories}</span>
          </div>
          <div className="bg-secondary/20 p-3 rounded-2xl flex flex-col items-center justify-center border border-secondary/30">
            <span className="text-[10px] uppercase font-bold text-secondary-foreground tracking-wider mb-1">Pro</span>
            <span className="font-mono text-lg font-bold text-secondary-foreground">{targets?.protein}g</span>
          </div>
        </div>
      </header>

      {/* Grid View */}
      <main className="flex-1 p-5 overflow-y-auto no-scrollbar">
        <div className="flex justify-between items-center mb-6">
          <button className="p-2" onClick={() => setCurrentDate(addDays(monthStart, -daysInMonth))}>
            <ChevronLeft className="text-muted-foreground hover:text-foreground transition-colors" />
          </button>
          <h2 className="text-lg font-bold uppercase tracking-widest">{format(currentDate, 'MMMM yyyy')}</h2>
          <button className="p-2" onClick={() => setCurrentDate(addDays(monthStart, daysInMonth))}>
            <ChevronRight className="text-muted-foreground hover:text-foreground transition-colors" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
            <div key={i} className="text-center text-xs font-bold text-muted-foreground mb-2">{d}</div>
          ))}
          {/* Offset for start of month */}
          {Array.from({ length: monthStart.getDay() }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square rounded-xl bg-transparent" />
          ))}
          
          {days.map(day => {
            const data = getDayData(day);
            const isToday = isSameDay(day, new Date());
            const hasData = data && (data.calories > 0 || data.workout || data.steps > 0);
            
            // simple visual heuristic for day "success"
            const calorieProgress = data ? Math.min((data.calories / (targets?.dailyCalories || 1)) * 100, 100) : 0;
            const proteinProgress = data ? Math.min((data.protein / (targets?.protein || 1)) * 100, 100) : 0;
            
            return (
              <button
                key={day.toISOString()}
                onClick={() => setSelectedDate(day)}
                className={cn(
                  "relative aspect-square rounded-xl flex items-center justify-center text-sm font-semibold transition-all border overflow-hidden",
                  isToday ? "border-primary text-primary" : "border-border text-foreground/80 hover:border-primary/50",
                  hasData ? "bg-card shadow-sm" : "bg-muted/20"
                )}
              >
                <span className="z-10">{format(day, 'd')}</span>
                
                {/* Mini background indicators */}
                {hasData && (
                  <div className="absolute bottom-0 left-0 w-full h-1/3 flex opacity-40">
                    <div className="h-full bg-red-500/50" style={{ width: `${calorieProgress}%` }} />
                    <div className="h-full bg-blue-500/50" style={{ width: `${proteinProgress}%` }} />
                  </div>
                )}
                {data?.workout && (
                  <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                )}
              </button>
            );
          })}
        </div>
      </main>

      {/* Daily Tracking Modal */}
      {selectedDate && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-card border border-border sm:rounded-2xl rounded-t-3xl min-h-[70vh] max-h-[90vh] overflow-y-auto shadow-2xl animate-in slide-in-from-bottom-5 p-6 pb-20 sm:pb-6 relative">
             <div className="flex justify-between items-center mb-6 sticky top-0 bg-card py-2 border-b border-border/50 backdrop-blur-md z-10">
               <h3 className="text-xl font-bold font-mono text-primary flex items-center gap-2">
                 {format(selectedDate, 'MMM do, yyyy')}
               </h3>
               <button onClick={() => setSelectedDate(null)} className="p-2 rounded-full bg-muted hover:bg-muted/80 text-foreground transition-colors">
                 <X size={20} />
               </button>
             </div>

             <div className="space-y-6">
                {/* Core Macros */}
                <div className="space-y-4">
                  <h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <Flame size={14}/> Core Telemetry
                  </h4>
                  
                  <div className="bg-muted/30 p-4 rounded-xl border border-border">
                    <label className="text-xs font-bold text-muted-foreground mb-1 block">CALORIES IN</label>
                    <div className="flex items-center gap-3">
                      <input 
                        type="number"
                        className="bg-transparent text-2xl font-mono font-bold w-24 focus:outline-none focus:ring-0 p-0 text-foreground placeholder:text-muted-foreground/30"
                        placeholder="0"
                        value={getDayData(selectedDate)?.calories || ''}
                        onChange={(e) => handleUpdateRecord(selectedDate, { calories: Number(e.target.value) })}
                      />
                      <span className="text-muted-foreground flex-1">/ {targets?.dailyCalories} kcal</span>
                    </div>
                    {/* Visual Progress */}
                    <div className="w-full h-1.5 bg-muted rounded-full mt-3 overflow-hidden">
                      <div className="h-full bg-red-500 rounded-full transition-all" style={{ width: `${Math.min(((getDayData(selectedDate)?.calories || 0) / (targets?.dailyCalories || 1)) * 100, 100)}%` }} />
                    </div>
                  </div>

                  <div className="bg-muted/30 p-4 rounded-xl border border-border">
                    <label className="text-xs font-bold text-muted-foreground mb-1 block">PROTEIN</label>
                    <div className="flex items-center gap-3">
                      <input 
                        type="number"
                        className="bg-transparent text-2xl font-mono font-bold w-24 focus:outline-none focus:ring-0 p-0 text-secondary-foreground placeholder:text-muted-foreground/30"
                        placeholder="0"
                        value={getDayData(selectedDate)?.protein || ''}
                        onChange={(e) => handleUpdateRecord(selectedDate, { protein: Number(e.target.value) })}
                      />
                      <span className="text-muted-foreground flex-1">/ {targets?.protein} g</span>
                    </div>
                    {/* Visual Progress */}
                    <div className="w-full h-1.5 bg-muted rounded-full mt-3 overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${Math.min(((getDayData(selectedDate)?.protein || 0) / (targets?.protein || 1)) * 100, 100)}%` }} />
                    </div>
                  </div>

                  <div className="bg-muted/30 p-4 rounded-xl border border-border">
                    <label className="text-xs font-bold text-muted-foreground mb-1 block flex items-center gap-1"><Activity size={12}/> STEPS</label>
                    <input 
                      type="number"
                      className="bg-transparent text-xl font-mono font-bold w-full focus:outline-none focus:ring-0 p-0 text-foreground placeholder:text-muted-foreground/30 border-b border-border/50 pb-1"
                      placeholder="e.g. 10000"
                      value={getDayData(selectedDate)?.steps || ''}
                      onChange={(e) => handleUpdateRecord(selectedDate, { steps: Number(e.target.value) })}
                    />
                  </div>
                </div>

                {/* Checklist */}
                <div className="space-y-4">
                  <h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Protocols</h4>
                  <div className="grid grid-cols-1 gap-3">
                    <label className={cn("flex flex-row items-center justify-between p-4 rounded-xl border cursor-pointer transition-all", getDayData(selectedDate)?.workout ? "bg-primary/10 border-primary" : "bg-muted/30 border-border hover:bg-muted/50")}>
                      <div className="flex items-center gap-3">
                        <div className={cn("p-2 rounded-lg", getDayData(selectedDate)?.workout ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                          <Dumbbell size={18} />
                        </div>
                        <span className="font-semibold">Workout</span>
                      </div>
                      <input type="checkbox" className="w-6 h-6 accent-primary rounded-md" checked={getDayData(selectedDate)?.workout || false} onChange={(e) => handleUpdateRecord(selectedDate, { workout: e.target.checked })} />
                    </label>

                    <label className={cn("flex flex-row items-center justify-between p-4 rounded-xl border cursor-pointer transition-all", getDayData(selectedDate)?.sleep ? "bg-indigo-500/10 border-indigo-500" : "bg-muted/30 border-border hover:bg-muted/50")}>
                      <div className="flex items-center gap-3">
                        <div className={cn("p-2 rounded-lg", getDayData(selectedDate)?.sleep ? "bg-indigo-500 text-white" : "bg-muted text-muted-foreground")}>
                          <Moon size={18} />
                        </div>
                        <span className="font-semibold">8h+ Sleep</span>
                      </div>
                      <input type="checkbox" className="w-6 h-6 accent-indigo-500 rounded-md" checked={getDayData(selectedDate)?.sleep || false} onChange={(e) => handleUpdateRecord(selectedDate, { sleep: e.target.checked })} />
                    </label>

                    <label className={cn("flex flex-row items-center justify-between p-4 rounded-xl border cursor-pointer transition-all", getDayData(selectedDate)?.core ? "bg-orange-500/10 border-orange-500" : "bg-muted/30 border-border hover:bg-muted/50")}>
                      <div className="flex items-center gap-3">
                        <div className={cn("p-2 rounded-lg", getDayData(selectedDate)?.core ? "bg-orange-500 text-white" : "bg-muted text-muted-foreground")}>
                          <Crosshair size={18} />
                        </div>
                        <span className="font-semibold">Core Engagement</span>
                      </div>
                      <input type="checkbox" className="w-6 h-6 accent-orange-500 rounded-md" checked={getDayData(selectedDate)?.core || false} onChange={(e) => handleUpdateRecord(selectedDate, { core: e.target.checked })} />
                    </label>
                  </div>
                </div>
                
                {/* Custom Fields */}
                {customKeys.length > 0 && (
                  <div className="space-y-4 pt-4 border-t border-border">
                    <h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center justify-between">
                      Custom Parameters
                      <button onClick={() => {setSelectedDate(null); setIsSettingsOpen(true);}} className="p-1 text-primary hover:bg-primary/10 rounded"><Plus size={14}/></button>
                    </h4>
                    
                    <div className="space-y-3">
                      {customKeys.map(key => {
                        const val = getDayData(selectedDate)?.customFields?.[key.id];
                        
                        if (key.type === 'boolean') {
                          return (
                            <label key={key.id} className={cn("flex flex-row items-center justify-between p-4 rounded-xl border cursor-pointer transition-all", val ? "bg-secondary/20 border-secondary" : "bg-muted/30 border-border hover:bg-muted/50")}>
                              <span className="font-semibold">{key.name}</span>
                              <input type="checkbox" className="w-6 h-6 accent-secondary rounded-md" checked={!!val} onChange={(e) => handleUpdateCustomField(selectedDate, key.id, e.target.checked)} />
                            </label>
                          );
                        }
                        
                        return (
                          <div key={key.id} className="bg-muted/30 p-4 rounded-xl border border-border flex justify-between items-center gap-4">
                            <label className="text-sm font-bold text-muted-foreground">{key.name}</label>
                            <input 
                              type={key.type === 'number' ? 'number' : 'text'}
                              className="bg-transparent text-right font-mono font-bold w-1/2 focus:outline-none border-b border-border/50 pb-1 text-foreground"
                              value={(val as string) || ''}
                              onChange={(e) => handleUpdateCustomField(selectedDate, key.id, key.type === 'number' ? Number(e.target.value) : e.target.value)}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
             </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/90 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-card border border-border rounded-2xl p-6 shadow-2xl relative">
            <button onClick={() => setIsSettingsOpen(false)} className="absolute top-4 right-4 p-2 rounded-full bg-muted hover:bg-muted/80 text-foreground">
              <X size={20} />
            </button>
            <h2 className="text-2xl font-bold mb-6">Settings</h2>
            
            <div className="space-y-6">
              {isInstallable && (
                <div className="bg-primary/10 border border-primary/30 p-4 rounded-xl">
                  <h3 className="text-sm font-bold text-primary mb-2 flex items-center gap-2"><Download size={16}/> Matrix App is Ready</h3>
                  <p className="text-xs text-muted-foreground mb-3">Install this application directly to your home screen for the full 100% offline standalone experience.</p>
                  <button 
                    onClick={promptInstall}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
                  >
                    Install to Home Screen
                  </button>
                </div>
              )}
              
              <div>
                <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-3">Custom Tracking Keys</h3>
                <div className="space-y-2 mb-4 max-h-40 overflow-y-auto">
                   {customKeys.length === 0 && <p className="text-sm text-muted-foreground italic">No custom keys configured.</p>}
                   {customKeys.map(key => (
                     <div key={key.id} className="flex items-center justify-between bg-muted/40 p-3 rounded-lg border border-border/50">
                       <div>
                         <span className="font-semibold block text-sm">{key.name}</span>
                         <span className="text-xs text-muted-foreground uppercase">{key.type}</span>
                       </div>
                       <button onClick={() => removeCustomKey(key.id)} className="text-destructive hover:bg-destructive/10 p-2 rounded-md transition-colors"><Trash2 size={16}/></button>
                     </div>
                   ))}
                </div>
                
                <div className="bg-input/50 p-4 rounded-xl border border-border">
                  <h4 className="text-sm font-semibold mb-3">Add Custom Key</h4>
                  <input 
                     type="text" 
                     placeholder="e.g. Creatine (5g)"
                     value={newCustomKeyName}
                     onChange={e => setNewCustomKeyName(e.target.value)}
                     className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <div className="flex gap-2 mb-3">
                    <select 
                      value={newCustomKeyType} 
                      onChange={(e) => setNewCustomKeyType(e.target.value as any)}
                      className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none appearance-none"
                    >
                      <option value="boolean">Toggle (Yes/No)</option>
                      <option value="number">Number Output</option>
                      <option value="text">Notes/Text</option>
                    </select>
                    <button 
                      onClick={() => {
                        if (newCustomKeyName) {
                          addCustomKey(newCustomKeyName, newCustomKeyType);
                          setNewCustomKeyName('');
                        }
                      }}
                      className="bg-primary text-primary-foreground p-2 rounded-lg font-bold hover:bg-primary/90 flex items-center justify-center transition-colors"
                    >
                      <Plus size={18}/>
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-border space-y-3">
                 <div className="bg-muted/40 p-4 rounded-xl border border-border border-dashed">
                    <h4 className="text-sm font-semibold mb-3 flex items-center justify-between">
                       Cloud Connect
                       {googleEmail ? (
                         <span className="text-xs text-primary font-mono">{googleEmail}</span>
                       ) : (
                         <span className="text-xs text-muted-foreground uppercase">Not Linked</span>
                       )}
                    </h4>
                    
                    {!googleEmail ? (
                      <button 
                        onClick={connect}
                        disabled={isSyncing}
                        className="w-full bg-primary/10 border border-primary/50 text-primary hover:bg-primary/20 py-3 rounded-xl font-bold transition-colors uppercase text-sm flex items-center justify-center gap-2"
                      >
                        {isSyncing ? <RefreshCw className="animate-spin" size={16}/> : <Cloud size={16} />}
                        Link Google Drive
                      </button>
                    ) : (
                      <div className="space-y-3">
                         <button 
                           onClick={uploadToDrive}
                           disabled={isSyncing}
                           className="w-full bg-indigo-500/10 border border-indigo-500/50 text-indigo-500 hover:bg-indigo-500/20 py-3 rounded-xl font-bold transition-colors uppercase text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                         >
                           {isSyncing ? <RefreshCw className="animate-spin" size={16}/> : <Cloud size={16} />}
                           Secure Backup to Drive
                         </button>
                         <button 
                           onClick={downloadFromDrive}
                           disabled={isSyncing}
                           className="w-full bg-muted/30 border border-border text-foreground hover:bg-muted/50 py-3 rounded-xl font-bold transition-colors uppercase text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                         >
                           {isSyncing ? <RefreshCw className="animate-spin" size={16}/> : <RefreshCw size={16} />}
                           Force Restore from Drive
                         </button>
                         <button 
                           onClick={disconnect}
                           className="w-full text-muted-foreground hover:text-foreground text-xs font-semibold pt-1 transition-colors flex items-center justify-center gap-1"
                         >
                           <X size={12}/> Disconnect Account
                         </button>
                      </div>
                    )}
                 </div>

                 <button 
                   onClick={() => {
                     if(window.confirm("Initialize complete system reset? All local data will be permanently wiped.")) {
                       useStore.getState().resetApp();
                     }
                   }}
                   className="w-full border border-destructive/50 text-destructive hover:bg-destructive/10 py-3 rounded-xl font-bold transition-colors uppercase text-sm mt-6"
                 >
                   Factory Reset System
                 </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
