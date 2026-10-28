'use client';

import React, { useState } from 'react';
import { CreditCard, Send, Sparkles, RefreshCw, ShieldCheck, Bot, User, Search, Zap } from 'lucide-react';

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
      text: "Hello. I am the PayPal Agent Assistant configured with the official PayPal Agent Toolkit. I can autonomously manage PayPal orders, verify transaction status, and execute server-side captures in the PayPal Sandbox environment.",
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
    <div className="bg-[#09090b] border border-zinc-800 rounded-2xl p-6 shadow-xl max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-100">
            <CreditCard className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-zinc-100">PayPal Agent Toolkit Assistant</h2>
              <span className="text-[10px] bg-zinc-900 text-zinc-300 font-mono px-2 py-0.5 rounded border border-zinc-800">
                Sandbox v2
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">Autonomous PayPal order creation, status inspection & capture</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-950/30 px-2.5 py-1 rounded-md border border-emerald-800/40 font-medium">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Server Verified</span>
        </div>
      </div>

      {/* Suggested Quick Prompts */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-zinc-500 text-[11px] font-medium mr-1">Directives:</span>
        <button
          onClick={() => handleSendMessage('Create an order for ₹15,499 for Sony WH-1000XM5')}
          className="bg-black hover:bg-zinc-900 text-zinc-300 hover:text-white px-2.5 py-1 rounded-lg border border-zinc-800 transition flex items-center gap-1.5 cursor-pointer"
        >
          <CreditCard className="w-3 h-3 text-zinc-400" />
          <span>Create Order (₹15,499)</span>
        </button>
        <button
          onClick={() => handleSendMessage('Check status of latest PayPal order')}
          className="bg-black hover:bg-zinc-900 text-zinc-300 hover:text-white px-2.5 py-1 rounded-lg border border-zinc-800 transition flex items-center gap-1.5 cursor-pointer"
        >
          <Search className="w-3 h-3 text-zinc-400" />
          <span>Check Order Status</span>
        </button>
        <button
          onClick={() => handleSendMessage('Capture approved PayPal order')}
          className="bg-black hover:bg-zinc-900 text-zinc-300 hover:text-white px-2.5 py-1 rounded-lg border border-zinc-800 transition flex items-center gap-1.5 cursor-pointer"
        >
          <Zap className="w-3 h-3 text-amber-400" />
          <span>Capture Payment</span>
        </button>
      </div>

      {/* Chat Messages */}
      <div className="h-80 overflow-y-auto space-y-3 p-4 bg-black rounded-xl border border-zinc-800 text-xs">
        {chat.map((c, index) => (
          <div
            key={index}
            className={`flex gap-2.5 ${c.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {c.sender === 'agent' && (
              <div className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 text-zinc-300 mt-0.5">
                <Bot className="w-3.5 h-3.5" />
              </div>
            )}

            <div className={`max-w-[80%] space-y-1.5 ${c.sender === 'user' ? 'items-end' : ''}`}>
              <div
                className={`p-3 rounded-xl leading-relaxed whitespace-pre-wrap ${
                  c.sender === 'user'
                    ? 'bg-zinc-100 text-zinc-950 font-medium'
                    : 'bg-zinc-900 text-zinc-200 border border-zinc-800'
                }`}
              >
                {c.text}
              </div>

              {c.toolCalled && (
                <div className="text-[10px] text-zinc-300 bg-zinc-900 border border-zinc-800 rounded-lg p-2 font-mono flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span>Invoked Tool: <strong className="text-white">{c.toolCalled}</strong></span>
                </div>
              )}
            </div>

            {c.sender === 'user' && (
              <div className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 text-zinc-400 mt-0.5">
                <User className="w-3.5 h-3.5" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-zinc-400 text-xs py-2">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-zinc-300" />
            <span>PayPal Agent is executing tool directive in Sandbox...</span>
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
          className="flex-1 bg-black border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-zinc-600 transition"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={!message.trim() || loading}
          className="bg-white hover:bg-zinc-200 disabled:opacity-40 text-zinc-950 font-semibold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Send</span>
        </button>
      </form>
    </div>
  );
};

export default PayPalChatInterface;
