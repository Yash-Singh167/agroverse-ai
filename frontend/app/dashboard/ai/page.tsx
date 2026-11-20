'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  User, 
  Trash2, 
  Copy, 
  Check, 
  Sparkles, 
  Droplets, 
  Thermometer, 
  Wind, 
  Power, 
  RotateCcw,
  Sliders,
  ShieldCheck,
  Cpu
} from 'lucide-react';
import { useTelemetry } from '@/hooks/useTelemetry';
import { generateAgroAIResponse } from '@/lib/agroAiEngine';
import { AIChatApiResponse, AIChatMessage } from '@/lib/types';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

const SUGGESTED_QUERIES = [
  'Does my farm need irrigation?',
  'What is the current soil condition?',
  'Why is my pump currently running?',
  'Analyze the temperature and humidity.',
  'How much water did my system use today?',
  'Give me recommendations to save water.',
  'What should you know about my crop?',
];

function createWelcomeMessage(profileIsSet: boolean, id = 'msg_welcome'): AIChatMessage {
  return {
    id,
    role: 'assistant',
    content: `Hello! I am **Agro AI**, your precision agricultural consultant.

${profileIsSet
  ? 'I have your saved **Crop & Cultivation Profile** and will use it with your sensor readings. You can update it from the Command Center.'
  : 'Before we begin, **what crop are you growing, what growth stage is it in, and how are you cultivating it** (for example: tomato · flowering · greenhouse drip)? Add those details in the Crop & Cultivation Profile on your Command Center so I can keep them in context.'}

I am also connected to your farm's **live telemetry**:
* **Soil Moisture:** Loaded live
* **Climate Probes:** Ambient Temperature & Humidity
* **Actuator Hardware:** Solenoid pump relay status

You can ask me questions about your crop, soil conditions, irrigation, microclimate, or water efficiency.`,
    timestamp: new Date().toISOString(),
  };
}

