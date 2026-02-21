// Captures click coordinates (% + px) with element info

export class ClickTracker {
  constructor(batcher, getSessionId, getCurrentStep) {
    this.batcher = batcher;
    this.getSessionId = getSessionId;
    this.getCurrentStep = getCurrentStep;
    this.handler = null;
  }

  start() {
    this.handler = (e) => {
      const sessionId = this.getSessionId();
      if (!sessionId) return;

      const vw = window.innerWidth;
      const vh = window.innerHeight;

      // Build a short CSS selector
      let selector = e.target.tagName.toLowerCase();
      if (e.target.id) selector += '#' + e.target.id;
      else if (e.target.className && typeof e.target.className === 'string') {
        const cls = e.target.className.trim().split(/\s+/).slice(0, 2).join('.');
        if (cls) selector += '.' + cls;
      }

      // Truncate text to 100 chars
      const text = (e.target.textContent || '').trim().slice(0, 100);

      this.batcher.add({
        session_id: sessionId,
        step_number: this.getCurrentStep(),
        x_percent: parseFloat(((e.clientX / vw) * 100).toFixed(3)),
        y_percent: parseFloat(((e.clientY / vh) * 100).toFixed(3)),
        x_pixel: e.clientX,
        y_pixel: e.clientY,
        element_tag: e.target.tagName.toLowerCase(),
        element_text: text || null,
        element_selector: selector,
        clicked_at: new Date().toISOString(),
      });
    };

    document.addEventListener('click', this.handler, { passive: true });
  }

  destroy() {
    if (this.handler) {
      document.removeEventListener('click', this.handler);
      this.handler = null;
    }
  }
}
