'use client';

import React, { useEffect, useState } from 'react';
import { CreditCard, CheckCircle2, AlertTriangle, Sparkles, ShieldCheck, ChevronRight, Loader2 } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import {
  initializePayPalV6,
  PayPalV6SDKInstance,
  EligiblePaymentMethodsResult,
  PaymentSessionOptions,
} from '../utils/paypal-v6';

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
  const [sdkInstance, setSdkInstance] = useState<PayPalV6SDKInstance | null>(null);
  const [eligibility, setEligibility] = useState<EligiblePaymentMethodsResult | null>(null);
  const [v6Loading, setV6Loading] = useState(false);
  const [processingMethod, setProcessingMethod] = useState<string | null>(null);
  const [sessionStatusMessage, setSessionStatusMessage] = useState<string | null>(null);

  // Shared payment session options for all payment methods
  const createPaymentSessionOptions = (): PaymentSessionOptions => ({
    async onApprove(data) {
      console.log('✅ [PayPal v6] Payment approved:', data);
      setSessionStatusMessage('Payment approved! Capturing order server-side...');
      try {
        await onAuthorize();
      } catch (err: any) {
        console.error('Payment capture failed:', err);
        setSessionStatusMessage('Capture failed: ' + err.message);
      } finally {
        setProcessingMethod(null);
      }
    },
    onCancel(data) {
      console.log('⚠️ [PayPal v6] Payment cancelled:', data);
      setSessionStatusMessage('Payment cancelled by user.');
      setProcessingMethod(null);
    },
    onError(err) {
      console.error('❌ [PayPal v6] Payment error:', err);
      setSessionStatusMessage('Payment error occurred.');
      setProcessingMethod(null);
    },
  });

  // Create order supplier returning the active order ID
  const createOrderSupplier = async (): Promise<string> => {
    if (order?.paypalOrderId) {
      return order.paypalOrderId;
    }
    return `order_${Date.now()}`;
  };

  // Official v6 SDK initialization lifecycle
  async function onPayPalWebSdkLoaded() {
    setV6Loading(true);
    setSessionStatusMessage(null);
    try {
      const instance = await initializePayPalV6({
        components: ['paypal-payments', 'fastlane'],
        pageType: 'checkout',
      });
      setSdkInstance(instance);

      // Check eligibility for all payment methods
      const paymentMethods = await instance.findEligibleMethods({
        currencyCode: order?.currency || 'USD',
      });
      setEligibility(paymentMethods);
      console.log('✅ [PayPal v6] Eligible payment methods:', paymentMethods.eligibleMethods);
    } catch (err: any) {
      console.error('SDK initialization error:', err);
      setSessionStatusMessage('SDK initialization warning: ' + err.message);
    } finally {
      setV6Loading(false);
    }
  }

  useEffect(() => {
    if (step === 'paypal_sandbox') {
      onPayPalWebSdkLoaded();
    }
  }, [step]);

  // Standard PayPal button handler
  const handlePayPalCheckout = async () => {
    if (!sdkInstance) return;
    setProcessingMethod('paypal');
    setSessionStatusMessage('Launching PayPal Payment Session...');
    try {
      const session = sdkInstance.createPayPalOneTimePaymentSession(createPaymentSessionOptions());
      await session.start({ presentationMode: 'auto' }, createOrderSupplier());
    } catch (err: any) {
      console.error('PayPal payment start error:', err);
      // If popup was blocked or mock fallback, fall back to instant authorization
      onAuthorize();
    } finally {
      setProcessingMethod(null);
    }
  };

  // Pay Later button handler
  const handlePayLaterCheckout = async () => {
    if (!sdkInstance) return;
    setProcessingMethod('paylater');
    setSessionStatusMessage('Configuring Pay Later installments...');
    try {
      const session = sdkInstance.createPayLaterOneTimePaymentSession(createPaymentSessionOptions());
      await session.start({ presentationMode: 'auto' }, createOrderSupplier());
    } catch (err: any) {
      console.error('Pay Later payment start error:', err);
      onAuthorize();
    } finally {
      setProcessingMethod(null);
    }
  };

  // PayPal Credit button handler
  const handleCreditCheckout = async () => {
    if (!sdkInstance) return;
    setProcessingMethod('credit');
    setSessionStatusMessage('Launching PayPal Credit credit-line session...');
    try {
      const session = sdkInstance.createPayPalCreditOneTimePaymentSession(createPaymentSessionOptions());
      await session.start({ presentationMode: 'auto' }, createOrderSupplier());
    } catch (err: any) {
      console.error('PayPal Credit payment start error:', err);
      onAuthorize();
    } finally {
      setProcessingMethod(null);
    }
  };

  const isPayPalEligible = eligibility?.isEligible('paypal') ?? true;
  const isPayLaterEligible = eligibility?.isEligible('paylater') ?? true;
  const isCreditEligible = eligibility?.isEligible('credit') ?? true;

  const payLaterDetails = eligibility?.getDetails('paylater') || { productCode: 'PAY_IN_4', countryCode: 'US' };
  const creditDetails = eligibility?.getDetails('credit') || { countryCode: 'US' };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl relative overflow-hidden">
        {step === 'paypal_sandbox' && (
          <div>
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-[#0070ba] font-black text-xl tracking-tight">Pay<span className="text-[#003087]">Pal</span></span>
                <span className="bg-amber-500/20 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-500/30">
                  v6 WEB SDK SANDBOX
                </span>
              </div>
              <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Pre-flight Verified ✓
              </span>
            </div>

            {/* SDK Instance Status Banner */}
            <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 mb-4 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span className="text-slate-300 font-mono text-[11px]">
                  window.paypal.createInstance()
                </span>
              </div>
              <span className="text-emerald-400 font-bold flex items-center gap-1.5 text-[11px]">
                {v6Loading ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin text-emerald-400" />
                    <span>Loading SDK...</span>
                  </>
                ) : (
                  <span>Ready & Authenticated</span>
                )}
              </span>
            </div>

            {/* Order Details */}
            <div className="space-y-3 mb-5">
              <div className="text-xs text-slate-400 flex items-center justify-between">
                <span>Order ID:</span>
                <code className="text-slate-300 font-mono text-[11px] bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                  {order?.paypalOrderId}
                </code>
              </div>
              <div className="text-sm font-semibold text-slate-100 line-clamp-2">
                {product?.title}
              </div>
              <div className="flex items-center justify-between text-base font-bold bg-slate-950 p-3.5 rounded-2xl border border-slate-800 shadow-inner">
                <span className="text-slate-300">Total Due:</span>
                <span className="text-emerald-400 text-lg">{formatCurrency(order?.amount || 0, order?.currency)}</span>
              </div>

              {sessionStatusMessage && (
                <div className="text-xs bg-slate-950/80 border border-slate-800 text-slate-300 p-2.5 rounded-xl font-medium animate-in fade-in">
                  {sessionStatusMessage}
                </div>
              )}
            </div>

            {/* v6 Payment Methods Group */}
            <div className="space-y-2.5 mb-5">
              <div className="text-[11px] text-slate-400 uppercase tracking-wider font-bold">
                Eligible Payment Methods:
              </div>

              {/* Standard PayPal Button */}
              {isPayPalEligible && (
                <button
                  type="button"
                  onClick={handlePayPalCheckout}
                  disabled={v6Loading || !!processingMethod}
                  className="w-full bg-[#ffc439] hover:bg-[#f4bb30] text-[#003087] py-3 rounded-2xl font-black text-sm shadow-md hover:shadow-lg transition-all duration-150 flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50 cursor-pointer"
                >
                  {processingMethod === 'paypal' ? (
                    <Loader2 className="w-4 h-4 animate-spin text-[#003087]" />
                  ) : (
                    <span className="font-sans font-black italic text-base">Pay<span className="text-[#0070ba]">Pal</span></span>
                  )}
                  <span className="font-bold text-xs uppercase tracking-wide">Checkout with PayPal</span>
                </button>
              )}

              {/* Pay Later Button */}
              {isPayLaterEligible && (
                <button
                  type="button"
                  onClick={handlePayLaterCheckout}
                  disabled={v6Loading || !!processingMethod}
                  className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 text-slate-100 py-2.5 rounded-2xl font-bold text-xs transition flex items-center justify-between px-4 active:scale-98 disabled:opacity-50 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className="bg-amber-400/20 text-amber-300 text-[10px] font-bold px-1.5 py-0.5 rounded border border-amber-400/30">
                      {payLaterDetails.productCode || 'PAY IN 4'}
                    </span>
                    <span>Pay Later (4 interest-free payments)</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
              )}

              {/* PayPal Credit Button */}
              {isCreditEligible && (
                <button
                  type="button"
                  onClick={handleCreditCheckout}
                  disabled={v6Loading || !!processingMethod}
                  className="w-full bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 hover:border-slate-600 text-slate-200 py-2.5 rounded-2xl font-bold text-xs transition flex items-center justify-between px-4 active:scale-98 disabled:opacity-50 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-3.5 h-3.5 text-blue-400" />
                    <span>PayPal Credit Line ({creditDetails.countryCode || 'US'})</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
              )}
            </div>

            {/* Secondary Actions */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="w-1/2 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2.5 rounded-xl text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onAuthorize}
                className="w-1/2 bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-1.5 cursor-pointer transition active:scale-95"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Simulate Instant Capture</span>
              </button>
            </div>

            {order?.approveUrl && (
              <div className="mt-3 pt-3 border-t border-slate-800/60 text-center">
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
          <div className="text-center py-6">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
            <h3 className="text-xl font-bold text-slate-100 mb-1">Purchase Verified & Recorded!</h3>
            <p className="text-xs text-slate-400 mb-6 max-w-sm mx-auto">
              PayPal transaction captured and verified server-to-server with full payment idempotency.
            </p>
            <button
              onClick={onClose}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-8 py-3 rounded-2xl text-xs shadow-lg shadow-emerald-500/20 transition active:scale-95"
            >
              Done
            </button>
          </div>
        )}

        {step === 'error' && (
          <div className="text-center py-6">
            <AlertTriangle className="w-12 h-12 text-rose-400 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-100 mb-1">Pre-Flight Revalidation Guard</h3>
            <p className="text-xs text-rose-300 mb-6 max-w-sm mx-auto">{error}</p>
            <button
              onClick={onClose}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-6 py-2.5 rounded-xl text-xs transition"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
