/* ==========================================================
 * STAGE 6 – Priority Inbox Algorithm
 *
 * Author: Campus Hiring Evaluation — Principal Engineer Submission
 * Algorithm: Min Heap (Priority Queue) — O(N log K) time, O(K) space
 *
 * Run with:
 *   npx ts-node --transpile-only -P tsconfig.scripts.json src/backend/priority_inbox.ts
 * ==========================================================
 */

/* eslint-disable @typescript-eslint/no-require-imports */
const dotenv    = require("dotenv")        as typeof import("dotenv");
const axiosLib  = require("axios")         as typeof import("axios");

dotenv.config({ path: "../../.env" });

// ── Inline logger proxy ─────────────────────────────────────────────────────
// priority_inbox.ts is a standalone evaluation script; we inline the log call
// here to avoid cross-module ESM/CJS conflicts.
async function Log(
  _stack: string, level: string, _pkg: string, message: string
): Promise<void> {
  const token   = process.env["ACCESS_TOKEN"] ?? "";
  const baseUrl = process.env["BASE_URL"] ?? "http://4.224.186.213/evaluation-service";
  const LABEL   = { info: "INFO", debug: "DEBUG", warn: "WARN", error: "ERROR" };
  const label   = LABEL[level as keyof typeof LABEL] ?? level.toUpperCase();
  console.log(`[${label}] ${message}`);
  try {
    await (axiosLib as any).default.post(
      `${baseUrl}/logs`,
      { stack: "backend", level, package: "service", message },
      { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, timeout: 3000 }
    );
  } catch { /* never crash the script on log failures */ }
}

// ==========================================
// 1. TYPES & INTERFACES
// ==========================================

/** Represents a single notification entity from the API or database. */
interface Notification {
  id: number;
  type: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  studentId: number;
}

/**
 * Priority weights define the importance of each notification category.
 * Placement (3) > Result (2) > Event (1)
 * Unknown types default to 0 (lowest rank).
 */
const PRIORITY_WEIGHTS: Readonly<Record<string, number>> = Object.freeze({
  Placement: 3,
  Result:    2,
  Event:     1,
});

// ==========================================
// 2. GENERIC MIN HEAP IMPLEMENTATION
//    (Zero third-party dependencies — hand-rolled)
// ==========================================

/**
 * A generic Min Heap (Priority Queue) backed by a dynamically-sized array.
 *
 * Heap property: `comparator(heap[parent], heap[child]) <= 0` for every node.
 *
 * For the Top-K algorithm the WEAKEST notification sits at the root so it
 * can be efficiently evicted when a stronger candidate arrives.
 *
 * Complexity:
 *   insert()  — O(log n)
 *   remove()  — O(log n)
 *   peek()    — O(1)
 *   size()    — O(1)
 *   isEmpty() — O(1)
 */
class MinHeap<T> {
  private readonly heap: T[] = [];
  private readonly cmp: (a: T, b: T) => number;

  constructor(comparator: (a: T, b: T) => number) {
    this.cmp = comparator;
  }

  public size(): number    { return this.heap.length; }
  public isEmpty(): boolean { return this.heap.length === 0; }

  /**
   * Returns the minimum element WITHOUT removing it — O(1).
   * Returns `null` if the heap is empty.
   */
  public peek(): T | null {
    return this.heap.length > 0 ? (this.heap[0] as T) : null;
  }

  /**
   * Inserts `value` and restores the heap property — O(log n).
   */
  public insert(value: T): void {
    this.heap.push(value);
    this.bubbleUp(this.heap.length - 1);
  }

  /**
   * Removes and returns the minimum element (root) — O(log n).
   * Returns `null` if the heap is empty.
   */
  public remove(): T | null {
    if (this.isEmpty()) return null;
    if (this.size() === 1) return this.heap.pop() as T;

    const root = this.heap[0] as T;
    this.heap[0] = this.heap.pop() as T; // Move last to root
    this.bubbleDown(0);
    return root;
  }

  // ─── Internal helpers ──────────────────────────────────────────────────

