// Batches events and flushes via requestIdleCallback every 5s

export class EventBatcher {
  constructor(supabase, tableName, { flushInterval = 5000 } = {}) {
    this.supabase = supabase;
    this.tableName = tableName;
    this.queue = [];
    this.flushInterval = flushInterval;
    this.timer = null;
    this.destroyed = false;
  }

  start() {
    this.scheduleFlush();
  }

  add(event) {
    if (this.destroyed) return;
    this.queue.push(event);
  }

  scheduleFlush() {
    if (this.destroyed) return;
    this.timer = setTimeout(() => {
      if (typeof requestIdleCallback === 'function') {
        requestIdleCallback(() => this.flush());
      } else {
        this.flush();
      }
    }, this.flushInterval);
  }

  async flush() {
    if (this.queue.length === 0) {
      if (!this.destroyed) this.scheduleFlush();
      return;
    }

    const batch = this.queue.splice(0);
    this.supabase.from(this.tableName).insert(batch).then(() => {}).catch(() => {});

    if (!this.destroyed) this.scheduleFlush();
  }

  destroy() {
    this.destroyed = true;
    clearTimeout(this.timer);
    // Final flush
    if (this.queue.length > 0) {
      const batch = this.queue.splice(0);
      this.supabase.from(this.tableName).insert(batch).then(() => {}).catch(() => {});
    }
  }
}
