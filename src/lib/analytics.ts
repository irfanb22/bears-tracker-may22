import posthog from 'posthog-js';
import type { User } from '@supabase/supabase-js';

const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY;
const POSTHOG_HOST = import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com';

let analyticsInitialized = false;

export const ANALYTICS_EVENTS = {
  pageViewed: 'page_viewed',
  navClicked: 'nav_clicked',
  categoryFilterChanged: 'category_filter_changed',
  paginationChanged: 'pagination_changed',
  signupCtaClicked: 'signup_cta_clicked',
  loginCtaClicked: 'login_cta_clicked',
  authModalOpened: 'auth_modal_opened',
  authSwitchClicked: 'auth_switch_clicked',
  signupSubmitted: 'signup_submitted',
  signupSucceeded: 'signup_succeeded',
  signupFailed: 'signup_failed',
  loginSubmitted: 'login_submitted',
  loginSucceeded: 'login_succeeded',
  loginFailed: 'login_failed',
  passwordResetRequested: 'password_reset_requested',
  logoutClicked: 'logout_clicked',
  predictionCardViewed: 'prediction_card_viewed',
  predictionStarted: 'prediction_started',
  predictionAuthGateHit: 'prediction_auth_gate_hit',
  predictionSubmitted: 'prediction_submitted',
  predictionSubmitFailed: 'prediction_submit_failed',
  predictionEditorOpened: 'prediction_editor_opened',
  dashboardViewed: 'dashboard_viewed',
  dashboardFilterChanged: 'dashboard_filter_changed',
  dashboardPredictionOpened: 'dashboard_prediction_opened',
  displayNameEditStarted: 'display_name_edit_started',
  displayNameSaved: 'display_name_saved',
  displayNameSaveFailed: 'display_name_save_failed',
  leaderboardViewed: 'leaderboard_viewed',
  seasonRecapViewed: 'season_recap_viewed',
  seasonRecapCtaClicked: 'season_recap_cta_clicked',
} as const;

type EventName = (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];
type EventProperties = Record<string, string | number | boolean | null | undefined>;

function isBrowser() {
  return typeof window !== 'undefined';
}

function analyticsEnabled() {
  return analyticsInitialized && isBrowser();
}

function currentPath() {
  if (!isBrowser()) return undefined;
  return `${window.location.pathname}${window.location.search}`;
}

export function initAnalytics() {
  if (!isBrowser() || analyticsInitialized || !POSTHOG_KEY) {
    return false;
  }

  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    capture_pageview: false,
    capture_pageleave: false,
    person_profiles: 'identified_only',
    disable_session_recording: false,
    maskAllInputs: true,
    autocapture: true,
    loaded: () => {
      posthog.register({
        app_name: 'bears-prediction-tracker',
        is_authenticated: false,
      });
    },
  });

  analyticsInitialized = true;
  return true;
}

export function captureEvent(event: EventName, properties: EventProperties = {}) {
  if (!analyticsEnabled()) return;

  posthog.capture(event, {
    current_path: currentPath(),
    ...properties,
  });
}

export function capturePageView(routeName: string, properties: EventProperties = {}) {
  captureEvent(ANALYTICS_EVENTS.pageViewed, {
    path: currentPath(),
    route_name: routeName,
    ...properties,
  });
}

export function identifyAnalyticsUser(user: User, properties: EventProperties = {}) {
  if (!analyticsEnabled()) return;

  posthog.identify(user.id, {
    email: user.email,
    created_at: user.created_at,
    ...properties,
  });

  posthog.register({
    is_authenticated: true,
    user_id: user.id,
  });
}

export function resetAnalyticsUser() {
  if (!analyticsEnabled()) return;

  posthog.reset();
  posthog.register({
    app_name: 'bears-prediction-tracker',
    is_authenticated: false,
  });
}