  /**
   * BubbleUp: moves the element at `index` UPWARD until heap invariant holds.
   * The element keeps rising while it is "smaller" (per comparator) than its parent.
   */
  private bubbleUp(index: number): void {
    while (index > 0) {
      const parentIdx = Math.floor((index - 1) / 2);
      const child  = this.heap[index]     as T;
      const parent = this.heap[parentIdx] as T;

      if (this.cmp(child, parent) >= 0) break; // Heap property satisfied
      this.swap(index, parentIdx);
      index = parentIdx;
    }
  }

  /**
   * BubbleDown: moves the element at `index` DOWNWARD until heap invariant holds.
   * The element keeps sinking toward the smaller of its two children.
   */
  private bubbleDown(index: number): void {
    const n = this.heap.length;

    while (true) {
      const left  = 2 * index + 1;
      const right = 2 * index + 2;
      let smallest = index;

      if (left  < n && this.cmp(this.heap[left]  as T, this.heap[smallest] as T) < 0) smallest = left;
      if (right < n && this.cmp(this.heap[right] as T, this.heap[smallest] as T) < 0) smallest = right;

      if (smallest === index) break; // Heap property restored
      this.swap(index, smallest);
      index = smallest;
    }
  }

  /** Swaps two elements in the heap array in-place — O(1). */
  private swap(i: number, j: number): void {
    const tmp    = this.heap[i] as T;
    this.heap[i] = this.heap[j] as T;
    this.heap[j] = tmp;
  }
}

// ==========================================
// 3. COMPARISON LOGIC
// ==========================================

/**
 * Comparator for the Min Heap used in the Top-K algorithm.
 *
 * MIN heap → WEAKEST notification sits at the root (first to be evicted).
 *
 * Ordering rules (ascending = closer to root = evicted first):
 *   1. LOWER priority weight  → smaller → closer to root → evicted first
 *   2. Equal priority weight  → OLDER timestamp → smaller → evicted first
 *
 * comparator(a, b) < 0  ⟹  a is weaker  ⟹  a rises toward root
 * comparator(a, b) > 0  ⟹  b is weaker  ⟹  b rises toward root
 */
function compareNotifications(a: Notification, b: Notification): number {
  const weightA = PRIORITY_WEIGHTS[a.type] ?? 0; // Unknown types ranked lowest
  const weightB = PRIORITY_WEIGHTS[b.type] ?? 0;

  // Rule 1: Lower weight = "smaller" = closer to root = evicted first
  if (weightA !== weightB) return weightA - weightB;

  // Rule 2: Same weight — older timestamp = "smaller" = evicted first
  const tA = new Date(a.timestamp).getTime();
  const tB = new Date(b.timestamp).getTime();
  const safeA = isNaN(tA) ? 0 : tA; // Invalid timestamps treated as epoch
  const safeB = isNaN(tB) ? 0 : tB;

  return safeA - safeB;
}

// ==========================================
// 4. DATA FETCHING & MOCK FALLBACK
// ==========================================

/** Generates a deterministic mock dataset of 25 notifications for local testing. */
function generateMockNotifications(): Notification[] {
  const now = Date.now();

  const fixtures: Array<Pick<Notification, "type" | "message" | "isRead">> = [
    { type: "Placement", message: "Google SWE Internship – Applications open",       isRead: false },
    { type: "Placement", message: "Microsoft FTE – Campus Drive announced",          isRead: false },
    { type: "Placement", message: "Amazon SDE-I – Shortlist released",               isRead: true  },
    { type: "Placement", message: "Flipkart – Coding Round scheduled",               isRead: false },
    { type: "Placement", message: "Goldman Sachs – Interview slots open",            isRead: false },
    { type: "Result",    message: "Semester 5 results published",                    isRead: false },
    { type: "Result",    message: "Supplementary exam results available",            isRead: true  },
    { type: "Result",    message: "Internal assessment marks updated",               isRead: false },
    { type: "Result",    message: "Lab viva scores released",                        isRead: false },
    { type: "Result",    message: "Project grade finalized",                         isRead: true  },
    { type: "Event",     message: "TechFest 2026 – Registration deadline today",     isRead: false },
    { type: "Event",     message: "Hackathon – Team formation portal open",          isRead: false },
    { type: "Event",     message: "AI/ML Workshop – Seats limited",                  isRead: false },
    { type: "Event",     message: "Career Fair – Hall B, 10 AM",                    isRead: true  },
    { type: "Event",     message: "Alumni meet-and-greet – RSVP inside",            isRead: false },
    { type: "Placement", message: "Adobe – Design Engineer test link shared",        isRead: false },
    { type: "Placement", message: "Infosys Springboard – Batch allocation",         isRead: false },
    { type: "Result",    message: "Attendance report for May finalized",             isRead: false },
    { type: "Event",     message: "Robotics Club open house – 3 PM",                isRead: false },
    { type: "Placement", message: "JPMorgan – Coding challenge results out",        isRead: true  },
    { type: "Event",     message: "IEEE guest lecture – Dr. Priya Sharma",           isRead: false },
    { type: "Result",    message: "Scholarship eligibility list released",           isRead: false },
    { type: "Placement", message: "Uber – Product Analyst positions open",           isRead: false },
    { type: "Event",     message: "Sports Day – Registration closes midnight",       isRead: false },
    { type: "Result",    message: "Research grant approval notice",                  isRead: false },
  ];

  // Spread timestamps across the last ~17 days for realistic chronological ordering
  return fixtures.map((f, i) => ({
    id: i + 1,
    studentId: 1042,
    type: f.type,
    message: f.message,
    isRead: f.isRead,
    timestamp: new Date(now - (fixtures.length - i) * 16 * 60 * 60 * 1000).toISOString(),
  }));
}

