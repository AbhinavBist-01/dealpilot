export function formatCurrency(amount: number, currency: string = 'INR'): string {
  if (currency === 'INR') {
    return `₹${amount.toLocaleString('en-IN')}`;
  }
  if (currency === 'USD') {
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: amount % 1 === 0 ? 0 : 2 })}`;
  }
  if (currency === 'EUR') {
    return `€${amount.toLocaleString('en-EU', { minimumFractionDigits: amount % 1 === 0 ? 0 : 2 })}`;
  }
  if (currency === 'GBP') {
    return `£${amount.toLocaleString('en-GB', { minimumFractionDigits: amount % 1 === 0 ? 0 : 2 })}`;
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
