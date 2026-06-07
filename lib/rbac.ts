// RBAC re-exports — real implementation lives in lib/supabase-auth.ts.
// Keeping this file as a re-export shim so existing imports keep working
// after we swapped NextAuth stub auth for Supabase Auth.
export {
  getCurrentUser,
  requireUser,
  requireRole,
  type Role,
} from "./supabase-auth";