/** Fetches notifications from the evaluation API; falls back to mock data on any error. */
async function fetchNotifications(): Promise<Notification[]> {
  const token   = process.env["ACCESS_TOKEN"];
  const baseUrl = process.env["BASE_URL"] ?? "http://4.224.186.213/evaluation-service";

  if (!token) {
    await Log("backend", "warn", "service", "ACCESS_TOKEN not found in .env. Using 25-item mock dataset.");
    return generateMockNotifications();
  }

  try {
    await Log("backend", "info", "service", `Fetching notifications from ${baseUrl}/notifications`);

    const response = await (axiosLib as any).default.get(`${baseUrl}/notifications`, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 5_000,
    });

    const data: Notification[] = Array.isArray(response.data) ? response.data : [];
    await Log("backend", "info", "service", `Received ${data.length} notifications from evaluation API.`);
    return data;

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    await Log("backend", "error", "service", `API fetch failed: ${msg}. Falling back to mock data.`);
    return generateMockNotifications();
  }
}

// ==========================================
// 5. TOP-K ALGORITHM  ←  The Core
// ==========================================

/**
 * Returns the Top K most important UNREAD notifications using a Min Heap.
 *
 * ─── Why Min Heap and NOT array sort? ───────────────────────────────────────
 *
 * Naive sort:   Sort ALL N notifications → slice first K
 *   Time:  O(N log N)  — every element compared against every other
 *   Space: O(N)        — entire array must reside in memory
 *
 * Min Heap (this implementation):
 *   Time:  O(N log K)  — each of N elements triggers at most one O(log K) op
 *   Space: O(K)        — heap never exceeds K elements simultaneously
 *
 * Concrete numbers at N = 5,000,000 and K = 10:
 *   Naive sort ≈ 5,000,000 × log₂(5,000,000) ≈ 111,000,000 operations
 *   Heap       ≈ 5,000,000 × log₂(10)         ≈  16,500,000 operations
 *   Speed gain ≈ 6.7× fewer operations
 *   Memory     ≈ 500,000× less (10 items vs 5M items)
 *
 * ─── Algorithm Flow ─────────────────────────────────────────────────────────
 *  FOR every unique, unread notification n:
 *    IF heap.size < K:
 *      heap.insert(n)                     // heap not yet full
 *    ELSE IF compareNotifications(n, root) > 0:
 *      heap.remove()                      // evict current weakest
 *      heap.insert(n)                     // replace with stronger candidate
 *    (else: n cannot improve Top-K — skip)
 *
 *  Extract all elements from heap (yields ascending order)
 *  Reverse → best-first order for the consumer
 *
 * @param k Number of top notifications to return (default: 10)
 */
