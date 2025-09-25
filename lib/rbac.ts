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
    workflows: ["read"],
    reports: ["read"],
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
    companies: ["read"],
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
  "/dashboard/super-admin": ["super_admin"],
  "/dashboard/admin": ["admin"],
  "/dashboard/admin/employees": ["super_admin", "admin"],
  "/dashboard/users": ["super_admin", "admin"],
  "/dashboard/receptionist": ["receptionist"],
  "/dashboard/agent": ["process_agent"],
  "/dashboard/accounts": ["accountant"],
  "/dashboard/candidates": ["super_admin", "receptionist", "process_agent"],
  "/dashboard/workflows": ["super_admin", "process_agent", "admin"],
  "/dashboard/admin/engagements": ["super_admin", "admin"],
  
  
  "/dashboard/companies": ["super_admin", "admin"],
  "/dashboard/payments": ["super_admin", "accountant", "process_agent"],
  "/dashboard/expenses": ["super_admin", "accountant"],
  "/dashboard/accounts/salaries": ["super_admin", "accountant"],
  "/dashboard/accounts/expenses": ["super_admin", "accountant"],
  "/dashboard/accounts/reports": ["super_admin", "accountant", "admin"],
  
  "/dashboard/reports": ["super_admin", "admin", "accountant", "process_agent"],

  // APIs
  "/api/admin/users": ["super_admin", "admin"],
  "/api/admin/assignments": ["super_admin", "admin"],
  "/api/candidates": ["super_admin", "receptionist", "process_agent"],
  "/api/candidates/search": ["super_admin", "process_agent"],
  "/api/workflows": ["super_admin", "process_agent", "admin"],
  
  "/api/companies": ["super_admin", "admin", "accountant", "receptionist"],
  "/api/payments": ["super_admin", "accountant", "process_agent", "admin"],
  "/api/expenses": ["super_admin", "accountant", "admin"],
  "/api/salaries": ["super_admin", "accountant", "admin"],
  
  "/api/reports": ["super_admin", "admin", "accountant", "process_agent"],

  // Admin-only exports/reports
  "/api/admin/export/candidates": ["super_admin"],
  "/api/admin/reports/financial": ["super_admin"],

  // Generic dashboard entry
  "/dashboard": ["super_admin", "admin", "receptionist", "process_agent", "accountant"],
}