export default function AIAssistantPage() {
  const { summary, history, prediction, farmProfile } = useTelemetry();
  const profileIsSet = Boolean(
    farmProfile.crop || farmProfile.growth_stage || farmProfile.cultivation_method
  );
  const [messages, setMessages] = useState<AIChatMessage[]>(() => [
    createWelcomeMessage(profileIsSet),
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    setMessages((current) => (
      current.length === 1 && current[0].id.startsWith('msg_welcome')
        ? [createWelcomeMessage(profileIsSet, current[0].id)]
        : current
    ));
  }, [profileIsSet]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputValue;
    if (!text.trim()) return;

    const userMsg: AIChatMessage = {
      id: 'usr_' + Date.now(),
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
      context_snapshot: {
        soil_moisture: summary.soil_moisture.current,
        temperature: summary.temperature.current,
        humidity: summary.humidity.current,
        pump: summary.pump.state,
        is_live: true,
      },
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    try {
      const conversationHistory = messages
        .filter((message) => message.role === 'user' || message.role === 'assistant')
        .slice(-12)
        .map((message) => ({
          role: message.role === 'assistant' ? 'model' : 'user',
          content: message.content,
        }));
      const res = await fetch(`${API_BASE}/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          device_id: 'AGRO_001',
          user_id: 'farmer_1',
          farm_context: {
            soil_moisture: summary.soil_moisture.current,
            temperature: summary.temperature.current,
            humidity: summary.humidity.current,
            pump: summary.pump.state,
            mode: summary.pump.mode,
            threshold_low: summary.soil_moisture.threshold_low,
            threshold_high: summary.soil_moisture.threshold_high,
            crop: farmProfile.crop,
            growth_stage: farmProfile.growth_stage,
            cultivation_method: farmProfile.cultivation_method,
            soil_type: farmProfile.soil_type,
          },
          conversation_history: conversationHistory,
        }),
        signal: AbortSignal.timeout(95000),
      });

      if (!res.ok) {
        const errorBody: { detail?: unknown } = await res.json();
        const detail = typeof errorBody.detail === 'string'
          ? errorBody.detail
          : `AI request failed with status ${res.status}.`;
        throw new Error(detail);
      }

      const data: AIChatApiResponse = await res.json();
      if (typeof data.reply !== 'string' || typeof data.model !== 'string') {
        throw new Error('The AI service returned an invalid response.');
      }
      const replyContent = data.model === 'agroverse-edge-ai-v1'
        ? generateAgroAIResponse(text, {
          summary,
          history,
          prediction,
          farmProfile,
        })
        : data.reply;

      const aiMsg: AIChatMessage = {
        id: data.id || ('ai_' + Date.now()),
        role: 'assistant',
        content: replyContent,
        timestamp: new Date().toISOString(),
        model: data.model,
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'Unexpected error.';
      const aiMsg: AIChatMessage = {
        id: 'ai_error_' + Date.now(),
        role: 'assistant',
        content: `**Agro AI request failed.** ${detail}\n\nCheck that the backend is running and that its Gemini configuration is valid.`,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClear = () => {
    setMessages([
      createWelcomeMessage(profileIsSet, 'msg_welcome_' + Date.now()),
    ]);
  };

  // Simple Markdown parser for clean styling
  const renderFormattedMarkdown = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      if (line.startsWith('### ')) {
        return <h3 key={idx} className="text-sm font-bold text-emerald-300 mt-2 mb-1">{line.replace('### ', '')}</h3>;
      }
      if (line.startsWith('#### ')) {
        return <h4 key={idx} className="text-xs font-semibold text-zinc-200 uppercase tracking-wider font-mono mt-2 mb-1">{line.replace('#### ', '')}</h4>;
      }
      if (line.startsWith('> ')) {
        return (
          <blockquote key={idx} className="border-l-2 border-emerald-500 pl-3 my-2 text-xs italic text-emerald-200/90 bg-emerald-500/5 py-1 rounded-r">
            {line.replace('> ', '')}
          </blockquote>
        );
      }
      if (line.startsWith('* ') || line.startsWith('- ')) {
        return (
          <li key={idx} className="text-xs text-zinc-300 ml-4 list-disc my-0.5">
            <span dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(line.substring(2)) }} />
          </li>
        );
      }
      if (line.trim() === '') {
        return <div key={idx} className="h-1.5" />;
      }
      return (
        <p key={idx} className="text-xs text-zinc-300 leading-relaxed my-0.5" dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(line) }} />
      );
    });
  };

  const formatInlineMarkdown = (str: string) => {
    return str
      .replace(/[&<>"']/g, (character) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      })[character] || character)
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
      .replace(/`(.*?)`/g, '<code class="px-1 py-0.5 rounded bg-black/40 text-emerald-400 font-mono text-[11px] border border-white/[0.08]">$1</code>');
  };

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-6.5rem)] flex flex-col gap-4">
      {/* Top Telemetry Synchronizer Header */}
      <div className="p-4 rounded-2xl bg-[#0d1510]/80 border border-white/[0.08] backdrop-blur-md flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shadow-glow">
            <Bot className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-white tracking-tight">Agro AI Consultant</h1>
              <span className="px-2 py-0.5 text-[9px] font-mono uppercase bg-emerald-500/20 text-emerald-300 rounded border border-emerald-500/30">
                Ground Truth Sync
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">
              Ask about crop cultivation, and enter your own sensor readings in the Command Center.
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px]">
              <span className="text-zinc-500">
                Crop profile: <strong className="text-emerald-300">{farmProfile.crop || 'not set'}</strong>
                {farmProfile.growth_stage ? ` · ${farmProfile.growth_stage}` : ''}
                {farmProfile.cultivation_method ? ` · ${farmProfile.cultivation_method}` : ''}
              </span>
              <Link href="/dashboard" className="text-emerald-400 hover:text-emerald-300 underline underline-offset-2">
                Set profile &amp; feed readings
              </Link>
            </div>
          </div>
        </div>

        {/* Live Context Indicators */}
        <div className="flex items-center gap-2 flex-wrap text-xs font-mono">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/40 border border-white/[0.06]">
            <Droplets className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-zinc-400">Moisture:</span>
            <span className="text-white font-bold">{summary.soil_moisture.current}%</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/40 border border-white/[0.06]">
            <Thermometer className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-zinc-400">Temp:</span>
            <span className="text-white font-bold">{summary.temperature.current}°C</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/40 border border-white/[0.06]">
            <Wind className="w-3.5 h-3.5 text-teal-400" />
            <span className="text-zinc-400">RH:</span>
            <span className="text-white font-bold">{summary.humidity.current}%</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/40 border border-white/[0.06]">
            <Power className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-zinc-400">Pump:</span>
            <span className={cn('font-bold', summary.pump.state ? 'text-emerald-400' : 'text-zinc-500')}>
              {summary.pump.state ? 'ACTIVE' : 'IDLE'}
            </span>
          </div>

          <button
            onClick={handleClear}
            className="p-1.5 rounded-lg bg-white/[0.03] hover:bg-red-500/10 text-zinc-400 hover:text-red-400 border border-white/[0.06] transition-colors"
            title="Clear Chat History"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Chat Conversation Container */}
      <div className="flex-1 rounded-2xl bg-[#090e0b]/90 border border-white/[0.08] backdrop-blur-md flex flex-col overflow-hidden relative">
        {/* Messages Scroll Area */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={cn('flex gap-3 max-w-3xl', isUser ? 'ml-auto flex-row-reverse' : 'mr-auto')}
              >
                {/* Avatar */}
                <div className={cn(
                  'w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border text-xs font-bold',
                  isUser 
                    ? 'bg-emerald-600 border-emerald-500 text-white' 
                    : 'bg-[#101b14] border-emerald-500/30 text-emerald-400 shadow-glow'
                )}>
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                {/* Message Bubble */}
                <div className={cn(
                  'rounded-2xl p-4 text-xs transition-all relative group',
                  isUser
                    ? 'bg-emerald-700/80 text-white border border-emerald-500/40 rounded-tr-sm'
                    : 'bg-[#111c15] text-zinc-200 border border-white/[0.08] rounded-tl-sm shadow-xl'
                )}>
                  {/* Message Content */}
                  <div>
                    {isUser ? (
                      <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    ) : (
                      renderFormattedMarkdown(msg.content)
                    )}
                  </div>

                  {/* Context Snapshot Tag if present */}
                  {msg.context_snapshot && (
                    <div className="mt-2.5 pt-2 border-t border-white/[0.1] text-[10px] font-mono text-emerald-200/70 flex items-center gap-2">
                      <span>Snapshot: {msg.context_snapshot.soil_moisture}% moisture · {msg.context_snapshot.temperature}°C · Pump {msg.context_snapshot.pump ? 'ON' : 'OFF'}</span>
                    </div>
                  )}

                  {/* Message Bottom Toolbar for AI answers */}
                  {!isUser && (
                    <div className="mt-3 pt-2 border-t border-white/[0.05] flex items-center justify-between text-[10px] font-mono text-zinc-500">
                      <span>{msg.model || 'AgroVerse AI Hydrology Model'}</span>
                      <button
                        onClick={() => handleCopy(msg.id, msg.content)}
                        className="flex items-center gap-1 hover:text-emerald-400 transition-colors"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy Answer</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Typing Animation */}
          {isTyping && (
            <div className="flex gap-3 max-w-xl mr-auto">
              <div className="w-8 h-8 rounded-xl bg-[#101b14] border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-3.5 rounded-2xl bg-[#111c15] border border-white/[0.08] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                <span className="text-[11px] text-zinc-400 font-mono ml-2">Consulting sensor dynamics...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Queries Chips */}
        <div className="px-4 py-2 border-t border-white/[0.05] bg-[#070b08]/60 overflow-x-auto flex items-center gap-2 select-none no-scrollbar">
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider shrink-0 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-emerald-400" /> Prompt:
          </span>
          {SUGGESTED_QUERIES.map((query, i) => (
            <button
              key={i}
              onClick={() => handleSendMessage(query)}
              className="px-2.5 py-1 rounded-full bg-white/[0.03] hover:bg-emerald-500/10 border border-white/[0.08] hover:border-emerald-500/30 text-zinc-300 hover:text-emerald-300 text-[11px] font-mono shrink-0 transition-colors"
            >
              {query}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 border-t border-white/[0.08] bg-[#080d0a]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask Agro AI (e.g. 'Does my farm need water?', 'Why is moisture 18%?')"
              className="flex-1 bg-[#111a14] border border-white/[0.08] focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-zinc-100 placeholder:text-zinc-500 transition-all outline-none font-sans"
            />

            <button
              type="submit"
              disabled={!inputValue.trim() || isTyping}
              className="p-2.5 sm:px-4 sm:py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white text-xs font-medium shadow-glow transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Ask Agro AI</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
