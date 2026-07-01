// ============================================================
// Stage 7 – Priority Utility (Frontend mirror of Stage 6 algorithm)
// ============================================================
import type { Notification } from "../types/notification";
import { PRIORITY_WEIGHTS } from "../types/notification";

/**
 * Comparator for the Min Heap used in the Top-K algorithm.
 * Mirrors compareNotifications() from Stage 6 backend.
 *
 * MIN heap → WEAKEST notification sits at root (first to be evicted).
 *
 * Rules (ascending = closer to root = evicted first):
 *  1. LOWER priority weight  → smaller → evicted first
 *  2. Equal weight           → OLDER timestamp → evicted first
 */
export function compareNotifications(a: Notification, b: Notification): number {
  const weightA = PRIORITY_WEIGHTS[a.notification_type] ?? 0;
  const weightB = PRIORITY_WEIGHTS[b.notification_type] ?? 0;

  if (weightA !== weightB) return weightA - weightB;

  const tA = new Date(a.created_at).getTime();
  const tB = new Date(b.created_at).getTime();
  const safeA = isNaN(tA) ? 0 : tA;
  const safeB = isNaN(tB) ? 0 : tB;

  return safeA - safeB;
}

/**
 * Generic Min Heap (Priority Queue).
 * Zero third-party dependencies — hand-rolled, identical to Stage 6 backend.
 */
class MinHeap<T> {
  private readonly heap: T[] = [];
  private readonly cmp: (a: T, b: T) => number;

  constructor(comparator: (a: T, b: T) => number) {
    this.cmp = comparator;
  }

  public size(): number { return this.heap.length; }
  public isEmpty(): boolean { return this.heap.length === 0; }

  public peek(): T | null {
    return this.heap.length > 0 ? (this.heap[0] as T) : null;
  }

  public insert(value: T): void {
    this.heap.push(value);
    this.bubbleUp(this.heap.length - 1);
  }

  public remove(): T | null {
    if (this.isEmpty()) return null;
    if (this.size() === 1) return this.heap.pop() as T;
    const root = this.heap[0] as T;
    this.heap[0] = this.heap.pop() as T;
    this.bubbleDown(0);
    return root;
  }

  private bubbleUp(index: number): void {
    while (index > 0) {
      const parentIdx = Math.floor((index - 1) / 2);
      const child = this.heap[index] as T;
      const parent = this.heap[parentIdx] as T;
      if (this.cmp(child, parent) >= 0) break;
      this.swap(index, parentIdx);
      index = parentIdx;
    }
  }

  private bubbleDown(index: number): void {
    const n = this.heap.length;
    while (true) {
      const left = 2 * index + 1;
      const right = 2 * index + 2;
      let smallest = index;
      if (left < n && this.cmp(this.heap[left] as T, this.heap[smallest] as T) < 0) smallest = left;
      if (right < n && this.cmp(this.heap[right] as T, this.heap[smallest] as T) < 0) smallest = right;
      if (smallest === index) break;
      this.swap(index, smallest);
      index = smallest;
    }
  }

  private swap(i: number, j: number): void {
    const tmp = this.heap[i] as T;
    this.heap[i] = this.heap[j] as T;
    this.heap[j] = tmp;
  }
}

/**
 * Returns the Top K most important UNREAD notifications using a Min Heap.
 * O(N log K) time | O(K) space — mirrors Stage 6 backend algorithm.
 *
 * @param notifications   Full notification array (all pages combined or current page)
 * @param k               Number of top notifications to return (default: 10)
 */
export function getTopKNotifications(notifications: Notification[], k: number = 10): Notification[] {
  if (notifications.length === 0) return [];

  // Deduplicate by ID
  const seen = new Set<number>();
  const unique = notifications.filter((n) => {
    if (seen.has(n.notification_id)) return false;
    seen.add(n.notification_id);
    return true;
  });

  const heap = new MinHeap<Notification>(compareNotifications);

  for (const notif of unique) {
    // Skip read notifications in priority inbox
    if (notif.is_read) continue;

    if (heap.size() < k) {
      heap.insert(notif);
    } else {
      const root = heap.peek() as Notification;
      if (compareNotifications(notif, root) > 0) {
        heap.remove();
        heap.insert(notif);
      }
    }
  }

  // Extract all from heap (ascending: weakest → strongest)
  const results: Notification[] = [];
  while (!heap.isEmpty()) results.push(heap.remove() as Notification);

  // Reverse → strongest first
  results.reverse();
  return results;
}

/** Returns the MUI color for a given notification type chip. */
export function getTypeColor(type: string): "warning" | "info" | "success" | "default" {
  switch (type) {
    case "Placement": return "warning";   // Gold
    case "Result":    return "info";      // Blue
    case "Event":     return "success";   // Green
    default:          return "default";
  }
}

/** Returns a human-friendly relative timestamp label. */
export function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "Unknown";

  const now = Date.now();
  const diff = now - date.getTime();
  const minutes = Math.floor(diff / 60_000);
  const hours   = Math.floor(diff / 3_600_000);
  const days    = Math.floor(diff / 86_400_000);

  if (minutes < 1)  return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24)   return `${hours}h ago`;
  if (days === 1)   return "Yesterday";
  if (days < 7)     return `${days}d ago`;

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
