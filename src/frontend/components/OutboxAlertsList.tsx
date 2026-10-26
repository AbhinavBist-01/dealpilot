'use client';

import React, { useState } from 'react';
import { RefreshCw, CheckCircle2, Mail, Send, Eye, X, Sparkles, Clock, AlertCircle } from 'lucide-react';
import { formatCurrency, formatDateTime } from '../utils/formatters';

interface OutboxAlertsListProps {
  alerts: any[];
  onRefresh: () => void;
}

export const OutboxAlertsList: React.FC<OutboxAlertsListProps> = ({ alerts, onRefresh }) => {
  const [testEmailSending, setTestEmailSending] = useState(false);
  const [recipientInput, setRecipientInput] = useState('shopper@dealpilot.ai');
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [bannerNotice, setBannerNotice] = useState<string | null>(null);

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
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold">Email Notification Service & Transactional Outbox</h2>
            <span className="text-[10px] bg-indigo-950 text-indigo-300 px-2 py-0.5 rounded-full font-bold border border-indigo-700/60">
              Live Dispatcher
            </span>
          </div>
          <p className="text-slate-400 text-xs mt-1">
            Persisted via transactional outbox pattern to guarantee zero lost notifications. Sends styled HTML alerts upon price drop.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handlePreviewEmail()}
            className="bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 text-slate-300 border border-slate-700 transition"
            title="Preview generated email HTML"
          >
            <Eye className="w-3.5 h-3.5 text-indigo-400" />
            <span>Preview Email Template</span>
          </button>
          <button
            onClick={onRefresh}
            className="bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 text-slate-300 border border-slate-700 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {bannerNotice && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-700/80 rounded-xl text-xs text-emerald-300 flex items-center gap-2 animate-in fade-in duration-200">
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{bannerNotice}</span>
        </div>
      )}

      {/* Test Email Dispatch Sandbox Bar */}
      <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <Mail className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-200">Trigger Real-Time Email Dispatch</div>
            <div className="text-[11px] text-slate-400">Dispatch a live price drop notification to your inbox</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="email"
            value={recipientInput}
            onChange={(e) => setRecipientInput(e.target.value)}
            placeholder="Recipient email address"
            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 w-56"
          />
          <button
            onClick={handleSendTestEmail}
            disabled={testEmailSending}
            className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold px-3.5 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition shadow-sm"
          >
            {testEmailSending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            <span>Send Alert Email</span>
          </button>
        </div>
      </div>

      {/* Outbox Alerts List */}
      {alerts.length === 0 ? (
        <div className="p-12 text-center text-slate-500 text-sm bg-slate-950/40 rounded-xl border border-slate-800/60">
          No alerts fired yet. Once a monitored item drops to or below target, notifications are persisted in outbox and dispatched via email.
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
                className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-slate-700 transition"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="font-semibold text-sm text-slate-200">
                      {payload.productTitle || 'Price Target Achieved'}
                    </span>
                    <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                      {alert.eventType}
                    </span>
                  </div>

                  <div className="text-xs text-slate-300 flex flex-wrap items-center gap-2">
                    <span>
                      Observed Price:{' '}
                      <strong className="text-emerald-400">{formatCurrency(observedPrice, currency)}</strong>
                    </span>
                    <span className="text-slate-500">·</span>
                    <span className="text-slate-400">
                      Target: {formatCurrency(targetPrice, currency)}
                    </span>
                    <span className="text-slate-500">·</span>
                    <span className="text-emerald-400 font-semibold">
                      Save {formatCurrency(savings, currency)}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1 text-indigo-300 font-medium">
                      <Mail className="w-3 h-3 text-indigo-400" />
                      <span>Email: {alert.trackingRule?.user?.email || recipientInput}</span>
                    </span>
                    <span>·</span>
                    <span className="font-mono text-[10px] text-slate-500">
                      Deduplication Key: {alert.deduplicationKey?.slice(0, 36)}...
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 justify-between md:justify-end">
                  <button
                    onClick={() => handlePreviewEmail(alert)}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs flex items-center gap-1 border border-slate-700 transition"
                    title="View exact generated HTML email"
                  >
                    <Eye className="w-3.5 h-3.5 text-indigo-400" />
                    <span>View Email</span>
                  </button>

                  <div className="text-right">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-semibold inline-flex items-center gap-1 ${
                        isSent
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {isSent ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                      <span>{isSent ? 'EMAIL SENT' : 'PENDING'}</span>
                    </span>
                    <div className="text-[10px] text-slate-500 mt-1">
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
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-slate-100 text-sm">HTML Email Preview — DealPilot Notification</span>
              </div>
              <button
                onClick={() => setPreviewHtml(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 bg-slate-950">
              <div
                className="bg-transparent rounded-xl overflow-hidden"
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            </div>

            <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>This email is dispatched via Resend or local transactional dispatcher upon price drop.</span>
              <button
                onClick={() => setPreviewHtml(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg transition"
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
