import type {
    LogLevel,
    PackageName,
    Stack
} from "./types";

// =============================================================================
// CREDENTIALS — used for automatic token refresh when a 401 is detected
// =============================================================================
const AUTH_CREDENTIALS = {
    name:         "dhanush",
    email:        "cdhnaushkumarreddy@gmail.com",
    rollNo:       "2311cs030094",
    accessCode:   "xpQddd",
    clientID:     "f48a57cf-1b70-4fd6-9529-19d119d9f292",
    clientSecret: "FSvXtuhEtYHJCDHk",
};

// =============================================================================
// In-memory token cache (module-level singleton).
// Both the backend (Node.js) and the frontend (Vite) share this cache within
// their respective JavaScript runtime processes.
// =============================================================================
let _cachedToken: string | null = null;
let _tokenExpiresAtMs: number   = 0;   // Unix epoch in milliseconds
const TOKEN_REFRESH_BUFFER_MS   = 60_000; // Refresh 1 min before actual expiry

// =============================================================================
// Environment helpers
// =============================================================================

function getViteEnv(): Record<string, string | undefined> {
    if (typeof process !== "undefined" && process.env) {
        return process.env as Record<string, string | undefined>;
    }

    try {
        const meta = Function("return import.meta")() as { env?: Record<string, string | undefined> };
        return meta?.env ?? {};
    } catch {
        return {};
    }
}

/** Returns the base URL for the evaluation service. */
function getBaseUrl(): string {
    const env = getViteEnv();

    // Backend: process.env (Node.js / dotenv)
    if (env.BASE_URL) {
        return env.BASE_URL.trim();
    }

    // Frontend: Vite env (must be prefixed with VITE_)
    if (env.VITE_BASE_URL) {
        return env.VITE_BASE_URL.trim();
    }

    return "http://4.224.186.213/evaluation-service";
}

/** Returns the static token from environment (before any refresh logic). */
function getEnvToken(): string | null {
    const env = getViteEnv();

    // 1. Backend: process.env.ACCESS_TOKEN
    if (env.ACCESS_TOKEN) {
        return env.ACCESS_TOKEN.trim();
    }

    // 2. Frontend: Vite env (must be prefixed with VITE_)
    if (env.VITE_ACCESS_TOKEN) {
        return env.VITE_ACCESS_TOKEN.trim();
    }

    return null;
}

// =============================================================================
// JWT expiry check (pure function — no third-party dependency)
// =============================================================================

/**
 * Decodes the JWT payload and returns the `exp` field as a Unix epoch in ms.
 * Returns 0 on any parse error (treated as already-expired).
 */
function getTokenExpiryMs(token: string): number {
    try {
        const parts = token.split(".");
        if (parts.length !== 3) return 0;
        const payload = JSON.parse(atob(parts[1]!));
        const claims  = payload.MapClaims ?? payload; // support both JWT structures
        const exp: number = claims.exp ?? 0;
        return exp * 1000; // convert seconds → ms
    } catch {
        return 0;
    }
}

/** Returns true if the given token is expired or will expire within the buffer window. */
function isTokenExpiredOrNearExpiry(token: string): boolean {
    const expiryMs = getTokenExpiryMs(token);
    return Date.now() >= expiryMs - TOKEN_REFRESH_BUFFER_MS;
}

// =============================================================================
// Token refresh  — POST /evaluation-service/auth
// =============================================================================

/**
 * Calls the evaluation service auth endpoint and returns a fresh access token.
 * Returns null if the refresh fails (logger must degrade gracefully).
 */
async function refreshToken(): Promise<string | null> {
    const baseUrl = getBaseUrl();
    console.warn("[Logger] Access token expired or near expiry — refreshing...");

    try {
        const res = await fetch(`${baseUrl}/auth`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(AUTH_CREDENTIALS),
        });

        if (!res.ok) {
            const body = await res.text().catch(() => "(unreadable)");
            console.error(`[Logger] Token refresh failed: HTTP ${res.status}`, body);
            return null;
        }

        const data: { access_token?: string; token?: string } = await res.json();
        const newToken = data.access_token ?? data.token ?? null;

        if (!newToken) {
            console.error("[Logger] Token refresh response missing access_token field", data);
            return null;
        }

        console.info("[Logger] Token refreshed successfully.");
        return newToken;
    } catch (err) {
        console.error("[Logger] Token refresh request threw:", err);
        return null;
    }
}

