import { useState, useRef, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { useGeminiAgent } from '../hooks/useGeminiAgent';
import { Bot, Send, Key, Sparkles, X, Trash2, Camera } from 'lucide-react';
import { cn } from '../lib/utils';

interface AIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date;
}

export function AIAssistant({ isOpen, onClose, selectedDate }: AIAssistantProps) {
  const { geminiKey, geminiModel, setGeminiKey, setGeminiModel, chats, clearChats } = useStore();
  const { sendMessage, isTyping } = useGeminiAgent();
  const [inputVal, setInputVal] = useState('');
  const [keyInput, setKeyInput] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [availableModels, setAvailableModels] = useState<{name: string, displayName: string}[]>([]);
  const endRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (geminiKey && isOpen) {
      fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${geminiKey}`)
        .then(res => res.json())
        .then(data => {
           if (data.models) {
             const genModels = data.models.filter((m: any) => 
               m.supportedGenerationMethods?.includes('generateContent') && 
               m.name.startsWith('models/gemini')
             ).map((m: any) => ({
               name: m.name.replace('models/', ''),
               displayName: m.displayName
             }));
             setAvailableModels(genModels.reverse()); // Put newest usually at top
             
             if (genModels.length > 0 && !genModels.find((m: any) => m.name === useStore.getState().geminiModel)) {
               setGeminiModel(genModels[0].name);
             }
           }
        }).catch(err => console.error("Failed to fetch models", err));
    }
  }, [geminiKey, isOpen, setGeminiModel]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chats, isTyping, isOpen]);

  if (!isOpen) return null;

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSend = () => {
    if (!inputVal.trim() && !selectedImage) return;
    sendMessage(inputVal, selectedDate, selectedImage);
    setInputVal('');
    clearImage();
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-sm h-[85vh] bg-card border border-primary/20 rounded-2xl shadow-2xl flex flex-col overflow-hidden relative">
        
        {/* Header */}
        <div className="p-4 border-b border-border flex justify-between items-center bg-muted/30">
          <div className="flex items-center gap-2 text-primary font-bold">
            <Sparkles size={18} className="animate-pulse" />
            <span>Matrix AI Coach</span>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-muted text-foreground transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Bring Your Own Key Gates */}
        {!geminiKey ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 border border-primary/20 shadow-[0_0_15px_rgba(var(--primary),0.3)]">
              <Key size={32} className="text-primary" />
            </div>
            <h3 className="text-lg font-bold mb-2 text-foreground">Unlock AI Intelligence</h3>
            <p className="text-sm text-muted-foreground mb-6">Connect your free Google Gemini API Key to enable voice and text agentic management. Your key is 100% encrypted locally and synced securely to your private Drive.</p>
            <input 
               type="password"
               value={keyInput}
               onChange={e => setKeyInput(e.target.value)}
               placeholder="Paste Gemini API Key..."
               className="w-full bg-muted/50 border border-border rounded-xl p-3 text-sm focus:outline-none focus:border-primary/50 text-foreground mb-3 font-mono"
            />

            <button 
              onClick={() => { if(keyInput) setGeminiKey(keyInput.trim()) }}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 rounded-xl transition-all"
            >
              Secure Key
            </button>
            <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-xs text-primary/80 mt-4 hover:underline">Get a free key here</a>
          </div>
        ) : (
          <>
            {/* Chat Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/10">
              
              {chats.length === 0 && (
                <div className="text-center text-muted-foreground text-sm py-8 space-y-2">
                  <Bot size={32} className="mx-auto opacity-50 mb-2"/>
                  <p>I am online and synced to your Matrix database.</p>
                  <p className="italic text-xs opacity-70">"Log my morning workout and 400 cal breakfast."</p>
                </div>
              )}
              {chats.map((chat, i) => (
                <div key={i} className={cn("flex", chat.role === 'user' ? "justify-end" : "justify-start")}>
                  <div className={cn("max-w-[85%] rounded-2xl p-3 text-sm", 
                    chat.role === 'user' ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-muted border border-border text-foreground rounded-tl-sm"
                  )}>
                    {chat.content}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-muted border border-border rounded-2xl rounded-tl-sm p-4 flex gap-1 items-center">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" />
                    <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.2s]" />
                    <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>

            {/* Input Bar */}
            <div className="p-3 bg-card border-t border-border flex flex-col gap-2">
              
              {/* Controls Row */}
              <div className="w-full flex justify-between items-center mb-1">
                 {availableModels.length > 0 ? (
                   <select
                     value={geminiModel || ''}
                     onChange={(e) => setGeminiModel(e.target.value)}
                     className="bg-muted/40 border border-primary/20 rounded-lg px-2 py-1 text-[10px] focus:outline-none text-primary appearance-none cursor-pointer font-bold max-w-[200px] truncate"
                   >
                     {availableModels.map(m => (
                       <option key={m.name} value={m.name}>{m.displayName}</option>
                     ))}
                   </select>
                 ) : (
                   <div className="bg-muted/40 border border-border rounded-lg px-2 py-1 text-[10px] text-muted-foreground animate-pulse">Loading Models...</div>
                 )}
                 
                 <a href="https://aistudio.google.com/" target="_blank" rel="noreferrer" className="text-[10px] text-muted-foreground hover:text-primary transition-colors">Manage Key</a>
              </div>
              
              {/* Image Preview Thumbnail */}
              {imagePreview && (
                <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-border">
                  <img src={imagePreview} alt="upload" className="w-full h-full object-cover" />
                  <button onClick={clearImage} className="absolute top-1 right-1 bg-black/50 p-1 rounded-full text-white hover:bg-black/70">
                    <X size={12} />
                  </button>
                </div>
              )}

              <div className="flex gap-2 items-center">
                <button 
                  onClick={() => { if(window.confirm("Clear all logs?")) clearChats(); }} 
                  className="p-2.5 text-muted-foreground hover:text-destructive transition-colors rounded-xl bg-muted/30"
                >
                  <Trash2 size={18}/>
                </button>
                
                <input 
                  type="file" 
                  accept="image/*" 
                  capture="environment"
                  className="hidden" 
                  ref={fileInputRef} 
                  onChange={handleImageSelect} 
                />
                
                <button 
                  onClick={() => fileInputRef.current?.click()} 
                  className="p-2.5 text-muted-foreground hover:text-primary transition-colors rounded-xl bg-muted/30"
                >
                  <Camera size={18}/>
                </button>

                <input 
                  type="text"
                  value={inputVal}
                  onChange={e => setInputVal(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                  placeholder={selectedImage ? "Add context..." : `Tell AI to log something...`}
                  className="flex-1 bg-muted/50 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary/50 text-foreground"
                />
                <button 
                  onClick={handleSend}
                  disabled={isTyping || (!inputVal.trim() && !selectedImage)}
                  className="bg-primary text-primary-foreground p-2.5 rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-colors"
                 >
                   <Send size={18} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
