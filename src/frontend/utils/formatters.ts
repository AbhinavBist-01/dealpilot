export function formatCurrency(amount?: number | null, currency: string = 'INR'): string {
  const val = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
  const cur = currency?.toUpperCase() || 'INR';
  if (cur === 'INR') {
    return `₹${val.toLocaleString('en-IN')}`;
  }
  if (cur === 'USD') {
    return `$${val.toLocaleString('en-US', { minimumFractionDigits: val % 1 === 0 ? 0 : 2 })}`;
  }
  if (cur === 'EUR') {
    return `€${val.toLocaleString('de-DE', { minimumFractionDigits: val % 1 === 0 ? 0 : 2 })}`;
  }
  if (cur === 'GBP') {
    return `£${val.toLocaleString('en-GB', { minimumFractionDigits: val % 1 === 0 ? 0 : 2 })}`;
  }
  if (cur === 'CAD') {
    return `CA$${val.toLocaleString('en-CA', { minimumFractionDigits: val % 1 === 0 ? 0 : 2 })}`;
  }
  if (cur === 'AUD') {
    return `A$${val.toLocaleString('en-AU', { minimumFractionDigits: val % 1 === 0 ? 0 : 2 })}`;
  }
  return `${cur} ${val.toLocaleString()}`;
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
