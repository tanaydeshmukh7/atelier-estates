import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';
import { getSupabaseAdminClient } from './supabase-admin';

export type AgencyRole = 'admin' | 'agent';

export interface AuthorizedUser {
  user: User;
  role: AgencyRole;
  client: SupabaseClient;
}

export async function getAuthorizedUser(
  request: Request,
  requiredRole?: AgencyRole,
): Promise<AuthorizedUser | null> {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!token || !url || !publishableKey) return null;

  const client = createClient(url, publishableKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: userData, error: userError } = await client.auth.getUser(token);
  if (userError || !userData.user) return null;

  const { data: member, error: memberError } = await client
    .from('agency_members')
    .select('role')
    .eq('user_id', userData.user.id)
    .maybeSingle();
  if (memberError || !member) return null;

  const role = member.role as AgencyRole;
  if (requiredRole === 'admin' && role !== 'admin') return null;
  return { user: userData.user, role, client };
}

export function getStorageAdminClient() {
  return getSupabaseAdminClient();
}
