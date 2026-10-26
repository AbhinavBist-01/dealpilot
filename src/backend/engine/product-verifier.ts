/**
 * Product Verification & Intent Matching Engine
 * 
 * Prevents the deal agent from returning irrelevant products, accessories (cases/cables/cushions),
 * counterfeit/junk listings, or mismatched categories when a user searches for specific electronics.
 */

export interface ProductVerificationInput {
  query: string;
  title: string;
  brand?: string;
  model?: string;
  category?: string;
  price: number;
}

export interface ProductVerificationResult {
  isMatch: boolean;
  relevanceScore: number; // 0.0 to 1.0
  matchQuality: 'exact_model' | 'strong' | 'partial' | 'accessory_mismatch' | 'irrelevant';
  isAccessoryMismatch: boolean;
  matchedTokens: string[];
  reasons: string[];
}

const ACCESSORY_KEYWORDS = new Set([
  'case',
  'cover',
  'protector',
  'screen protector',
  'cable',
  'cord',
  'charger',
  'charging cable',
  'strap',
  'band',
  'skin',
  'decal',
  'sleeve',
  'pouch',
  'replacement',
  'earpads',
  'ear pads',
  'cushion',
  'cushions',
  'mount',
  'stand',
  'bracket',
  'adapter',
  'dongle',
  'stylus',
  'battery pack',
  'cleaning kit',
]);

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
  'buy', 'deal', 'deals', 'best', 'cheap', 'discount', 'price', 'sale', 'new', 'original',
  'genuine', 'latest', 'top', 'fast', 'good', 'free', 'shipping'
]);

/**
 * Tokenizes text into normalized meaningful words
 */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/[\s-]+/)
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token));
}

/**
 * Extracts distinctive model numbers (e.g., 'xm5', '1000xm5', 'm3', '27gp850', '4080', 's24')
 */
function extractModelTokens(text: string): string[] {
  // Matches tokens that contain both digits and letters or pure model-like digits
  const tokens = text.toLowerCase().match(/\b([a-z0-9]*\d+[a-z0-9]*)\b/gi) || [];
  return tokens.map((t) => t.toLowerCase()).filter((t) => t.length >= 2);
}

const BRAND_GROUPS: Record<string, string[]> = {
  apple: ['apple', 'iphone', 'ipad', 'macbook', 'airpods', 'iwatch'],
  dell: ['dell', 'alienware', 'xps', 'inspiron'],
  sony: ['sony', 'bravia', 'playstation', 'ps5', 'ps4'],
  samsung: ['samsung', 'galaxy'],
  lenovo: ['lenovo', 'thinkpad', 'legion', 'yoga'],
  hp: ['hp', 'hewlett', 'omen', 'pavilion'],
  asus: ['asus', 'rog', 'zenbook', 'tuf'],
  bose: ['bose', 'quietcomfort'],
  boat: ['boat', 'airdopes', 'rockerz'],
  oneplus: ['oneplus'],
  google: ['google', 'pixel'],
  microsoft: ['microsoft', 'surface', 'xbox'],
  nintendo: ['nintendo', 'switch'],
};

/**
 * Deterministically checks if candidate is an accessory when user wanted the core device
 */
