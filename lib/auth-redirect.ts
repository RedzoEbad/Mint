export type AppRole = "super_admin" | "admin" | "receptionist" | "process_agent" | "accountant"

const DASHBOARD_BY_ROLE: Record<AppRole, string> = {
  super_admin: "/dashboard/admin",
  admin: "/dashboard/admin",
  receptionist: "/dashboard/candidates",
  process_agent: "/dashboard/agent",
  accountant: "/dashboard/accounts",
}

export function getDashboardPathForRole(role?: string | null): string {
  if (!role) return "/dashboard"
  const normalized = String(role).trim().toLowerCase().replace(/\s+/g, "_") as AppRole
  return DASHBOARD_BY_ROLE[normalized] || "/dashboard"
}

/** Wait for NextAuth session after credentials sign-in (needed on Vercel). */
export async function waitForSession(
  getSession: () => Promise<{ user?: { role?: string } } | null>,
  attempts = 15,
  delayMs = 200,
) {
  for (let i = 0; i < attempts; i++) {
    const session = await getSession()
    if (session?.user?.role) return session
    await new Promise((resolve) => setTimeout(resolve, delayMs))
  }
  return null
}
