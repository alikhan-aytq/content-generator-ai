import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = "https://eibhvhksjmyvfcypqrnh.supabase.co";
export const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_fgm3x6XiKDaZ3CYv2rehmA_S-KbkJwn";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
