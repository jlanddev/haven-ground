// rrweb wrapper — buffers events, uploads compressed chunks to Supabase Storage every 30s

const CHUNK_INTERVAL = 30000; // 30 seconds
const MASK_SELECTORS = 'input[type="email"], input[type="tel"]';

export class RrwebRecorder {
  constructor(supabase, getSessionId) {
    this.supabase = supabase;
    this.getSessionId = getSessionId;
    this.stopFn = null;
    this.buffer = [];
    this.chunkIndex = 0;
    this.totalSize = 0;
    this.totalEvents = 0;
    this.timer = null;
    this.destroyed = false;
  }

  async start() {
    // Dynamic import — zero impact on initial page load
    const { record } = await import('rrweb');

    this.stopFn = record({
      emit: (event) => {
        if (this.destroyed) return;
        this.buffer.push(event);
        this.totalEvents++;
      },
      sampling: {
        mousemove: 50,
        mouseInteraction: true,
        scroll: 150,
        input: 'last',
      },
      maskInputOptions: {
        email: true,
        tel: true,
      },
      maskTextSelector: MASK_SELECTORS,
      blockSelector: null,
    });

    this.scheduleUpload();
  }

  scheduleUpload() {
    if (this.destroyed) return;
    this.timer = setTimeout(() => this.uploadChunk(), CHUNK_INTERVAL);
  }

  async uploadChunk() {
    if (this.buffer.length === 0) {
      if (!this.destroyed) this.scheduleUpload();
      return;
    }

    const sessionId = this.getSessionId();
    if (!sessionId) {
      if (!this.destroyed) this.scheduleUpload();
      return;
    }

    const events = this.buffer.splice(0);
    const json = JSON.stringify(events);

    try {
      let body;
      let contentType;
      const path = `${sessionId}/chunk-${String(this.chunkIndex).padStart(4, '0')}.json`;

      // Try browser-native compression
      if (typeof CompressionStream !== 'undefined') {
        const blob = new Blob([json], { type: 'application/json' });
        const cs = new CompressionStream('gzip');
        const compressedStream = blob.stream().pipeThrough(cs);
        body = await new Response(compressedStream).blob();
        contentType = 'application/gzip';
      } else {
        body = new Blob([json], { type: 'application/json' });
        contentType = 'application/json';
      }

      this.totalSize += body.size;
      this.chunkIndex++;

      // Fire-and-forget upload
      this.supabase.storage
        .from('session-recordings')
        .upload(path, body, { contentType, upsert: true })
        .then(() => {
          // Update recording metadata on session
          this.supabase
            .from('tracking_sessions')
            .update({
              recording_storage_path: sessionId + '/',
              recording_size_bytes: this.totalSize,
              recording_event_count: this.totalEvents,
            })
            .eq('session_id', sessionId)
            .then(() => {});
        })
        .catch(() => {});
    } catch {
      // Silently fail — never block UI
    }

    if (!this.destroyed) this.scheduleUpload();
  }

  destroy() {
    this.destroyed = true;
    clearTimeout(this.timer);
    if (this.stopFn) {
      this.stopFn();
      this.stopFn = null;
    }
    // Final upload
    this.uploadChunk();
  }
}