function detectAccessoryMismatch(query: string, title: string): boolean {
  const queryLower = query.toLowerCase();
  const titleLower = title.toLowerCase();

  // If user explicitly searched for an accessory, it's not a mismatch
  for (const acc of ACCESSORY_KEYWORDS) {
    if (queryLower.includes(acc)) {
      return false;
    }
  }

  // Check if title indicates an accessory
  for (const acc of ACCESSORY_KEYWORDS) {
    // E.g., "case for iPhone", "replacement earpads for Sony XM5", "iPhone 15 screen protector"
    const regex = new RegExp(`\\b${acc}\\b`, 'i');
    if (regex.test(titleLower)) {
      // Check if title mentions "for <model>" or accessory prefix
      if (
        titleLower.includes(`for `) ||
        titleLower.includes(`compatible with`) ||
        titleLower.includes(`replacement`) ||
        titleLower.startsWith(acc) ||
        titleLower.endsWith(acc)
      ) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Evaluates whether a discovered product strictly verifies against user intent
 */
export function verifyProductMatch(input: ProductVerificationInput): ProductVerificationResult {
  const { query, title, brand = '', model = '', category = '', price } = input;
  const reasons: string[] = [];

  const isAccessoryMismatch = detectAccessoryMismatch(query, title);
  if (isAccessoryMismatch) {
    reasons.push('Excluded: Candidate is an accessory (case/cable/cushion) for the requested item');
    return {
      isMatch: false,
      relevanceScore: 0.1,
      matchQuality: 'accessory_mismatch',
      isAccessoryMismatch: true,
      matchedTokens: [],
      reasons,
    };
  }

  const queryLower = query.toLowerCase();
  const brandLower = brand.toLowerCase();
  const titleLower = title.toLowerCase();

  // Brand conflict detection (e.g. query asked for Apple iPhone, candidate is Dell laptop)
  let queryBrandGroup: string | null = null;
  for (const [groupName, keywords] of Object.entries(BRAND_GROUPS)) {
    if (keywords.some((k) => queryLower.includes(k))) {
      queryBrandGroup = groupName;
      break;
    }
  }

  let targetBrandGroup: string | null = null;
  for (const [groupName, keywords] of Object.entries(BRAND_GROUPS)) {
    if (keywords.some((k) => brandLower.includes(k) || titleLower.includes(k))) {
      targetBrandGroup = groupName;
      break;
    }
  }

  if (queryBrandGroup && targetBrandGroup && queryBrandGroup !== targetBrandGroup) {
    reasons.push(`Brand conflict: query asked for ${queryBrandGroup} ecosystem, but product belongs to ${targetBrandGroup}`);
    return {
      isMatch: false,
      relevanceScore: 0.05,
      matchQuality: 'irrelevant',
      isAccessoryMismatch: false,
      matchedTokens: [],
      reasons,
    };
  }

  const queryTokens = tokenize(query);
  const targetTokens = new Set(tokenize(`${title} ${brand} ${model} ${category}`));

  const matchedTokens: string[] = [];
  for (const token of queryTokens) {
    if (targetTokens.has(token)) {
      matchedTokens.push(token);
    }
  }

  // Brand verification
  const brandMatched = brandLower ? (queryLower.includes(brandLower) || titleLower.includes(brandLower)) : false;

  if (brandMatched && brandLower) {
    reasons.push(`Verified brand: ${brand}`);
  }

  // Model number verification (highest precision signal)
  const queryModels = extractModelTokens(query);
  const titleModels = extractModelTokens(`${title} ${model}`);
  let modelMatched = false;

  if (queryModels.length > 0) {
    for (const qm of queryModels) {
      // If qm is a pure short number (e.g. "15", "14"), require brand confirmation if multiple tokens exist
      const isPureShortNumber = /^\d{1,2}$/.test(qm);
      if (isPureShortNumber && !brandMatched && queryTokens.length > 1) {
        continue;
      }
      if (titleModels.some((tm) => tm.includes(qm) || qm.includes(tm))) {
        modelMatched = true;
        reasons.push(`Direct model spec matched: ${qm}`);
        break;
      }
    }
  }

  // Token overlap ratio
  const overlapRatio = queryTokens.length > 0 ? matchedTokens.length / queryTokens.length : 0;

  // Calculate composite relevance score
  let relevanceScore = 0.0;
  if (modelMatched) {
    relevanceScore += 0.5;
  }
  if (brandMatched) {
    relevanceScore += 0.25;
  }
  relevanceScore += overlapRatio * 0.25;

  // Price sanity check: Flag ridiculously cheap items (e.g. < $15) when searching high-value hardware
  if (queryModels.length > 0 && price > 0 && price < 15) {
    relevanceScore -= 0.35;
    reasons.push(`Suspiciously low price (${price}) for high-value model query; likely non-device item`);
  }

  relevanceScore = Math.max(0, Math.min(1.0, parseFloat(relevanceScore.toFixed(2))));

  // Match quality classification
  let matchQuality: ProductVerificationResult['matchQuality'] = 'irrelevant';
  let isMatch = false;

  if (modelMatched && (overlapRatio >= 0.4 || relevanceScore >= 0.7)) {
    matchQuality = 'exact_model';
    isMatch = true;
    reasons.push('Verified exact model match');
  } else if (relevanceScore >= 0.55 || overlapRatio >= 0.6) {
    matchQuality = 'strong';
    isMatch = true;
    reasons.push('High token and context relevance match');
  } else if (relevanceScore >= 0.35 || overlapRatio >= 0.35) {
    matchQuality = 'partial';
    isMatch = true;
    reasons.push('Partial match: relevant brand or category');
  } else {
    matchQuality = 'irrelevant';
    isMatch = false;
    reasons.push('Low relevance: does not sufficiently match search intent');
  }

  return {
    isMatch,
    relevanceScore,
    matchQuality,
    isAccessoryMismatch: false,
    matchedTokens,
    reasons,
  };
}
