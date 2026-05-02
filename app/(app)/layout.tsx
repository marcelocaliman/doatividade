import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppSidebar } from "@/components/shared/app-sidebar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const fullName =
    (user.user_metadata?.full_name as string | undefined) ??
    (user.user_metadata?.name as string | undefined) ??
    user.email?.split("@")[0] ??
    "amigo";
  const avatarUrl = user.user_metadata?.avatar_url as string | undefined;

  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  const isAdmin =
    !!user.email && adminEmails.includes(user.email.toLowerCase());

  return (
    <div className="flex min-h-screen bg-muted/30">
      <AppSidebar
        user={{
          fullName,
          email: user.email ?? null,
          avatarUrl: avatarUrl ?? null,
        }}
        isAdmin={isAdmin}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="flex flex-1 flex-col pb-24 lg:pb-0">{children}</main>
      </div>
    </div>
  );
}
