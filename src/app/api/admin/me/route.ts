import { NextResponse } from 'next/server';
import { getAuthorizedUser } from '@/lib/admin-auth';

export async function GET(request: Request) {
  const authorized = await getAuthorizedUser(request);
  if (!authorized) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json({ user: { id: authorized.user.id, email: authorized.user.email }, role: authorized.role });
}
