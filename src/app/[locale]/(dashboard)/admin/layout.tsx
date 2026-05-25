import { createClient } from "@/src/lib/supabase/server";
import { redirect } from "next/navigation";
import { AdminShell } from "@/src/components/admin/AdminShell";

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const resolvedParams = await params;
  const locale = resolvedParams?.locale || 'ar';

  const supabase = await createClient();
  if (!supabase) {
    redirect(`/${locale}/login`);
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/${locale}/login`);
  }

  const role = user.user_metadata?.role;
  if (role !== 'ADMIN') {
    redirect(`/${locale}`);
  }

  return (
    <AdminShell>
      {children}
    </AdminShell>
  );
}
