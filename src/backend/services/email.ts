import prisma from '../utils/db';

export interface PriceDropEmailData {
  to: string;
  productTitle: string;
  brand?: string;
  imageUrl?: string;
  currentPrice: number;
  targetPrice: number;
  currency?: string;
  savings?: number;
  dropPercentage?: number;
  sellerName?: string;
  sellerRating?: number;
  dealScore?: number;
  condition?: string;
  trackingRuleId: string;
  offerId: string;
  checkoutUrl?: string;
  historyUrl?: string;
}

export interface SendEmailResult {
  success: boolean;
  messageId: string;
  provider: 'resend' | 'simulated';
  recipient: string;
  subject: string;
  sentAt: Date;
  html: string;
  error?: string;
}

// In-memory dispatch audit log for interactive inspection and test assertions
export const emailDispatchHistory: SendEmailResult[] = [];

/**
 * Pure function to render a responsive, dark-quartz HTML email template
 */
export function renderPriceDropEmailHtml(data: PriceDropEmailData): string {
  const currency = data.currency || 'INR';
  const currencySymbol = currency === 'INR' ? '₹' : '$';
  const savings = data.savings ?? Math.max(0, data.targetPrice - data.currentPrice);
  const dropPct = data.dropPercentage ?? (data.targetPrice > 0 ? Math.round((savings / data.targetPrice) * 100) : 0);
  const score = data.dealScore || 85;
  const condition = data.condition || 'Brand New';
  const seller = data.sellerName || 'Verified Merchant';

  const checkoutLink = data.checkoutUrl || `http://localhost:3000/?checkoutOffer=${data.offerId}`;
  const historyLink = data.historyUrl || `http://localhost:3000/?historyProduct=${data.trackingRuleId}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Price Drop Alert — DealPilot</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #020617;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #f8fafc;
    }
    .wrapper {
      max-width: 600px;
      margin: 0 auto;
      padding: 32px 16px;
    }
    .card {
      background-color: #0f172a;
      border: 1px solid #1e293b;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
    }
    .header {
      background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
      padding: 24px 32px;
      border-bottom: 1px solid #1e293b;
    }
    .logo {
      font-size: 20px;
      font-weight: 800;
      color: #10b981;
      letter-spacing: -0.5px;
    }
    .logo span {
      color: #818cf8;
    }
    .badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      background-color: rgba(16, 185, 129, 0.15);
      color: #34d399;
      border: 1px solid rgba(16, 185, 129, 0.3);
      margin-top: 12px;
    }
    .content {
      padding: 32px;
    }
    .product-title {
      font-size: 18px;
      font-weight: 700;
      color: #f1f5f9;
      margin: 0 0 8px 0;
      line-height: 1.4;
    }
    .product-meta {
      font-size: 12px;
      color: #94a3b8;
      margin-bottom: 24px;
    }
    .price-box {
      background-color: #020617;
      border: 1px solid #334155;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .price-col {
      flex: 1;
    }
    .price-label {
      font-size: 11px;
      color: #64748b;
      text-transform: uppercase;
      font-weight: 600;
      margin-bottom: 4px;
    }
    .target-price {
      font-size: 16px;
      color: #94a3b8;
      text-decoration: line-through;
      font-weight: 600;
    }
    .current-price {
      font-size: 28px;
      color: #10b981;
      font-weight: 800;
      letter-spacing: -0.5px;
    }
    .savings-pill {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 6px;
      background-color: rgba(16, 185, 129, 0.2);
      color: #10b981;
      font-size: 12px;
      font-weight: 700;
      margin-top: 4px;
    }
    .stats-grid {
      display: table;
      width: 100%;
      margin-bottom: 28px;
      border-collapse: separate;
      border-spacing: 8px 0;
    }
    .stat-cell {
      display: table-cell;
      background-color: #1e293b;
      padding: 12px;
      border-radius: 8px;
      text-align: center;
      width: 33.33%;
    }
    .stat-val {
      font-size: 14px;
      font-weight: 700;
      color: #f8fafc;
    }
    .stat-lbl {
      font-size: 10px;
      color: #94a3b8;
      text-transform: uppercase;
      margin-top: 2px;
    }
    .btn-primary {
      display: block;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: #020617 !important;
      text-align: center;
      padding: 14px 24px;
      border-radius: 10px;
      font-weight: 700;
      font-size: 14px;
      text-decoration: none;
      margin-bottom: 12px;
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.25);
    }
    .btn-secondary {
      display: block;
      background-color: #1e293b;
      color: #cbd5e1 !important;
      text-align: center;
      padding: 12px 24px;
      border-radius: 10px;
      font-weight: 600;
      font-size: 13px;
      text-decoration: none;
      border: 1px solid #334155;
    }
    .footer {
      padding: 24px 32px;
      background-color: #020617;
      border-top: 1px solid #1e293b;
      font-size: 11px;
      color: #64748b;
      line-height: 1.5;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="header">
        <div class="logo">Deal<span>Pilot</span> ⚡</div>
        <div class="badge">Target Price Drop Triggered</div>
      </div>
      <div class="content">
        <h1 class="product-title">${data.productTitle}</h1>
        <div class="product-meta">
          ${data.brand ? `${data.brand} · ` : ''}Sold by <strong>${seller}</strong> · Condition: ${condition}
        </div>

        <div class="price-box">
          <div class="price-col">
            <div class="price-label">Target Threshold</div>
            <div class="target-price">${currencySymbol}${data.targetPrice.toLocaleString()}</div>
          </div>
          <div class="price-col" style="text-align: right;">
            <div class="price-label">New Live Price</div>
            <div class="current-price">${currencySymbol}${data.currentPrice.toLocaleString()}</div>
            <div class="savings-pill">Save ${currencySymbol}${savings.toLocaleString()} (${dropPct}% drop)</div>
          </div>
        </div>

        <div class="stats-grid">
          <div class="stat-cell">
            <div class="stat-val" style="color: #34d399;">${score} / 100</div>
            <div class="stat-lbl">Deal Score</div>
          </div>
          <div class="stat-cell">
            <div class="stat-val">${seller}</div>
            <div class="stat-lbl">Verified Merchant</div>
          </div>
          <div class="stat-cell">
            <div class="stat-val">${condition}</div>
            <div class="stat-lbl">Condition</div>
          </div>
        </div>

        <a href="${checkoutLink}" class="btn-primary">
          ⚡ Complete Pre-Flight Checkout
        </a>
        <a href="${historyLink}" class="btn-secondary">
          📊 View 30-Day Price Trajectory Chart
        </a>
      </div>

      <div class="footer">
        You received this notification because you created a price tracking rule on DealPilot for this product.<br>
        DealPilot continuously monitors live inventory and enforces deterministic pre-flight price validation before payment.
      </div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Dispatch price drop email notification via Resend or simulated local dispatcher
 */
export async function sendPriceDropEmail(data: PriceDropEmailData): Promise<SendEmailResult> {
  const currencySymbol = (data.currency || 'INR') === 'INR' ? '₹' : '$';
  const savings = data.savings ?? Math.max(0, data.targetPrice - data.currentPrice);
  const subject = `🚨 Price Drop Alert: ${data.productTitle} dropped to ${currencySymbol}${data.currentPrice.toLocaleString()} (Save ${currencySymbol}${savings.toLocaleString()})!`;
  const html = renderPriceDropEmailHtml(data);

  const resendApiKey = process.env.RESEND_API_KEY;
  const isResendConfigured = Boolean(resendApiKey && !resendApiKey.includes('your_resend'));

  if (isResendConfigured) {
    try {
      const fromEmail = process.env.EMAIL_FROM || 'alerts@dealpilot.ai';
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: fromEmail,
          to: data.to,
          subject,
          html,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        const result: SendEmailResult = {
          success: true,
          messageId: json.id || `resend-${Date.now()}`,
          provider: 'resend',
          recipient: data.to,
          subject,
          sentAt: new Date(),
          html,
        };
        emailDispatchHistory.unshift(result);
        return result;
      }
    } catch (err: any) {
      console.warn('[EmailService] Resend API delivery failed, falling back to local dispatch log:', err.message);
    }
  }

  // Local simulated email delivery (zero external dependency, 100% testable & auditable)
  const messageId = `sim-email-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const result: SendEmailResult = {
    success: true,
    messageId,
    provider: 'simulated',
    recipient: data.to,
    subject,
    sentAt: new Date(),
    html,
  };

  emailDispatchHistory.unshift(result);
  if (emailDispatchHistory.length > 50) {
    emailDispatchHistory.pop();
  }

  console.log(`\n📧 ==================== [DEALPILOT EMAIL DISPATCH] ====================`);
  console.log(`To: ${data.to}`);
  console.log(`Subject: ${subject}`);
  console.log(`Live Price: ${currencySymbol}${data.currentPrice.toLocaleString()} (Target: ${currencySymbol}${data.targetPrice.toLocaleString()})`);
  console.log(`Savings: ${currencySymbol}${savings.toLocaleString()}`);
  console.log(`MessageId: ${messageId}`);
  console.log(`=======================================================================\n`);

  return result;
}

/**
 * Retrieve recent email dispatches
 */
export function getEmailDispatchHistory(): SendEmailResult[] {
  return [...emailDispatchHistory];
}
