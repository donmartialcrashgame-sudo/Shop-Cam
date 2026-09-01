import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from './config.js';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

// Shared Shop Camzon enhancements: voice-call UI + in-page Customer Care chat.
if (typeof window !== 'undefined') {
  setTimeout(() => {
    import('./voice-call-auto.js').catch(() => {});
    import('./customer-care-drawer.js').then(({ mountCustomerCareDrawer }) => {
      try { mountCustomerCareDrawer(); } catch (_) {}
    }).catch(() => {});
  }, 0);
}
