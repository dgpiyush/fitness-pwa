import { useState } from 'react';
import { useStore } from '../store/useStore';

export function useGeminiAgent() {
  const [isTyping, setIsTyping] = useState(false);
  const { geminiKey, geminiModel, chats, addChat, profile, goals, targets, history, updateDayRecord, customKeys } = useStore();

  const sendMessage = async (message: string, selectedDate: Date) => {
    if (!geminiKey) return;
    
    addChat({ role: 'user', content: message });
    setIsTyping(true);

    const dateStr = selectedDate.toISOString().split('T')[0];
    const todayData = history[dateStr] || {};
    
    // Build the magical system prompt that binds the AI to the PWA state
    const systemPrompt = `You are "Matrix AI", an elite fitness tracking assistant integrated directly into a localized frontend PWA. Your job is to act as the user's personal coach and help them log their data.
    Current User Profile: ${JSON.stringify(profile)}
    Goals: ${JSON.stringify(goals)}
    Targets: ${JSON.stringify(targets)}
    Today's Date: ${dateStr}
    Today's Logged Data: ${JSON.stringify(todayData)}
    Custom Keys schema: ${JSON.stringify(customKeys)}
    
    CRITICAL PROTOCOL: 
    If the user asks you to log, update, or change any data for TODAY (like logging a meal, recording weight, hitting their step count, etc.), you MUST execute those actions by providing a JSON block formatted exactly like this inside a markdown codeblock:
    \`\`\`json
    {
      "action": "UPDATE_TODAY",
      "updates": {
        "calories": 500,
        "protein": 30,
        "weight": 80,
        "workout": true,
        "sleep": false,
        "core": true,
        "steps": 10000
      }
    }
    \`\`\`
    Only include the fields inside "updates" that the user explicitly wants to change. The rest will remain untouched.
    Always reply with a brief, encouraging conversational response alongside the JSON block (e.g. "I've logged that 500 calorie burger for you! Keep pushing!"). Do NOT include the JSON block if the user is merely asking a question or seeking advice without logging data.`;

    try {
      const apiMessages = chats.slice(-15).map(c => ({
        role: c.role === 'model' ? 'model' : 'user',
        parts: [{ text: c.content }]
      }));
      
      apiMessages.push({ role: 'user', parts: [{ text: message }] });

      const payload = {
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: apiMessages,
        generationConfig: { temperature: 0.7 }
      };

      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${geminiModel || 'gemini-1.5-flash'}:generateContent?key=${geminiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        let errDetails = '';
        try {
           const errData = await res.json();
           errDetails = errData.error?.message || '';
        } catch(e) {}
        
        if (res.status === 404) {
           throw new Error(errDetails || "Model not found. Tip: If you generated this key in Google Cloud, you must enable the 'Generative Language API' first!");
        }
        throw new Error(`API Error ${res.status}: ${errDetails}`);
      }

      const data = await res.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      let cleanText = rawText;
      const jsonMatch = rawText.match(/```json\n([\s\S]*?)\n```/);
      
      // Agentic Hook Execution
      if (jsonMatch) {
         try {
           const parsed = JSON.parse(jsonMatch[1]);
           if (parsed.action === 'UPDATE_TODAY' && parsed.updates) {
             updateDayRecord(dateStr, parsed.updates);
           }
         } catch(e) { 
           console.error("Agent failed to parse its own JSON instructions.", e);
         }
         // Strip the raw code payload from the UI chat perfectly so the user only sees conversational output
         cleanText = rawText.replace(/```json\n[\s\S]*?\n```/, '').trim();
      }

      addChat({ role: 'model', content: cleanText || '(Executed operation silently)' });

    } catch (err: any) {
      addChat({ role: 'model', content: '⚠️ System Error: ' + err.message });
    } finally {
      setIsTyping(false);
    }
  };

  return { sendMessage, isTyping };
}
