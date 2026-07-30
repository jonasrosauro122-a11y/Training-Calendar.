/* ==========================================================================
   LAVA Training Portal — Configuration
   --------------------------------------------------------------------------
   Paste your Supabase values below. Both of these are PUBLIC values that are
   safe to ship in a static site (the anon key only works within the rules
   defined by Row Level Security — see supabase-schema.sql).

   Find them in your Supabase dashboard:
     Project Settings  ->  API
       - Project URL   ->  SUPABASE_URL
       - anon / public ->  SUPABASE_ANON_KEY
   ========================================================================== */
window.LAVA_CONFIG = {
  SUPABASE_URL: "YOUR_SUPABASE_PROJECT_URL",
  SUPABASE_ANON_KEY: "YOUR_SUPABASE_ANON_KEY",

  // Name of the public Storage bucket used for VA photos (created in the schema).
  PHOTO_BUCKET: "va-photos",
};
