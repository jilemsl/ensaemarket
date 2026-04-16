import { createClient } from '@supabase/supabase-js';

// Ce fichier permet à votre site de parler à votre base de données
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);