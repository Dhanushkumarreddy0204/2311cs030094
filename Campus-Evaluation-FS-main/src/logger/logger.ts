import type {
    LogLevel,
    PackageName,
    Stack
} from "./types";

// =============================================================================
// CREDENTIALS — used for automatic token refresh when a 401 is detected
// =============================================================================
function getAuthCredentials() {
    const env = getViteEnv();
    return {
        name:         env.NAME || env.VITE_NAME || "",
        email:        env.EMAIL || env.VITE_EMAIL || "",
        rollNo:       env.ROLL_NO || env.VITE_ROLL_NO || "",
        accessCode:   env.ACCESS_CODE || env.VITE_ACCESS_CODE || "",
        clientID:     env.CLIENT_ID || env.VITE_CLIENT_ID || "",
        clientSecret: env.CLIENT_SECRET || env.VITE_CLIENT_SECRET || "",
    };
}

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

function decodeJwt(token: string): number {
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

function isTokenExpired(token: string): boolean {
    const expiryMs = decodeJwt(token);
    return Date.now() >= expiryMs - TOKEN_REFRESH_BUFFER_MS;
}

// =============================================================================
// Token refresh  — POST /evaluation-service/auth
// =============================================================================

async function authenticate(): Promise<string | null> {
    const baseUrl = getBaseUrl();
    const creds = getAuthCredentials();

    try {
        const res = await fetch(`${baseUrl}/auth`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(creds),
        });

        if (!res.ok) {
            console.warn("[Logger] Authentication failed");
            return null;
        }

        const data: { access_token?: string; token?: string } = await res.json();
        const newToken = data.access_token ?? data.token ?? null;

        if (!newToken) {
            console.warn("[Logger] Authentication failed");
            return null;
        }

        console.info("[Logger] Token refreshed");
        return newToken;
    } catch (err) {
        console.warn("[Logger] Authentication failed");
        return null;
    }
}

// =============================================================================
// Token resolution with auto-refresh
// =============================================================================

async function getValidToken(): Promise<string | null> {
    const nowMs = Date.now();

    if (_cachedToken && nowMs < _tokenExpiresAtMs - TOKEN_REFRESH_BUFFER_MS) {
        console.info("[Logger] Token reused");
        return _cachedToken;
    }

    const envToken = getEnvToken();
    if (envToken && !isTokenExpired(envToken)) {
        _cachedToken       = envToken;
        _tokenExpiresAtMs  = decodeJwt(envToken);
        console.info("[Logger] Token reused");
        return _cachedToken;
    }

    console.info("[Logger] Retrying authentication");
    const fresh = await authenticate();
    if (fresh) {
        _cachedToken      = fresh;
        _tokenExpiresAtMs = decodeJwt(fresh);
        return _cachedToken;
    }

    console.warn("[Logger] Authentication failed");
    console.warn("[Logger] Skipping remote log");
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
                console.warn("[Logger] Authentication failed");
                _cachedToken      = null; // Invalidate cache
                _tokenExpiresAtMs = 0;    // Force refresh on next call
            } else {
                console.warn(`[Logger] Remote log returned HTTP ${res.status}: ${body}`);
            }
        } else {
            console.info(`[Logger] Log sent successfully`);
        }
    } catch (err) {
        // Network error — never crash the application
        console.warn("[Logger] Authentication failed");
        console.warn("[Logger] Skipping remote log");
    }
}

