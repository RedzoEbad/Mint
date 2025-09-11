"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import InterviewTable from "@/components/interviews/interview-table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function InterviewsPage() {
  return (
    <DashboardLayout title="Interviews">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>All Interviews</CardTitle>
            <CardDescription>Filter, search and review interviews</CardDescription>
          </CardHeader>
          <CardContent>
            <InterviewTable />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}


