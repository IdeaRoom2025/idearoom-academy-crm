import { createBrowserClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseKey;

// Create authenticated Supabase client with storage options
export const supabase = createBrowserClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    fetch: fetch.bind(globalThis), // Ensure fetch is bound to avoid issues
  },
});

// Create a direct client for bypassing RLS when needed
// This generally shouldn't be used on the client side
// but can help for testing/debugging
export const supabaseDirectClient = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

// Create a client with service role for admin operations that bypass RLS
export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

// Function to create a client with optional service role
export function createClientWithRole(useRole = false) {
  return createClient(supabaseUrl, useRole ? serviceRoleKey : supabaseKey);
}