async function getTopKNotifications(k: number = 10): Promise<Notification[]> {
  const all = await fetchNotifications();

  if (all.length === 0) {
    await Log("backend", "info", "service", "No notifications available. Returning [].");
    return [];
  }

  // Deduplicate by ID (guard against duplicate API payloads)
  const seen = new Set<number>();
  const unique = all.filter(n => { if (seen.has(n.id)) return false; seen.add(n.id); return true; });

  await Log("backend", "info", "service",
    `Building priority queue. Total: ${unique.length}, K=${k}`);

  const heap = new MinHeap<Notification>(compareNotifications);
  let skippedRead = 0, inserts = 0, replacements = 0;

  for (const notif of unique) {

    // ─ Skip read notifications ──────────────────────────────────────────────
    if (notif.isRead) { skippedRead++; continue; }

    // ─ Warn on unknown types (still processed at weight = 0) ───────────────
    if (!(notif.type in PRIORITY_WEIGHTS)) {
      await Log("backend", "warn", "service",
        `Unknown type "${notif.type}" for ID ${notif.id}. Treated as priority 0.`);
    }

    if (heap.size() < k) {
      // Heap not yet at capacity — insert freely
      heap.insert(notif);
      inserts++;
      await Log("backend", "debug", "service",
        `[INSERT]  ID ${notif.id} | ${notif.type} | heap.size=${heap.size()}`);

    } else {
      const root = heap.peek() as Notification;

      // compareNotifications(notif, root) > 0 → notif is STRONGER than the weakest in Top-K
      if (compareNotifications(notif, root) > 0) {
        await Log("backend", "debug", "service",
          `[REPLACE] ID ${notif.id} (${notif.type}) evicts ID ${root.id} (${root.type})`);
        heap.remove();
        heap.insert(notif);
        replacements++;
      }
      // Else: notif is weaker than the current worst — no update needed
    }
  }

  await Log("backend", "info", "service",
    `Queue built. Inserts=${inserts} Replacements=${replacements} ReadSkipped=${skippedRead} HeapSize=${heap.size()}`);

  // Extract: MinHeap yields ascending (weakest → strongest)
  const results: Notification[] = [];
  while (!heap.isEmpty()) results.push(heap.remove() as Notification);

  // Reverse to present STRONGEST first (Rank #1 at index 0)
  results.reverse();

  await Log("backend", "info", "service", `Returning Top ${results.length} notifications.`);
  return results;
}

// ==========================================
// 6. FORMATTED CONSOLE OUTPUT
// ==========================================

function printResults(top10: Notification[]): void {
  const LINE = "═".repeat(96);
  const line = "─".repeat(96);

  console.log(`\n${LINE}`);
  console.log("  STAGE 6 — PRIORITY INBOX: TOP 10 UNREAD NOTIFICATIONS");
  console.log(LINE);
  console.log("  Algorithm   : Min Heap (Priority Queue)");
  console.log("  Time        : O(N log K)  vs  O(N log N) for naive sort");
  console.log("  Space       : O(K)        vs  O(N)       for naive sort");
  console.log("  At N=5M, K=10 → Heap is ~6.7× faster & uses ~500,000× less memory");
  console.log(`${LINE}\n`);

  if (top10.length === 0) {
    console.log("  ⚠️  No unread notifications found.\n");
    return;
  }

  const rows = top10.map((n, i) => ({
    "Rank":      `#${i + 1}`,
    "Priority":  `${PRIORITY_WEIGHTS[n.type] ?? 0} (${n.type})`,
    "Timestamp": new Date(n.timestamp).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
    "Message":   n.message,
  }));

  console.table(rows);

  console.log(`\n${line}`);
  console.log("  COMPLEXITY COMPARISON");
  console.log(`${line}`);
  console.log("  Approach         Time         Space    Scalable?   Memory @ N=5M");
  console.log(`${line}`);
  console.log("  Naive Sort       O(N log N)   O(N)     Poor        ~400 MB");
  console.log("  Min Heap (K=10)  O(N log K)   O(K)     Excellent   < 1 KB  ✓");
  console.log(`${line}\n`);
}

// ==========================================
// 7. ENTRY POINT
// ==========================================

async function run(): Promise<void> {
  console.log("\n==========================================================");
  console.log("  STAGE 6: PRIORITY INBOX ALGORITHM — STARTING");
  console.log("==========================================================\n");
  const top10 = await getTopKNotifications(10);
  printResults(top10);
}

run().catch((err: unknown) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
