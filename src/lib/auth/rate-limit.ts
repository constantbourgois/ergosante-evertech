// Limitation de débit — docs/PLAN.md §10 : inscription, connexion, renvoi
// d'e-mail. Implémentation en mémoire, par instance de fonction serverless :
// suffisant pour dissuader un abus grossier depuis une seule IP, mais ce
// n'est pas une limitation distribuée. Si le trafic le justifie, la remplacer
// par un compteur partagé (Upstash Redis, par ex.) sans changer l'appelant.
interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterMs: 0 };
  }

  if (bucket.count >= limit) {
    return { allowed: false, retryAfterMs: bucket.resetAt - now };
  }

  bucket.count += 1;
  return { allowed: true, retryAfterMs: 0 };
}

export function rateLimitKeyFromRequest(request: Request, scope: string): string {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";
  return `${scope}:${ip}`;
}
