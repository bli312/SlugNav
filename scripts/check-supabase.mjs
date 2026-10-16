// Read-only connection check. Run with npm run check:backend after creating .env.local.
const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

try {
  if (!url || !key) {
    throw new Error('Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local.');
  }

  const parsedUrl = new URL(url);
  if (
    !['https:', 'http:'].includes(parsedUrl.protocol) ||
    parsedUrl.pathname !== '/' ||
    parsedUrl.search ||
    parsedUrl.hash
  ) {
    throw new Error('Use the project API URL, not the Supabase dashboard URL.');
  }

  if (!key.startsWith('sb_publishable_')) {
    throw new Error('Use the project publishable key (sb_publishable_), never a secret or service-role key.');
  }

  // The Data API's schema endpoint requires a server key. Check the public
  // Auth endpoint here; verify database access alongside the actual tables.
  const response = await fetch(new URL('/auth/v1/settings', url), {
    headers: { apikey: key },
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    throw new Error(`Auth API returned HTTP ${response.status}. Check the project URL/key and that the project is running.`);
  }

  await response.json();
  console.log('Supabase Auth API: reachable. Project URL and publishable key accepted.');
  console.log('Database access and row-level security need separate tests when tables are added.');
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Supabase connection check failed.');
  process.exitCode = 1;
}
