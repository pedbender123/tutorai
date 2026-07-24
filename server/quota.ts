import crypto from 'crypto';
import db from './db.js';

// ── Tier definitions ─────────────────────────────────────────────────────────
//
// Single shared credit pool across Lab + Levy + normal chat (like Anthropic plan
// limits) — there is no per-tool quota anymore. The weekly cap exists only as an
// anti-burst brake (so nobody blows the whole month in one sitting); the monthly
// cap is the real ceiling on real spend. Pro tier's numbers are placeholders kept
// from the old Levy-only limit, pending a separate decision.

type Tier = 'free_nonInst' | 'free_inst' | 'pro_nonInst';

interface TierConfig {
  weeklyCredits: number;
  monthlyCredits: number;
  labTokenLimit: number; // max estimated tokens per Lab request (payload-size safety valve, unrelated to credits)
  projectLimit: number;  // max simultaneous Lab projects — single source of truth, also used by ai.ts
}

const TIER_CONFIG: Record<Tier, TierConfig> = {
  free_nonInst: { weeklyCredits: 500_000,   monthlyCredits: 2_000_000, labTokenLimit: 40_000, projectLimit: 5  },
  free_inst:    { weeklyCredits: 500_000,   monthlyCredits: 2_000_000, labTokenLimit: 60_000, projectLimit: 10 },
  pro_nonInst:  { weeklyCredits: 1_000_000, monthlyCredits: 4_000_000, labTokenLimit: 80_000, projectLimit: 10 },
};

export type { Tier, TierConfig };
export { TIER_CONFIG };

// ── Date helpers ─────────────────────────────────────────────────────────────

function weekStartIso(): string {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  // Align to Monday (ISO week start)
  const day = d.getUTCDay(); // 0=Sun … 6=Sat
  d.setUTCDate(d.getUTCDate() - ((day + 6) % 7));
  return d.toISOString().slice(0, 10);
}

function monthIso(): string {
  return new Date().toISOString().slice(0, 7); // YYYY-MM
}

// ── Tier resolution ──────────────────────────────────────────────────────────

export function getUserTier(userId: string): Tier {
  const user = db.prepare('SELECT plan FROM users WHERE id = ?').get(userId) as { plan: string } | undefined;
  const plan = user?.plan ?? 'free';
  const hasInst = !!db.prepare('SELECT 1 FROM user_institutions WHERE userId = ? LIMIT 1').get(userId);
  if (plan === 'pro' && !hasInst) return 'pro_nonInst';
  if (hasInst) return 'free_inst';
  return 'free_nonInst';
}

// ── Quota check result ───────────────────────────────────────────────────────

export interface QuotaResult {
  allowed: boolean;
  reason?: string;
  tier: Tier;
  config: TierConfig;
}

// ── Shared credit pool (Lab + Levy + chat normal) ──────────────────────────

export function checkToolQuota(userId: string): QuotaResult {
  const tier = getUserTier(userId);
  const cfg = TIER_CONFIG[tier];
  const week = weekStartIso();
  const month = monthIso();

  const user = db.prepare(`
    SELECT petrus_credits_week, petrus_credits_week_reset, credits_month, credits_month_reset
    FROM users WHERE id = ?
  `).get(userId) as any;

  const creditsWeek  = user?.petrus_credits_week_reset === week  ? (user?.petrus_credits_week ?? 0) : 0;
  const creditsMonth = user?.credits_month_reset        === month ? (user?.credits_month        ?? 0) : 0;

  if (creditsMonth >= cfg.monthlyCredits) {
    logQuotaEvent({ userId, surface: 'lab', event: 'limit_hit' });
    return { allowed: false, reason: `Limite mensal de ${cfg.monthlyCredits.toLocaleString()} créditos atingido.`, tier, config: cfg };
  }
  if (creditsWeek >= cfg.weeklyCredits) {
    logQuotaEvent({ userId, surface: 'lab', event: 'limit_hit' });
    return { allowed: false, reason: `Limite semanal de ${cfg.weeklyCredits.toLocaleString()} créditos atingido. Renova na segunda-feira.`, tier, config: cfg };
  }

  return { allowed: true, tier, config: cfg };
}

export function recordToolCredits(userId: string, credits: number): void {
  const week = weekStartIso();
  const month = monthIso();

  const user = db.prepare(`
    SELECT petrus_credits_week, petrus_credits_week_reset, credits_month, credits_month_reset
    FROM users WHERE id = ?
  `).get(userId) as any;

  const creditsWeek  = user?.petrus_credits_week_reset === week  ? (user?.petrus_credits_week ?? 0) : 0;
  const creditsMonth = user?.credits_month_reset        === month ? (user?.credits_month        ?? 0) : 0;

  db.prepare(`
    UPDATE users SET
      petrus_credits_week        = ?,
      petrus_credits_week_reset  = ?,
      credits_month              = ?,
      credits_month_reset        = ?
    WHERE id = ?
  `).run(creditsWeek + credits, week, creditsMonth + credits, month, userId);
}

// Back-compat aliases: same shared pool, kept so call sites read naturally per-surface.
export const checkLevyQuota = checkToolQuota;
export const recordLevyCredits = recordToolCredits;
export const checkLabQuota = checkToolQuota;

// ── Instrumentation ──────────────────────────────────────────────────────────

// 'rpd_skip' = model skipped because daily limit already exhausted (no API call made)
export type QuotaEvent = 'request' | '429' | 'rpd_skip' | 'limit_hit';

export function logQuotaEvent(params: {
  userId?: string;
  surface: 'lab' | 'levy';
  event: QuotaEvent;
  model?: string;
  tokensIn?: number;
  tokensOut?: number;
  credits?: number;
  wasSpill?: boolean;
  usedFree?: boolean;
}): void {
  try {
    db.prepare(`
      INSERT INTO quota_metrics (id, surface, event, model, userId, tokens_in, tokens_out, credits, was_spill, used_free)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      crypto.randomUUID(),
      params.surface,
      params.event,
      params.model ?? null,
      params.userId ?? null,
      params.tokensIn  ?? 0,
      params.tokensOut ?? 0,
      params.credits   ?? 0,
      params.wasSpill  ? 1 : 0,
      params.usedFree  ? 1 : 0,
    );
  } catch {
    // Metrics are best-effort — never block a request over a logging failure
  }
}

// ── Admin: quota summary for a user ─────────────────────────────────────────

export interface QuotaSummary {
  tier: Tier;
  credits: {
    week: number;
    weeklyLimit: number;
    month: number;
    monthlyLimit: number;
  };
}

export function getQuotaSummary(userId: string): QuotaSummary {
  const tier = getUserTier(userId);
  const cfg = TIER_CONFIG[tier];
  const week = weekStartIso();
  const month = monthIso();

  const user = db.prepare(`
    SELECT petrus_credits_week, petrus_credits_week_reset, credits_month, credits_month_reset
    FROM users WHERE id = ?
  `).get(userId) as any;

  return {
    tier,
    credits: {
      week:         user?.petrus_credits_week_reset === week  ? (user?.petrus_credits_week ?? 0) : 0,
      weeklyLimit:  cfg.weeklyCredits,
      month:        user?.credits_month_reset        === month ? (user?.credits_month        ?? 0) : 0,
      monthlyLimit: cfg.monthlyCredits,
    },
  };
}
