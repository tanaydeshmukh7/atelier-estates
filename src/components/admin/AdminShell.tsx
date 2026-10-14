'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LayoutDashboard, LogOut, Plus, Settings, Sparkles } from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase';

interface AdminShellProps {
  children: React.ReactNode;
}

export default function AdminShell({ children }: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (pathname === '/admin/login' || pathname === '/admin/reset-password') {
      setChecking(false);
      return;
    }
    const supabase = getSupabaseClient();
    if (!supabase) {
      router.replace('/admin/login');
      return;
    }
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) {
        router.replace('/admin/login');
        return;
      }
      const response = await fetch('/api/admin/me', {
        headers: { Authorization: `Bearer ${data.session.access_token}` },
      });
      if (!response.ok) {
        await supabase.auth.signOut();
        router.replace('/admin/login?error=unauthorized');
        return;
      }
      setEmail(data.session.user.email ?? '');
      setChecking(false);
    });
  }, [pathname, router]);

  async function logout() {
    await getSupabaseClient()?.auth.signOut();
    router.replace('/admin/login');
  }

  if (pathname === '/admin/login' || pathname === '/admin/reset-password') return <>{children}</>;
  if (checking) return <div className="min-h-screen bg-charcoal-900 px-6 pt-40 text-center text-limestone-100">Verifying your agency access…</div>;

  return (
    <div className="min-h-screen bg-limestone-100 pt-28">
      <div className="mx-auto grid max-w-7xl gap-8 px-6 pb-20 lg:grid-cols-[220px_1fr] lg:px-12">
        <aside className="self-start border-b border-charcoal-800/15 pb-6 lg:sticky lg:top-28 lg:border-b-0">
          <div className="mb-8">
            <p className="font-mono text-[10px] uppercase tracking-widest text-terracotta">Agency desk</p>
            <p className="mt-2 truncate text-xs text-charcoal-500">{email}</p>
          </div>
          <nav className="grid gap-1">
            <AdminLink href="/admin" active={pathname === '/admin'} icon={<LayoutDashboard className="h-4 w-4" />}>Overview</AdminLink>
            <AdminLink href="/admin/properties" active={pathname.startsWith('/admin/properties')} icon={<Sparkles className="h-4 w-4" />}>Properties</AdminLink>
            <AdminLink href="/admin/properties/new" active={pathname === '/admin/properties/new'} icon={<Plus className="h-4 w-4" />}>Add property</AdminLink>
          </nav>
          <button onClick={logout} className="mt-8 inline-flex items-center gap-2 text-xs uppercase tracking-wideEditorial text-charcoal-500 hover:text-terracotta">
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </aside>
        <main>{children}</main>
      </div>
    </div>
  );
}

function AdminLink({ href, active, icon, children }: { href: string; active: boolean; icon: React.ReactNode; children: React.ReactNode }) {
  return <Link href={href} className={`flex items-center gap-3 px-3 py-3 text-xs uppercase tracking-wideEditorial ${active ? 'bg-charcoal-800 text-limestone-100' : 'text-charcoal-600 hover:bg-sandstone-tint'}`}>{icon}{children}</Link>;
}
