export function formatCurrency(amount: number, currency: string = 'INR'): string {
  if (currency === 'INR') {
    return `₹${amount.toLocaleString('en-IN')}`;
  }
  return `${currency} ${amount.toLocaleString()}`;
}

export function formatDateTime(date: Date | string): string {
  return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function getDealScoreBadgeColor(score: number): {
  bg: string;
  text: string;
  border: string;
} {
  if (score >= 80) {
    return {
      bg: 'bg-emerald-500/20',
      text: 'text-emerald-400',
      border: 'border-emerald-500/30',
    };
  }
  if (score >= 60) {
    return {
      bg: 'bg-amber-500/20',
      text: 'text-amber-400',
      border: 'border-amber-500/30',
    };
  }
  return {
    bg: 'bg-rose-500/20',
    text: 'text-rose-400',
    border: 'border-rose-500/30',
  };
}