// =============================================================================
// Token resolution with auto-refresh
// =============================================================================

/**
 * Returns a valid access token.
 * Priority:
 *   1. In-memory cache (not expired / near-expiry)
 *   2. Environment variable (if still valid)
 *   3. Fresh token from /auth endpoint
 *   4. Stale cached token (fallback — better than nothing)
 */
async function getValidToken(): Promise<string | null> {
    const nowMs = Date.now();

    // 1. Return cached token if still valid
    if (_cachedToken && nowMs < _tokenExpiresAtMs - TOKEN_REFRESH_BUFFER_MS) {
        return _cachedToken;
    }

    // 2. Check environment token
    const envToken = getEnvToken();
    if (envToken && !isTokenExpiredOrNearExpiry(envToken)) {
        _cachedToken       = envToken;
        _tokenExpiresAtMs  = getTokenExpiryMs(envToken);
        return _cachedToken;
    }

    // 3. Environment token is expired (or missing) — attempt refresh
    const fresh = await refreshToken();
    if (fresh) {
        _cachedToken      = fresh;
        _tokenExpiresAtMs = getTokenExpiryMs(fresh);
        return _cachedToken;
    }

    // 4. Fallback: return stale cached token so we at least try
    if (_cachedToken) {
        console.warn("[Logger] Using stale cached token — refresh failed.");
        return _cachedToken;
    }

    // 5. Return stale env token as last resort
    if (envToken) {
        console.warn("[Logger] Using stale env token — all refresh attempts failed.");
        return envToken;
    }

    console.error("[Logger] No token available — log call will be skipped.");
    return null;
}

// =============================================================================
// Public Log function
// =============================================================================

export async function Log(
    stack:   Stack,
    level:   LogLevel,
    pkg:     PackageName,
    message: string
): Promise<void> {
    // ── DEBUG: local console echo ───────────────────────────────────────────
    const LABEL: Record<LogLevel, string> = {
        debug: "DEBUG",
        info:  "INFO ",
        warn:  "WARN ",
        error: "ERROR",
        fatal: "FATAL",
    };
    console.log(`[${LABEL[level] ?? level.toUpperCase()}][${stack}/${pkg}] ${message}`);

    // ── Resolve token ───────────────────────────────────────────────────────
    const token = await getValidToken();
    if (!token) {
        // No token available — skip remote log, never crash the app
        console.warn("[Logger] Remote log skipped — no valid token.");
        return;
    }

    const baseUrl = getBaseUrl();
    const url     = `${baseUrl}/logs`;

    // ── Truncate message to API limit (48 chars max) ────────────────────────
    // The evaluation service returns HTTP 400 if message exceeds 48 characters.
    const MAX_MSG_LEN = 48;
    const remoteMessage = message.length > MAX_MSG_LEN
        ? message.slice(0, MAX_MSG_LEN - 1) + "…"
        : message;

    // ── DEBUG: print resolved values ────────────────────────────────────────
    const tokenPreview = `${token.slice(0, 20)}…${token.slice(-8)}`;
    console.debug(`[Logger] POST ${url}`);
    console.debug(`[Logger] Token: Bearer ${tokenPreview}`);
    console.debug(`[Logger] Payload: { stack: "${stack}", level: "${level}", package: "${pkg}", message: "${remoteMessage}" }`);

    // ── Send log ────────────────────────────────────────────────────────────
    try {
        const res = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type":  "application/json",
                "Authorization": `Bearer ${token}`,
            },
            body: JSON.stringify({ stack, level, package: pkg, message: remoteMessage }),
        });

        if (!res.ok) {
            const body = await res.text().catch(() => "(unreadable)");

            if (res.status === 401) {
                // ── 401: force token refresh on next call ───────────────────
                console.warn(
                    `[Logger] 401 Unauthorized — token rejected by evaluation service.\n` +
                    `         Response body: ${body}\n` +
                    `         Token preview: Bearer ${tokenPreview}\n` +
                    `         Action: cache invalidated, will refresh on next Log() call.`
                );
                _cachedToken      = null; // Invalidate cache
                _tokenExpiresAtMs = 0;    // Force refresh on next call
            } else {
                console.warn(`[Logger] Remote log returned HTTP ${res.status}: ${body}`);
            }
        } else {
            console.debug(`[Logger] Remote log accepted (HTTP ${res.status})`);
        }
    } catch (err) {
        // Network error — never crash the application
        console.error("[Logger] Remote log request failed (network error):", err);
    }
}

