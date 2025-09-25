"use client"

import AdminDashboard from "../admin/page"

export default function SuperAdminDashboard() {
  // For now reuse Admin dashboard component, which already includes Reports tab.
  // Super Admin retains full controls; the Admin page hides download button,
  // but Super Admin route can keep it via environment/role checks in API.
  return <AdminDashboard />
}


