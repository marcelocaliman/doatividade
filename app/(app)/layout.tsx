import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppSidebar } from "@/components/shared/app-sidebar";
import { countUnreadNotifications } from "@/lib/notifications/actions";

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

  // Avatar e nome agora vêm do profile (que pode ter sido sobrescrito
  // por upload manual), com fallback pra metadata do Google.
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  const fullName =
    profile?.full_name ??
    (user.user_metadata?.full_name as string | undefined) ??
    (user.user_metadata?.name as string | undefined) ??
    user.email?.split("@")[0] ??
    "amigo";
  const avatarUrl =
    profile?.avatar_url ??
    (user.user_metadata?.avatar_url as string | undefined) ??
    null;

  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  const isAdmin =
    !!user.email && adminEmails.includes(user.email.toLowerCase());

  const unreadNotifications = await countUnreadNotifications();

  return (
    <div className="flex min-h-screen bg-muted/30">
      <AppSidebar
        user={{
          fullName,
          email: user.email ?? null,
          avatarUrl,
        }}
        isAdmin={isAdmin}
        unreadNotifications={unreadNotifications}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="flex flex-1 flex-col pb-24 lg:pb-0">{children}</main>
      </div>
    </div>
  );
}
