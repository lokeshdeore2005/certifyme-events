// ============================================================
// supabase-config.js
// Connects every page to the EXTERNAL Supabase project.
// The publishable key is designed to be public (RLS protects data).
// NEVER put a service_role/secret key or DB password here.
// Load order in each HTML page:
//   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
//   <script src="js/supabase-config.js"></script>
// ============================================================
const SUPABASE_URL = "https://xmuslvmkhpinnzlhjfdn.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_iVSvyuT0V8R1Ytde5bYZ-Q_7jkDyeSZ";

// One shared client for the whole site
window.sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
