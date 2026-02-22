// rrweb wrapper — buffers events, uploads compressed chunks to Supabase Storage every 30s

const FIRST_CHUNK_DELAY = 10000; // First upload after 10s (catch short sessions)
const CHUNK_INTERVAL = 30000; // Subsequent uploads every 30s
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
    this.isFirstChunk = true;
  }

  async start() {
    try {
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
    } catch (err) {
      console.warn('rrweb recording failed to start:', err);
    }
  }

  scheduleUpload() {
    if (this.destroyed) return;
    const delay = this.isFirstChunk ? FIRST_CHUNK_DELAY : CHUNK_INTERVAL;
    this.timer = setTimeout(() => this.uploadChunk(), delay);
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
    this.isFirstChunk = false;

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
        .catch((err) => {
          console.warn('rrweb chunk upload failed:', err);
        });
    } catch {
      // Silently fail — never block UI
    }

    if (!this.destroyed) this.scheduleUpload();
  }

  // Called on page close — uses fetch keepalive to survive navigation
  flushBeacon() {
    if (this.buffer.length === 0) return;
    const sessionId = this.getSessionId();
    if (!sessionId) return;

    if (this.stopFn) {
      this.stopFn();
      this.stopFn = null;
    }

    const events = this.buffer.splice(0);
    const json = JSON.stringify(events);
    const path = `${sessionId}/chunk-${String(this.chunkIndex).padStart(4, '0')}.json`;
    this.chunkIndex++;

    // Upload uncompressed via REST API with keepalive (survives page close)
    const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/session-recordings/${path}`;
    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
      },
      body: json,
      keepalive: true,
    }).catch(() => {});

    // Update session recording metadata
    const metaUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/tracking_sessions?session_id=eq.${sessionId}`;
    this.totalEvents += events.length;
    fetch(metaUrl, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({
        recording_storage_path: sessionId + '/',
        recording_size_bytes: this.totalSize + json.length,
        recording_event_count: this.totalEvents,
      }),
      keepalive: true,
    }).catch(() => {});
  }

  destroy() {
    this.destroyed = true;
    clearTimeout(this.timer);
    if (this.stopFn) {
      this.stopFn();
      this.stopFn = null;
    }
  }
}
