// ============================================================
// STRATA TECH — CONFIG
// Swap these values when you go live with a real domain
// ============================================================

const CONFIG = {
  // --- Supabase ---
  // Get these from: Supabase dashboard → Project Settings → API
  SUPABASE_URL: 'https://YOUR_PROJECT.supabase.co',
  SUPABASE_ANON_KEY: 'YOUR_ANON_PUBLIC_KEY',

  // --- Contact ---
  WHATSAPP_NUMBER: '254712924595',   // swap to business line when ready
  BUSINESS_EMAIL: 'hello@stratatech.co.ke',
  BUSINESS_NAME: 'Strata Tech',

  // --- Admin ---
  // Simple password protection for /admin — change this before going live!
  ADMIN_PASSWORD: 'strata2026',

  // --- Feature flags ---
  // Set to true once Supabase is configured
  SUPABASE_ENABLED: false,
  // Set to true once Resend is configured
  EMAIL_ENABLED: false,
};

// Don't edit below this line
window.STRATA_CONFIG = CONFIG;
