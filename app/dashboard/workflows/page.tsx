"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import WorkflowTable from "@/components/workflows/workflow-table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function WorkflowsPage() {
  return (
    <DashboardLayout title="Workflows">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>All Workflows</CardTitle>
            <CardDescription>Filter, search and manage candidate workflows</CardDescription>
          </CardHeader>
          <CardContent>
            <WorkflowTable />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}


