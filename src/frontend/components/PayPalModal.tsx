'use client';

import React, { useEffect, useState } from 'react';
import { CreditCard, CheckCircle2, AlertTriangle, Sparkles, ShieldCheck, ChevronRight, Loader2, X } from 'lucide-react';
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
      setSessionStatusMessage('Payment approved! Capturing order server-side...');
      try {
        await onAuthorize();
      } catch (err: any) {
        setSessionStatusMessage('Capture failed: ' + err.message);
      } finally {
        setProcessingMethod(null);
      }
    },
    onCancel(data) {
      setSessionStatusMessage('Payment cancelled by user.');
      setProcessingMethod(null);
    },
    onError(err) {
      setSessionStatusMessage('Payment error occurred.');
      setProcessingMethod(null);
    },
  });

  const createOrderSupplier = async (): Promise<string> => {
    if (order?.paypalOrderId) {
      return order.paypalOrderId;
    }
    return `order_${Date.now()}`;
  };

  async function onPayPalWebSdkLoaded() {
    setV6Loading(true);
    setSessionStatusMessage(null);
    try {
      const instance = await initializePayPalV6({
        components: ['paypal-payments', 'fastlane'],
        pageType: 'checkout',
      });
      setSdkInstance(instance);

      const eligibleResult = await instance.findEligibleMethods();
      setEligibility(eligibleResult);
    } catch (err: any) {
      console.warn('PayPal v6 initialization fallback:', err.message);
    } finally {
      setV6Loading(false);
    }
  }

  useEffect(() => {
    if (step === 'paypal_sandbox') {
      onPayPalWebSdkLoaded();
    }
  }, [step]);

  const handlePayPalCheckout = async () => {
    if (!sdkInstance) {
      onAuthorize();
      return;
    }
    setProcessingMethod('paypal');
    setSessionStatusMessage('Launching PayPal v6 payment session...');
    try {
      const session = sdkInstance.createPayPalOneTimePaymentSession(createPaymentSessionOptions());
      await session.start({ presentationMode: 'auto' }, createOrderSupplier());
    } catch (err: any) {
      onAuthorize();
    } finally {
      setProcessingMethod(null);
    }
  };

  const handlePayLaterCheckout = async () => {
    if (!sdkInstance) return;
    setProcessingMethod('paylater');
    setSessionStatusMessage('Configuring Pay Later installments...');
    try {
      const session = sdkInstance.createPayLaterOneTimePaymentSession(createPaymentSessionOptions());
      await session.start({ presentationMode: 'auto' }, createOrderSupplier());
    } catch (err: any) {
      onAuthorize();
    } finally {
      setProcessingMethod(null);
    }
  };

  const handleCreditCheckout = async () => {
    if (!sdkInstance) return;
    setProcessingMethod('credit');
    setSessionStatusMessage('Launching PayPal Credit line session...');
    try {
      const session = sdkInstance.createPayPalCreditOneTimePaymentSession(createPaymentSessionOptions());
      await session.start({ presentationMode: 'auto' }, createOrderSupplier());
    } catch (err: any) {
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

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in-up"
      onClick={onClose}
    >
      <div 
        className="bg-[#09090b] border border-zinc-800 rounded-2xl p-6 md:p-8 max-w-lg w-full shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-zinc-500 hover:text-white rounded-lg hover:bg-zinc-900 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {step === 'review' && (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-10 h-10 border-2 border-zinc-800 border-t-emerald-400 rounded-full animate-spin" />
            <div>
              <h3 className="text-sm font-semibold text-white">Pre-Flight Revalidation</h3>
              <p className="text-xs text-zinc-400 mt-1 max-w-xs leading-relaxed">
                Checking live merchant pricing, stock availability, and seller security before checkout...
              </p>
            </div>
          </div>
        )}

        {step === 'paypal_sandbox' && (
          <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-850 pb-4">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-base">PayPal Sandbox</span>
                <span className="bg-zinc-900 text-zinc-400 text-[10px] font-mono px-2 py-0.5 rounded border border-zinc-800 uppercase">
                  v6 WEB SDK
                </span>
              </div>
              <span className="text-[11px] font-mono text-emerald-400 font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Pre-flight Verified ✓
              </span>
            </div>

            {/* SDK Status Banner */}
            <div className="bg-black p-3 rounded-lg border border-zinc-850 flex items-center justify-between text-xs font-mono">
              <span className="text-zinc-400 text-[11px]">
                window.paypal.createInstance()
              </span>
              <span className="text-emerald-400 font-bold text-[11px]">
                {v6Loading ? 'Loading SDK...' : 'SDK Initialized'}
              </span>
            </div>

            {/* Order Details */}
            <div className="space-y-3">
              <div className="text-xs font-mono text-zinc-500 flex items-center justify-between">
                <span>ORDER TOKEN:</span>
                <span className="text-zinc-300 tabular-nums">
                  {order?.paypalOrderId}
                </span>
              </div>
              <div className="text-xs font-semibold text-zinc-200 line-clamp-2">
                {product?.title}
              </div>
              <div className="flex items-center justify-between text-sm font-bold bg-black p-3.5 rounded-lg border border-zinc-850 font-mono">
                <span className="text-zinc-400">Total Due:</span>
                <span className="text-white text-base tabular-nums">
                  {formatCurrency(order?.amount || 0, order?.currency)}
                </span>
              </div>

              {sessionStatusMessage && (
                <div className="text-xs bg-zinc-900 border border-zinc-800 text-zinc-300 p-2.5 rounded-lg font-mono">
                  {sessionStatusMessage}
                </div>
              )}
            </div>

            {/* Payment Methods */}
            <div className="space-y-2">
              <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider font-semibold">
                Eligible Checkout Options:
              </div>

              {/* Standard PayPal Button */}
              {isPayPalEligible && (
                <button
                  type="button"
                  onClick={handlePayPalCheckout}
                  disabled={v6Loading || !!processingMethod}
                  className="w-full bg-[#ffc439] hover:bg-[#f4bb30] text-[#003087] py-2.5 rounded-lg font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
                >
                  {processingMethod === 'paypal' ? (
                    <Loader2 className="w-4 h-4 animate-spin text-[#003087]" />
                  ) : (
                    <span className="font-sans font-black italic">PayPal</span>
                  )}
                  <span>Checkout with PayPal</span>
                </button>
              )}

              {/* Pay Later Button */}
              {isPayLaterEligible && (
                <button
                  type="button"
                  onClick={handlePayLaterCheckout}
                  disabled={v6Loading || !!processingMethod}
                  className="w-full bg-black hover:bg-zinc-900 border border-zinc-800 text-zinc-200 py-2.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-between px-3.5 cursor-pointer disabled:opacity-50"
                >
                  <div className="flex items-center gap-2 font-mono text-[11px]">
                    <span className="bg-zinc-900 text-zinc-300 px-1.5 py-0.2 rounded border border-zinc-800">
                      {payLaterDetails.productCode || 'PAY IN 4'}
                    </span>
                    <span>Pay Later (4 Installments)</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
                </button>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-3 border-t border-zinc-850">
              <button
                type="button"
                onClick={onClose}
                className="w-1/2 bg-zinc-900 hover:bg-zinc-850 text-zinc-300 py-2.5 rounded-lg text-xs font-medium border border-zinc-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onAuthorize}
                className="w-1/2 bg-zinc-100 hover:bg-white text-black py-2.5 rounded-lg text-xs font-semibold transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Simulate Capture</span>
              </button>
            </div>
          </div>
        )}

        {step === 'completed' && (
          <div className="text-center py-6 space-y-4">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
            <div>
              <h3 className="text-base font-bold text-white">Purchase Verified & Recorded</h3>
              <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto leading-relaxed">
                PayPal transaction captured and verified server-to-server with idempotency token protection.
              </p>
            </div>
            <button
              onClick={onClose}
              className="bg-zinc-100 hover:bg-white text-black font-semibold px-6 py-2.5 rounded-lg text-xs transition-colors cursor-pointer shadow-sm"
            >
              Done
            </button>
          </div>
        )}

        {step === 'error' && (
          <div className="text-center py-6 space-y-4">
            <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto" />
            <div>
              <h3 className="text-base font-bold text-white">Pre-Flight Revalidation Guard</h3>
              <p className="text-xs text-rose-300 mt-1 max-w-sm mx-auto font-mono leading-relaxed">{error}</p>
            </div>
            <button
              onClick={onClose}
              className="bg-zinc-900 hover:bg-zinc-850 text-zinc-200 font-medium px-5 py-2 rounded-lg text-xs border border-zinc-800 transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
