import React from 'react';
import { RefreshCw, CheckCircle2 } from 'lucide-react';
import { formatCurrency, formatDateTime } from '@/utils/formatters';

interface OutboxAlertsListProps {
  alerts: any[];
  onRefresh: () => void;
}

export const OutboxAlertsList: React.FC<OutboxAlertsListProps> = ({ alerts, onRefresh }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold">Price Drop Outbox & Deduplicated Alerts</h2>
          <p className="text-slate-400 text-xs">
            Alerts persisted using the transactional outbox pattern to guarantee zero lost notifications.
          </p>
        </div>
        <button
          onClick={onRefresh}
          className="bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 text-slate-300"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {alerts.length === 0 ? (
        <div className="p-12 text-center text-slate-500 text-sm">
          No alerts fired yet. Once a monitored item drops to or below target, notifications appear here.
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => {
            let payload: any = {};
            try { payload = JSON.parse(alert.payload); } catch {}
            return (
              <div
                key={alert.id}
                className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="font-semibold text-sm text-slate-200">
                      {payload.productTitle || 'Price Target Achieved'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Observed Price: <strong className="text-emerald-400">{formatCurrency(payload.observedPrice)}</strong> (Target: {formatCurrency(payload.targetPrice)})
                  </p>
                  <div className="text-[10px] text-slate-500 mt-1 font-mono">
                    Deduplication Key: {alert.deduplicationKey}
                  </div>
                </div>

                <div className="text-right">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    {alert.status.toUpperCase()}
                  </span>
                  <div className="text-[10px] text-slate-500 mt-1">
                    {formatDateTime(alert.createdAt)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
