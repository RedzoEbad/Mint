// Central RBAC configuration for roles, features, and route access

export type AppRole = "super_admin" | "admin" | "receptionist" | "process_agent" | "accountant"

// High-level feature permissions per role (UI can use to hide controls; APIs must still enforce)
export const rolePermissions: Record<AppRole, Record<string, string[]>> = {
  super_admin: {
    candidates: ["create", "read", "update", "delete", "export", "pdf"],
    users: ["create", "read", "update", "delete", "assign_roles"],
    companies: ["create", "read", "update", "delete"],
    payments: ["create", "read", "update", "delete", "approve", "export_financials"],
    workflows: ["create", "read", "update", "delete", "reset"],
    reports: ["read", "export"],
    expenses: ["create", "read", "update", "delete", "approve"],
    salaries: ["create", "read", "update", "delete"],
    analytics: ["read"],
  },
  admin: {
    candidates: ["read"],
    users: ["create", "read", "update", "delete", "assign_roles_limited"],
    payments: ["read"],
    workflows: ["read", "reset"],
    reports: ["read"], // summary-only; no financial export
    expenses: [],
    salaries: [],
  },
  receptionist: {
    candidates: ["create", "read", "update", "delete"],
    companies: ["read"],
    workflows: ["read"],
  },
  process_agent: {
    candidates: ["read", "update"],
    companies: ["read", "update"],
    workflows: ["create", "read", "update"],
    interviews: ["create", "read", "update"],
    payments: ["read", "create"], // request approvals
    reports: ["read"], // summary-only
  },
  accountant: {
    candidates: ["read"],
    payments: ["read", "update", "approve"],
    expenses: ["create", "read", "update", "approve"],
    salaries: ["create", "read", "update"],
    reports: ["read"], // summary-only
  },
}

// Route-level role access map used by middleware (most specific path first)
export const routeRoleMap: Record<string, AppRole[]> = {
  // Dashboards
  "/dashboard/admin": ["super_admin", "admin"],
  "/dashboard/users": ["super_admin", "admin"],
  "/dashboard/receptionist": ["receptionist"],
  "/dashboard/agent": ["process_agent", "admin"], // admin oversight
  "/dashboard/accounts": ["accountant", "admin"], // admin oversight
  "/dashboard/candidates": ["super_admin", "receptionist", "process_agent", "admin"],
  "/dashboard/workflows": ["super_admin", "process_agent", "admin"],
  "/dashboard/interviews": ["super_admin", "process_agent"],
  "/dashboard/search": ["super_admin", "process_agent", "admin"],
  "/dashboard/companies": ["super_admin", "process_agent", "admin"],
  "/dashboard/payments": ["super_admin", "accountant", "process_agent", "admin"],
  "/dashboard/expenses": ["super_admin", "accountant"],
  "/dashboard/reports": ["super_admin", "admin", "accountant", "process_agent"],

  // APIs
  "/api/admin/users": ["super_admin", "admin"],
  "/api/candidates": ["super_admin", "receptionist", "process_agent", "admin"],
  "/api/candidates/search": ["super_admin", "process_agent", "admin"],
  "/api/workflows": ["super_admin", "process_agent", "admin"],
  "/api/interviews": ["super_admin", "process_agent"],
  "/api/companies": ["super_admin", "process_agent", "admin", "accountant", "receptionist"],
  "/api/payments": ["super_admin", "accountant", "process_agent", "admin"],
  "/api/expenses": ["super_admin", "accountant"],
  "/api/salaries": ["super_admin", "accountant"],
  "/api/reports": ["super_admin", "admin", "accountant", "process_agent"],

  // Admin-only exports/reports
  "/api/admin/export/candidates": ["super_admin"],
  "/api/admin/reports/financial": ["super_admin"],

  // Generic dashboard entry
  "/dashboard": ["super_admin", "admin", "receptionist", "process_agent", "accountant"],
}


