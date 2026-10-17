import React from 'react';

interface TrackingModalProps {
  product: any;
  targetPrice: number;
  setTargetPrice: (price: number) => void;
  onConfirm: () => void;
  onClose: () => void;
}

export const TrackingModal: React.FC<TrackingModalProps> = ({
  product,
  targetPrice,
  setTargetPrice,
  onConfirm,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
        <h3 className="text-lg font-bold mb-2">Track Price with DealPilot</h3>
        <p className="text-xs text-slate-400 mb-4">
          We'll monitor <strong>{product.title}</strong> in the background and notify you the moment it hits your target.
        </p>

        <div className="space-y-4 mb-6">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Target Price (₹)
            </label>
            <input
              type="number"
              value={targetPrice}
              onChange={(e) => setTargetPrice(parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs text-slate-400">
            <span className="text-emerald-400 font-semibold">Adaptive Polling: </span>
            Monitors every 2 hours; switches to every 30 mins when price is within 5% of your target.
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
            onClick={onConfirm}
            className="w-1/2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-emerald-500/20"
          >
            Confirm & Track
          </button>
        </div>
      </div>
    </div>
  );
};
