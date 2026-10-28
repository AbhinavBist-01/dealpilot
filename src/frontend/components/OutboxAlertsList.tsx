'use client';

import React, { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle2, Mail, Send, Eye, X, Sparkles, Clock, AlertCircle } from 'lucide-react';
import { formatCurrency, formatDateTime } from '../utils/formatters';
import { useAuth } from '../utils/auth-context';

interface OutboxAlertsListProps {
  alerts: any[];
  onRefresh: () => void;
}

export const OutboxAlertsList: React.FC<OutboxAlertsListProps> = ({ alerts, onRefresh }) => {
  const { session } = useAuth();
  const [testEmailSending, setTestEmailSending] = useState(false);
  const [recipientInput, setRecipientInput] = useState(session?.user?.email || 'abhinavbist05@gmail.com');
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [bannerNotice, setBannerNotice] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user?.email) {
      setRecipientInput(session.user.email);
    }
  }, [session?.user?.email]);

  const showNotice = (msg: string) => {
    setBannerNotice(msg);
    setTimeout(() => setBannerNotice(null), 4000);
  };

  const handleSendTestEmail = async () => {
    setTestEmailSending(true);
    try {
      const res = await fetch('/api/notifications/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient: recipientInput,
          currentPrice: 15499,
          targetPrice: 18000,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showNotice(`Price drop alert email dispatched to ${recipientInput}! (Message ID: ${data.result?.messageId})`);
        onRefresh();
      } else {
        showNotice(`Email error: ${data.error}`);
      }
    } catch (err: any) {
      showNotice(`Failed to send email: ${err.message}`);
    } finally {
      setTestEmailSending(false);
    }
  };

  const handlePreviewEmail = async (alert?: any) => {
    try {
      let targetPrice = 18000;
      let currentPrice = 15499;
      if (alert) {
        try {
          const payload = typeof alert.payload === 'string' ? JSON.parse(alert.payload) : alert.payload;
          targetPrice = payload.targetPrice || 18000;
          currentPrice = payload.observedPrice || 15499;
        } catch {}
      }

      const res = await fetch('/api/notifications/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          previewOnly: true,
          recipient: recipientInput,
          targetPrice,
          currentPrice,
        }),
      });
      const data = await res.json();
      if (data.html) {
        setPreviewHtml(data.html);
      }
    } catch (err: any) {
      showNotice(`Preview generation failed: ${err.message}`);
    }
  };

  return (
    <div className="bg-[#09090b] border border-zinc-850 rounded-xl p-6 shadow-xl space-y-6 font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-850 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-mono uppercase text-emerald-400 tracking-wider font-semibold">
              Instant Email Delivery
            </span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Price Drop Notifications
          </h2>
          <p className="text-zinc-400 text-xs mt-1">
            Real-time notifications sent to your email with instant price drop confirmations and savings breakdowns.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handlePreviewEmail()}
            className="bg-zinc-900 hover:bg-zinc-850 px-3 py-1.5 rounded-lg text-xs font-mono flex items-center gap-1.5 text-zinc-300 border border-zinc-800 transition-colors cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 text-zinc-400" />
            <span>Preview Email</span>
          </button>
          <button
            onClick={onRefresh}
            className="bg-zinc-900 hover:bg-zinc-850 px-3 py-1.5 rounded-lg text-xs font-mono flex items-center gap-1.5 text-zinc-300 border border-zinc-800 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {bannerNotice && (
        <div className="p-3 bg-zinc-900 border border-emerald-500/40 rounded-lg text-xs font-mono text-emerald-300 flex items-center gap-2 animate-fade-in-up">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>{bannerNotice}</span>
        </div>
      )}

      {/* Test Email Dispatch Sandbox Bar */}
      <div className="p-4 bg-black border border-zinc-850 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300 shrink-0">
            <Mail className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-semibold text-zinc-200">Test Price-Drop Dispatch</div>
            <div className="text-[11px] text-zinc-500 font-mono">Simulate a live HTML alert dispatched to authenticated email</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="email"
            value={recipientInput}
            onChange={(e) => setRecipientInput(e.target.value)}
            placeholder="Recipient email address"
            className="bg-[#0e0e11] border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-200 font-mono focus:outline-none focus:border-zinc-600 w-56"
          />
          <button
            onClick={handleSendTestEmail}
            disabled={testEmailSending}
            className="bg-zinc-100 hover:bg-white disabled:opacity-50 text-black font-semibold px-3.5 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
          >
            {testEmailSending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            <span>Dispatch Test</span>
          </button>
        </div>
      </div>

      {/* Outbox Alerts List */}
      {alerts.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-zinc-850 rounded-lg space-y-2">
          <Mail className="w-8 h-8 text-zinc-600 mx-auto" />
          <div className="text-xs font-semibold text-zinc-300">No price drop alerts yet</div>
          <p className="text-[11px] text-zinc-500 max-w-sm mx-auto">
            When a tracked deal drops to your target price, notifications will appear here and deliver to your inbox.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => {
            let payload: any = {};
            try {
              payload = typeof alert.payload === 'string' ? JSON.parse(alert.payload) : (alert.payload || {});
            } catch {
              payload = {};
            }

            const isSent = alert.status === 'sent';
            const observedPrice = payload.observedPrice ?? payload.currentPrice ?? payload.price ?? 0;
            const targetPrice = payload.targetPrice ?? payload.target ?? 0;
            const currency = payload.currency || 'INR';
            const savings = payload.savings ?? ((targetPrice > observedPrice) ? targetPrice - observedPrice : 0);

            return (
              <div
                key={alert.id}
                className="bg-black border border-zinc-850 rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-zinc-800 transition-colors"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="font-semibold text-sm text-zinc-200">
                      {payload.productTitle || 'Price Target Achieved'}
                    </span>
                    <span className="text-[10px] font-mono bg-zinc-900 text-zinc-400 px-2 py-0.5 rounded border border-zinc-850">
                      {alert.eventType}
                    </span>
                  </div>

                  <div className="text-xs font-mono text-zinc-300 flex flex-wrap items-center gap-2">
                    <span>
                      Observed: <strong className="text-emerald-400 tabular-nums">{formatCurrency(observedPrice, currency)}</strong>
                    </span>
                    <span className="text-zinc-600">·</span>
                    <span className="text-zinc-400">
                      Target: {formatCurrency(targetPrice, currency)}
                    </span>
                    <span className="text-zinc-600">·</span>
                    <span className="text-emerald-400 font-semibold">
                      Save {formatCurrency(savings, currency)}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-[11px] font-mono text-zinc-500">
                    <span className="flex items-center gap-1 text-zinc-400">
                      <Mail className="w-3 h-3 text-zinc-500" />
                      <span>{alert.trackingRule?.user?.email || recipientInput}</span>
                    </span>
                    <span>·</span>
                    <span className="truncate max-w-[280px]">
                      Dedup: {alert.deduplicationKey?.slice(0, 36)}...
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 justify-between md:justify-end">
                  <button
                    onClick={() => handlePreviewEmail(alert)}
                    className="p-1.5 bg-zinc-900 hover:bg-zinc-850 text-zinc-300 hover:text-white rounded-lg text-xs font-mono flex items-center gap-1 border border-zinc-800 transition-colors cursor-pointer"
                    title="View exact generated HTML email"
                  >
                    <Eye className="w-3.5 h-3.5 text-zinc-400" />
                    <span>View HTML</span>
                  </button>

                  <div className="text-right">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase inline-flex items-center gap-1 ${
                        isSent
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25'
                          : 'bg-zinc-900 text-amber-400 border border-amber-600/30'
                      }`}
                    >
                      {isSent ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                      <span>{isSent ? 'EMAIL SENT' : 'PENDING'}</span>
                    </span>
                    <div className="text-[10px] font-mono text-zinc-500 mt-1">
                      {formatDateTime(alert.processedAt || alert.createdAt)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* HTML Email Modal Preview */}
      {previewHtml && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in-up">
          <div className="bg-[#09090b] border border-zinc-800 rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 bg-black border-b border-zinc-850 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-white text-xs font-mono">
                  HTML EMAIL PREVIEW — TRANSACTIONAL TEMPLATE
                </span>
              </div>
              <button
                onClick={() => setPreviewHtml(null)}
                className="p-1 text-zinc-400 hover:text-white rounded hover:bg-zinc-900 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 bg-black">
              <div
                className="bg-transparent rounded-lg overflow-hidden"
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            </div>

            <div className="p-3 bg-black border-t border-zinc-850 flex items-center justify-between text-xs text-zinc-500 font-mono">
              <span>Dispatched via transactional worker directly to verified inbox.</span>
              <button
                onClick={() => setPreviewHtml(null)}
                className="px-3 py-1 bg-zinc-900 hover:bg-zinc-850 text-zinc-200 font-semibold text-xs rounded border border-zinc-800 transition-colors cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
