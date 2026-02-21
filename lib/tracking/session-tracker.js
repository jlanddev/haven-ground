// Main orchestrator — singleton, initializes all trackers

import { supabase } from '../supabase';
import {
  generateSessionId,
  getOrCreateVisitorId,
  getDeviceInfo,
  parseUTMParams,
  STEP_LABELS,
} from './utils';
import { EventBatcher } from './event-batcher';
import { ClickTracker } from './click-tracker';
import { RrwebRecorder } from './rrweb-recorder';

const HEARTBEAT_INTERVAL = 10000; // 10 seconds

class SessionTracker {
  constructor() {
    this.sessionId = null;
    this.visitorId = null;
    this.currentStep = 1;
    this.stepEnteredAt = null;
    this.heartbeatTimer = null;

    this.clickBatcher = null;
    this.clickTracker = null;
    this.rrwebRecorder = null;
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;
    this.initialized = true;

    this.sessionId = generateSessionId();
    this.visitorId = getOrCreateVisitorId();

    const device = getDeviceInfo();
    const utm = parseUTMParams();

    // Create session row (fire-and-forget)
    supabase
      .from('tracking_sessions')
      .insert({
        session_id: this.sessionId,
        visitor_id: this.visitorId,
        is_active: true,
        last_heartbeat_at: new Date().toISOString(),
        max_step_reached: 1,
        user_agent: device.userAgent,
        screen_width: device.screenWidth,
        screen_height: device.screenHeight,
        viewport_width: device.viewportWidth,
        viewport_height: device.viewportHeight,
        referrer: device.referrer,
        device_type: device.deviceType,
        utm_source: utm.utmSource,
        utm_medium: utm.utmMedium,
        utm_campaign: utm.utmCampaign,
        utm_term: utm.utmTerm,
        utm_content: utm.utmContent,
      })
      .then(() => {})
      .catch(() => {});

    // Track initial step enter
    this.stepEnteredAt = Date.now();
    this.trackStepEvent(1, 'enter');

    // Click tracking
    this.clickBatcher = new EventBatcher(supabase, 'tracking_click_events');
    this.clickBatcher.start();
    this.clickTracker = new ClickTracker(
      this.clickBatcher,
      () => this.sessionId,
      () => this.currentStep
    );
    this.clickTracker.start();

    // rrweb recording
    this.rrwebRecorder = new RrwebRecorder(supabase, () => this.sessionId);
    this.rrwebRecorder.start();

    // Heartbeat
    this.heartbeatTimer = setInterval(() => this.heartbeat(), HEARTBEAT_INTERVAL);

    // Cleanup on page unload
    window.addEventListener('beforeunload', () => this.destroy());
  }

  heartbeat() {
    if (!this.sessionId) return;
    supabase
      .from('tracking_sessions')
      .update({
        is_active: true,
        last_heartbeat_at: new Date().toISOString(),
        max_step_reached: this.currentStep,
      })
      .eq('session_id', this.sessionId)
      .then(() => {})
      .catch(() => {});
  }

  trackStepChange(newStep, selectionValue) {
    if (!this.sessionId) return;
    const prevStep = this.currentStep;
    const now = Date.now();
    const timeOnStep = this.stepEnteredAt ? (now - this.stepEnteredAt) / 1000 : null;

    // Exit previous step
    this.trackStepEvent(prevStep, 'exit', timeOnStep, selectionValue);

    // Enter new step
    this.currentStep = newStep;
    this.stepEnteredAt = now;
    this.trackStepEvent(newStep, 'enter');

    // Update max step reached
    supabase
      .from('tracking_sessions')
      .update({ max_step_reached: Math.max(newStep, prevStep) })
      .eq('session_id', this.sessionId)
      .then(() => {})
      .catch(() => {});
  }

  trackStepEvent(step, action, timeOnStep, selectionValue) {
    const event = {
      session_id: this.sessionId,
      step_number: step,
      step_label: STEP_LABELS[step] || `Step ${step}`,
      action,
      entered_at: new Date().toISOString(),
    };
    if (action === 'exit' || action === 'disqualify') {
      event.exited_at = new Date().toISOString();
      event.time_on_step_seconds = timeOnStep || null;
    }
    if (selectionValue !== undefined) {
      event.selection_value = String(selectionValue);
    }
    supabase.from('tracking_step_events').insert(event).then(() => {}).catch(() => {});
  }

  trackDisqualification(step, reason) {
    if (!this.sessionId) return;
    const now = Date.now();
    const timeOnStep = this.stepEnteredAt ? (now - this.stepEnteredAt) / 1000 : null;

    this.trackStepEvent(step, 'disqualify', timeOnStep, reason);

    supabase
      .from('tracking_sessions')
      .update({
        disqualified: true,
        disqualified_at_step: step,
        disqualified_reason: reason,
        final_step: step,
        is_active: false,
      })
      .eq('session_id', this.sessionId)
      .then(() => {})
      .catch(() => {});
  }

  linkLeadId(leadId) {
    if (!this.sessionId || !leadId) return;
    supabase
      .from('tracking_sessions')
      .update({
        lead_id: leadId,
        completed: true,
        final_step: this.currentStep,
        is_active: false,
      })
      .eq('session_id', this.sessionId)
      .then(() => {})
      .catch(() => {});
  }

  destroy() {
    clearInterval(this.heartbeatTimer);
    if (this.clickTracker) this.clickTracker.destroy();
    if (this.clickBatcher) this.clickBatcher.destroy();
    if (this.rrwebRecorder) this.rrwebRecorder.destroy();

    // Mark session as inactive
    if (this.sessionId) {
      const now = Date.now();
      const timeOnStep = this.stepEnteredAt ? (now - this.stepEnteredAt) / 1000 : null;
      this.trackStepEvent(this.currentStep, 'exit', timeOnStep);

      supabase
        .from('tracking_sessions')
        .update({
          is_active: false,
          ended_at: new Date().toISOString(),
          final_step: this.currentStep,
        })
        .eq('session_id', this.sessionId)
        .then(() => {})
        .catch(() => {});
    }
  }
}

// Singleton
let instance = null;

export function getSessionTracker() {
  if (!instance) {
    instance = new SessionTracker();
  }
  return instance;
}
