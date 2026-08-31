import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from './config.js';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

// Load the voice-call UI after this module has finished initializing.
if (typeof window !== 'undefined') {
  setTimeout(() => import('./voice-call-auto.js').catch(() => {}), 0);
}
