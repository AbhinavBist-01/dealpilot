import React from 'react';
import { CreditCard, CheckCircle2, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

interface PayPalModalProps {
  step: 'review' | 'paypal_sandbox' | 'completed' | 'error';
  product: any;
  order: any;
  error: string | null;
  onAuthorize: () => void;
  onClose: () => void;
}

export const PayPalModal: React.FC<PayPalModalProps> = ({
  step,
  product,
  order,
  error,
  onAuthorize,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
        {step === 'paypal_sandbox' && (
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-blue-400 font-bold text-lg">PayPal</span>
                <span className="bg-amber-500/20 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-500/30">
                  SANDBOX
                </span>
              </div>
              <span className="text-xs text-slate-400">Pre-flight Verified ✓</span>
            </div>

            <div className="space-y-3 mb-6">
              <div className="text-xs text-slate-400">
                Order ID: <code className="text-slate-300 font-mono">{order?.paypalOrderId}</code>
              </div>
              <div className="text-sm font-semibold text-slate-200">
                {product?.title}
              </div>
              <div className="flex items-center justify-between text-base font-bold bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span>Total Amount</span>
                <span className="text-emerald-400">{formatCurrency(order?.amount || 0, order?.currency)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="w-1/2 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2.5 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={onAuthorize}
                className="w-1/2 bg-[#0070ba] hover:bg-[#005ea6] text-white py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-blue-500/20 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Simulate Instant Capture</span>
              </button>
            </div>

            {order?.approveUrl && (
              <div className="mt-3 pt-3 border-t border-slate-800 text-center">
                <a
                  href={order.approveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-400 hover:text-blue-300 underline font-medium inline-flex items-center gap-1"
                >
                  <span>Or test real interactive PayPal Sandbox login page ↗</span>
                </a>
              </div>
            )}
          </div>
        )}

        {step === 'completed' && (
          <div className="text-center py-4">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-100 mb-1">Purchase Verified & Recorded!</h3>
            <p className="text-xs text-slate-400 mb-6">
              PayPal transaction captured and verified server-to-server.
            </p>
            <button
              onClick={onClose}
              className="bg-emerald-500 text-slate-950 font-bold px-6 py-2.5 rounded-xl text-xs"
            >
              Done
            </button>
          </div>
        )}

        {step === 'error' && (
          <div className="text-center py-4">
            <AlertTriangle className="w-12 h-12 text-rose-400 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-100 mb-1">Pre-Flight Revalidation Guard</h3>
            <p className="text-xs text-rose-300 mb-6">{error}</p>
            <button
              onClick={onClose}
              className="bg-slate-800 text-slate-200 font-semibold px-6 py-2.5 rounded-xl text-xs"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
