import { createClient } from "@/src/lib/supabase/server"
import { redirect } from "next/navigation"
import { MerchantShell } from "@/src/components/merchant/MerchantShell"

export default async function MerchantLayout({
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

  // Verify role is MERCHANT or ADMIN
  const role = user.user_metadata?.role;
  if (role !== 'MERCHANT' && role !== 'ADMIN') {
    redirect(`/${locale}`);
  }

  return (
    <MerchantShell>
      {children}
    </MerchantShell>
  )
}
