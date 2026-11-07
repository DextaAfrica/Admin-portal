import { getCurrentSession, createSsoTicket } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { SessionInactivityGuard } from "@/components/auth/SessionInactivityGuard";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, sessionToken } = await getCurrentSession();

  if (!user) {
    redirect("/login");
  }

  // Strict Subdomain Gate Enforcement
  const headersList = await headers();
  const host = (headersList.get("host") || "").toLowerCase();
  const isAdminHost = host.startsWith("admin.") || host.includes("admin.dextaafrica") || host.includes("admin.localhost");
  const isOpsHost = host.startsWith("ops.") || host.includes("ops.dextaafrica") || host.includes("ops.localhost");

  const dept = (user.department || "").toUpperCase();
  const isSuperAdmin = user.role === "SUPER_ADMIN";

  // 1. Operations account on Systems IT subdomain -> automatically redirect to Operations Fleet Desk
  if (isAdminHost && !isSuperAdmin && dept !== "IT") {
    const isLocal = host.includes("localhost") || host.includes("127.0.0.1");
    const port = host.split(":")[1] ? `:${host.split(":")[1]}` : "";
    const opsBase = isLocal ? `http://ops.localhost${port}` : `https://ops.dextaafrica.org`;

    if (sessionToken) {
      const ticket = await createSsoTicket(sessionToken);
      redirect(`${opsBase}/api/auth/sso?ticket=${ticket}&next=/dashboard`);
    } else {
      redirect(`${opsBase}/login`);
    }
  }

  // 2. Systems IT account on Operations subdomain -> automatically redirect to Systems IT Console
  if (isOpsHost && !isSuperAdmin && dept === "IT") {
    const isLocal = host.includes("localhost") || host.includes("127.0.0.1");
    const port = host.split(":")[1] ? `:${host.split(":")[1]}` : "";
    const adminBase = isLocal ? `http://admin.localhost${port}` : `https://admin.dextafrica.org`;

    if (sessionToken) {
      const ticket = await createSsoTicket(sessionToken);
      redirect(`${adminBase}/api/auth/sso?ticket=${ticket}&next=/dashboard`);
    } else {
      redirect(`${adminBase}/login`);
    }
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#fafafa] dark:bg-[#09090b]">
      {/* Real-Time Session Inactivity Guard across All Portals */}
      <SessionInactivityGuard />

      {/* Collapsible Sidebar */}
      <Sidebar user={user} />

      {/* Main Content Area */}
      <div className="relative z-10 flex flex-1 flex-col overflow-hidden min-w-0">
        <Header user={user} />
        <main className="relative z-10 flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl w-full min-w-0">{children}</div>
        </main>
      </div>
    </div>
  );
}

