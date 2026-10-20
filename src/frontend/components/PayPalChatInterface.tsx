'use client';

import React, { useState } from 'react';
import { CreditCard, Send, Sparkles, RefreshCw, CheckCircle2, ShieldCheck, ArrowRight, Bot, User } from 'lucide-react';

interface ChatMessage {
  sender: 'user' | 'agent';
  text: string;
  toolCalled?: string;
  toolResult?: any;
}

export const PayPalChatInterface: React.FC = () => {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [chat, setChat] = useState<ChatMessage[]>([
    {
      sender: 'agent',
      text: "👋 Hello! I am your PayPal Agent Assistant powered by the PayPal Agent Toolkit. I can autonomously manage PayPal orders, verify transaction status, and execute server-side captures in the PayPal Sandbox.",
    },
  ]);

  const handleSendMessage = async (msgOverride?: string) => {
    const textToSend = msgOverride || message;
    if (!textToSend.trim() || loading) return;

    setChat((prevChat) => [...prevChat, { sender: 'user', text: textToSend }]);
    if (!msgOverride) setMessage('');
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: textToSend }),
      });
      const data = await response.json();
      setChat((prevChat) => [
        ...prevChat,
        {
          sender: 'agent',
          text: data.response || data.error || 'No response from PayPal Agent.',
          toolCalled: data.toolCalled,
          toolResult: data.toolResult,
        },
      ]);
    } catch (err: any) {
      setChat((prevChat) => [
        ...prevChat,
        { sender: 'agent', text: `Error calling PayPal Agent: ${err.message}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-100">PayPal Agent Toolkit Assistant</h2>
              <span className="text-[10px] bg-blue-500/20 text-blue-300 font-bold px-2 py-0.5 rounded-full border border-blue-500/30">
                Sandbox v2
              </span>
            </div>
            <p className="text-xs text-slate-400">Autonomous PayPal order creation, status inspection & capture</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
          <ShieldCheck className="w-4 h-4" />
          <span>Server-Side Verified</span>
        </div>
      </div>

      {/* Suggested Quick Prompts */}
      <div className="flex flex-wrap gap-2 text-xs">
        <span className="text-slate-500 py-1">Quick Actions:</span>
        <button
          onClick={() => handleSendMessage('Create an order for ₹15,499 for Sony WH-1000XM5')}
          className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1 rounded-lg border border-slate-700 transition"
        >
          💳 Create Order (₹15,499)
        </button>
        <button
          onClick={() => handleSendMessage('Check status of latest PayPal order')}
          className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1 rounded-lg border border-slate-700 transition"
        >
          🔍 Check Order Status
        </button>
        <button
          onClick={() => handleSendMessage('Capture approved PayPal order')}
          className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1 rounded-lg border border-slate-700 transition"
        >
          ⚡ Capture Payment
        </button>
      </div>

      {/* Chat Messages */}
      <div className="h-80 overflow-y-auto space-y-3 p-4 bg-slate-950/80 rounded-xl border border-slate-800 text-xs">
        {chat.map((c, index) => (
          <div
            key={index}
            className={`flex gap-2.5 ${c.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {c.sender === 'agent' && (
              <div className="w-7 h-7 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center shrink-0 text-blue-400 mt-0.5">
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div className={`max-w-[80%] space-y-1.5 ${c.sender === 'user' ? 'items-end' : ''}`}>
              <div
                className={`p-3 rounded-2xl leading-relaxed whitespace-pre-wrap ${
                  c.sender === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-none'
                    : 'bg-slate-900 text-slate-200 border border-slate-800 rounded-tl-none shadow-sm'
                }`}
              >
                {c.text}
              </div>

              {c.toolCalled && (
                <div className="text-[10px] text-blue-400 bg-blue-950/40 border border-blue-800/40 rounded-lg p-2 font-mono flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-blue-400 shrink-0" />
                  <span>Invoked Tool: <strong>{c.toolCalled}</strong></span>
                </div>
              )}
            </div>

            {c.sender === 'user' && (
              <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 text-slate-300 mt-0.5">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-slate-400 text-xs py-2">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-400" />
            <span>PayPal Agent is executing action with PayPal Agent Toolkit...</span>
          </div>
        )}
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="flex items-center gap-2"
      >
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Ask PayPal Agent (e.g. 'Create an order for ₹12,000', 'Capture payment')..."
          className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={!message.trim() || loading}
          className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition shadow-sm"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Send</span>
        </button>
      </form>
    </div>
  );
};

export default PayPalChatInterface;
